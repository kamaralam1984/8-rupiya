import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/lib/models/Payment';
import AgentShop from '@/lib/models/AgentShop';
import Agent from '@/lib/models/Agent';
import Operator from '@/lib/models/Operator';
import { verifyPaymentSignature, getPaymentDetails } from '@/lib/utils/razorpay';
import { calculateAgentCommission, calculateOperatorCommission } from '@/app/utils/pricing';

/**
 * POST /api/payment/verify-razorpay
 * Verify Razorpay payment after successful payment
 * 
 * Body:
 * - razorpay_order_id: string
 * - razorpay_payment_id: string
 * - razorpay_signature: string
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required payment parameters' },
        { status: 400 }
      );
    }

    // Find payment record
    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment order not found' },
        { status: 404 }
      );
    }

    // Check if already processed
    if (payment.status === 'SUCCESS') {
      return NextResponse.json(
        { 
          success: true, 
          message: 'Payment already verified',
          payment: {
            id: payment._id,
            status: payment.status,
            shopId: payment.shopId,
          }
        },
        { status: 200 }
      );
    }

    // Verify payment signature
    const isValidSignature = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValidSignature) {
      payment.status = 'FAILED';
      payment.errorMessage = 'Invalid payment signature';
      await payment.save();

      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Fetch payment details from Razorpay
    let razorpayPayment;
    try {
      razorpayPayment = await getPaymentDetails(razorpay_payment_id);
    } catch (error: any) {
      console.error('Error fetching payment from Razorpay:', error);
      payment.status = 'FAILED';
      payment.errorMessage = `Failed to fetch payment details: ${error.message}`;
      await payment.save();

      return NextResponse.json(
        { error: 'Failed to verify payment with Razorpay' },
        { status: 500 }
      );
    }

    // Verify payment status
    if (razorpayPayment.status !== 'captured' && razorpayPayment.status !== 'authorized') {
      payment.status = 'FAILED';
      payment.errorMessage = `Payment status: ${razorpayPayment.status}`;
      await payment.save();

      return NextResponse.json(
        { error: `Payment not successful. Status: ${razorpayPayment.status}` },
        { status: 400 }
      );
    }

    // Verify amount matches
    const expectedAmount = payment.amount; // Already in paise
    if (razorpayPayment.amount !== expectedAmount) {
      payment.status = 'FAILED';
      payment.errorMessage = `Amount mismatch. Expected: ${expectedAmount}, Got: ${razorpayPayment.amount}`;
      await payment.save();

      return NextResponse.json(
        { error: 'Payment amount mismatch' },
        { status: 400 }
      );
    }

    // Update payment record
    payment.status = 'SUCCESS';
    payment.paymentId = razorpay_payment_id;
    payment.paymentSignature = razorpay_signature;
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.paidAt = new Date();
    
    // Add success message to metadata
    if (!payment.metadata) {
      payment.metadata = {};
    }
    payment.metadata.successMessage = `Payment Successful`;
    
    await payment.save();

    // Update shop payment status
    const shop = await AgentShop.findById(payment.shopId);
    if (shop) {
      const wasPending = shop.paymentStatus === 'PENDING';
      
      // Calculate commission
      const planAmount = payment.amount / 100; // Convert paise to rupees
      const agentCommission = calculateAgentCommission(payment.planType, planAmount);
      const operatorCommission = calculateOperatorCommission(payment.planType, planAmount, agentCommission);

      // Update shop payment details
      shop.paymentStatus = 'PAID';
      shop.paymentMode = 'NONE';
      shop.planType = payment.planType;
      shop.planAmount = planAmount;
      shop.amount = planAmount;
      shop.agentCommission = agentCommission;
      shop.operatorCommission = operatorCommission;
      shop.receiptNo = payment.metadata?.receiptNo || `REC${Date.now()}`;
      shop.lastPaymentDate = new Date();
      
      // Set expiry date (365 days)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 365);
      shop.paymentExpiryDate = expiryDate;

      await shop.save();

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
        message: 'Payment verified successfully',
        payment: {
          id: payment._id,
          orderId: payment.orderId,
          status: payment.status,
          amount: payment.amount / 100, // Convert paise to rupees
          shopId: payment.shopId,
          planType: payment.planType,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { 
        error: 'Payment verification failed', 
        details: error.message || 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}

