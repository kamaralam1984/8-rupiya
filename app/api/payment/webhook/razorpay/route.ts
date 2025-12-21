import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/lib/models/Payment';
import AgentShop from '@/lib/models/AgentShop';
import Agent from '@/lib/models/Agent';
import { verifyPaymentSignature, getPaymentDetails } from '@/lib/utils/razorpay';
import { calculateAgentCommission } from '@/app/utils/pricing';
import crypto from 'crypto';

/**
 * POST /api/payment/webhook/razorpay
 * Razorpay payment webhook handler
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const webhookSignature = request.headers.get('x-razorpay-signature');

    if (!webhookSignature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    const bodyString = JSON.stringify(body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyString)
      .digest('hex');

    if (webhookSignature !== expectedSignature) {
      console.error('Invalid Razorpay webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const { event, payload } = body;

    // Handle payment.captured event (from checkout)
    if (event === 'payment.captured') {
      const paymentEntity = payload.payment.entity;
      const orderId = paymentEntity.order_id;

      // Find payment record
      const payment = await Payment.findOne({
        razorpayOrderId: orderId,
        gateway: 'RAZORPAY',
      });

      if (!payment) {
        console.error('Payment not found for order:', orderId);
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        );
      }

      // Verify payment status
      if (paymentEntity.status === 'captured' && payment.status !== 'SUCCESS') {
        // Verify payment signature
        const isValidSignature = verifyPaymentSignature({
          orderId: orderId,
          paymentId: paymentEntity.id,
          signature: paymentEntity.signature || '',
        });

        if (!isValidSignature) {
          console.error('Invalid payment signature');
          payment.status = 'FAILED';
          payment.errorMessage = 'Invalid signature';
          await payment.save();
          return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 400 }
          );
        }

        // Verify amount matches
        if (paymentEntity.amount !== payment.amount) {
          payment.status = 'FAILED';
          payment.errorMessage = `Amount mismatch. Expected: ${payment.amount}, Got: ${paymentEntity.amount}`;
          await payment.save();
          return NextResponse.json(
            { error: 'Amount mismatch' },
            { status: 400 }
          );
        }

        // Update payment record
        payment.status = 'SUCCESS';
        payment.paymentId = paymentEntity.id;
        payment.razorpayPaymentId = paymentEntity.id;
        payment.paidAt = new Date();
        await payment.save();

        // Update shop payment status
        const shop = await AgentShop.findById(payment.shopId);
        if (shop) {
          const wasPending = shop.paymentStatus === 'PENDING';
          const planAmount = payment.amount / 100; // Convert paise to rupees
          const agentCommission = calculateAgentCommission(payment.planType, planAmount);

          shop.paymentStatus = 'PAID';
          shop.paymentMode = 'UPI';
          shop.planType = payment.planType;
          shop.planAmount = planAmount;
          shop.amount = planAmount;
          shop.agentCommission = agentCommission;
          shop.receiptNo = payment.metadata?.receiptNo || `REC${Date.now()}`;
          shop.lastPaymentDate = new Date();

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
            }
          }
        }
      }
    }

    // Handle payment_link.paid event (from payment links/QR code)
    if (event === 'payment_link.paid') {
      const paymentLinkEntity = payload.payment_link.entity;
      const paymentLinkId = paymentLinkEntity.id;
      const paymentEntity = payload.payment.entity;
      const orderId = paymentEntity.order_id;

      // Find payment record by payment link ID or order ID
      const payment = await Payment.findOne({
        $or: [
          { razorpayPaymentLinkId: paymentLinkId },
          { razorpayOrderId: orderId },
        ],
        gateway: 'RAZORPAY',
      });

      if (!payment) {
        console.error('Payment not found for payment link:', paymentLinkId);
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        );
      }

      // Verify payment status
      if (paymentEntity.status === 'captured' && payment.status !== 'SUCCESS') {
        // Verify payment signature
        const isValidSignature = verifyPaymentSignature({
          orderId: orderId,
          paymentId: paymentEntity.id,
          signature: paymentEntity.signature || '',
        });

        if (!isValidSignature) {
          console.error('Invalid payment signature');
          payment.status = 'FAILED';
          payment.errorMessage = 'Invalid signature';
          await payment.save();
          return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 400 }
          );
        }

        // Verify amount matches
        if (paymentEntity.amount !== payment.amount) {
          payment.status = 'FAILED';
          payment.errorMessage = `Amount mismatch. Expected: ${payment.amount}, Got: ${paymentEntity.amount}`;
          await payment.save();
          return NextResponse.json(
            { error: 'Amount mismatch' },
            { status: 400 }
          );
        }

        // Update payment record
        payment.status = 'SUCCESS';
        payment.paymentId = paymentEntity.id;
        payment.razorpayPaymentId = paymentEntity.id;
        payment.razorpayPaymentLinkId = paymentLinkId;
        payment.paidAt = new Date();
        await payment.save();

        // Update shop payment status
        const shop = await AgentShop.findById(payment.shopId);
        if (shop) {
          const wasPending = shop.paymentStatus === 'PENDING';
          const planAmount = payment.amount / 100; // Convert paise to rupees
          const agentCommission = calculateAgentCommission(payment.planType, planAmount);

          shop.paymentStatus = 'PAID';
          shop.paymentMode = 'UPI';
          shop.planType = payment.planType;
          shop.planAmount = planAmount;
          shop.amount = planAmount;
          shop.agentCommission = agentCommission;
          shop.receiptNo = payment.metadata?.receiptNo || `REC${Date.now()}`;
          shop.lastPaymentDate = new Date();

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
            }
          }
        }
      }
    }

    return NextResponse.json(
      { success: true, message: 'Webhook processed' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Razorpay webhook error:', error);
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}


