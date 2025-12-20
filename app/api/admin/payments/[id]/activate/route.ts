import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/lib/models/Payment';
import Subscription from '@/lib/models/Subscription';
import AgentShop from '@/lib/models/AgentShop';
import Agent from '@/lib/models/Agent';
import Operator from '@/lib/models/Operator';
import { requireAdmin } from '@/lib/auth';
import { calculateAgentCommission, calculateOperatorCommission } from '@/app/utils/pricing';

/**
 * POST /api/admin/payments/[id]/activate
 * Manually activate a payment and create subscription (Admin only)
 */
export const POST = requireAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await connectDB();

    const { id } = await params;
    const payment = await Payment.findById(id);

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    if (payment.status === 'SUCCESS') {
      return NextResponse.json(
        { error: 'Payment is already activated' },
        { status: 400 }
      );
    }

    // Update payment status
    payment.status = 'SUCCESS';
    payment.paidAt = new Date();
    await payment.save();

    // Update shop payment status
    const shop = await AgentShop.findById(payment.shopId);
    if (shop) {
      const wasPending = shop.paymentStatus === 'PENDING';
      const planAmount = payment.amount / 100; // Convert paise to rupees
      const agentCommission = calculateAgentCommission(payment.planType, planAmount);
      const operatorCommission = calculateOperatorCommission(payment.planType, planAmount, agentCommission);

      shop.paymentStatus = 'PAID';
      shop.paymentMode = 'UPI'; // Online payments are UPI
      shop.planType = payment.planType;
      shop.planAmount = planAmount;
      shop.amount = planAmount;
      shop.agentCommission = agentCommission;
      shop.operatorCommission = operatorCommission;
      shop.receiptNo = payment.metadata?.receiptNo || `REC${Date.now()}`;
      shop.lastPaymentDate = new Date();

      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 365);
      shop.paymentExpiryDate = expiryDate;

      await shop.save();

      // Create subscription if it doesn't exist
      let subscription = await Subscription.findOne({ paymentId: payment._id });
      if (!subscription) {
        subscription = await Subscription.create({
          shopId: shop._id,
          agentId: payment.agentId,
          // shopperId is not in Payment model, get from shop if needed
          ...(shop.shopperId && { shopperId: shop.shopperId }),
          planType: payment.planType,
          planAmount: planAmount,
          status: 'ACTIVE',
          startDate: startDate,
          expiryDate: expiryDate,
          paymentId: payment._id,
          autoRenew: false,
          notes: `Manually activated by admin`,
        });

        // Subscription created and linked via paymentId in Subscription model
        // No need to store subscriptionId in Payment model
      }

      // Update agent earnings if payment was pending
      if (wasPending && payment.agentId) {
        const agent = await Agent.findById(payment.agentId);
        if (agent) {
          agent.totalEarnings = (agent.totalEarnings || 0) + agentCommission;
          agent.totalShops = (agent.totalShops || 0) + 1;
          await agent.save();

          // Update operator commission if agent has an operator
          if (agent.operatorId && operatorCommission > 0) {
            try {
              const operator = await Operator.findById(agent.operatorId);
              if (operator) {
                operator.totalEarnings = (operator.totalEarnings || 0) + operatorCommission;
                await operator.save();
              }
            } catch (operatorError: any) {
              console.error('Error updating operator commission:', operatorError);
            }
          }
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Payment activated successfully',
        payment: {
          _id: payment._id,
          status: payment.status,
          // subscriptionId not in Payment model
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error activating payment:', error);
    return NextResponse.json(
      {
        error: 'Failed to activate payment',
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
});



