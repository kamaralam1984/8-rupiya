import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/lib/models/Payment';
import AgentShop from '@/lib/models/AgentShop';
import Agent from '@/lib/models/Agent';
import { verifyPhonePeSignature, checkPhonePeStatus } from '@/lib/utils/phonepe';
import { calculateAgentCommission } from '@/app/utils/pricing';

/**
 * POST /api/payment/webhook/phonepe
 * PhonePe payment webhook handler
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { response } = body;

    if (!response) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    // Decode base64 response
    const decodedResponse = JSON.parse(Buffer.from(response, 'base64').toString('utf-8'));
    const { merchantTransactionId, transactionId, state, code } = decodedResponse;

    if (!merchantTransactionId) {
      return NextResponse.json(
        { error: 'Missing merchantTransactionId' },
        { status: 400 }
      );
    }

    // Find payment record
    const payment = await Payment.findOne({
      razorpayOrderId: merchantTransactionId, // PhonePe uses merchantTransactionId
      gateway: 'PHONEPE',
    });

    if (!payment) {
      console.error('Payment not found for merchantTransactionId:', merchantTransactionId);
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Verify signature
    const { getPhonePeConfig } = await import('@/lib/utils/phonepe');
    const config = getPhonePeConfig();
    const isValidSignature = verifyPhonePeSignature(
      response,
      request.headers.get('x-verify') || '',
      config.saltKey,
      config.saltIndex
    );

    if (!isValidSignature) {
      console.error('Invalid PhonePe signature');
      payment.status = 'FAILED';
      payment.errorMessage = 'Invalid signature';
      await payment.save();
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Check payment status
    if (state === 'SUCCESS' && code === 'PAYMENT_SUCCESS') {
      // Double-check with PhonePe API
      const statusCheck = await checkPhonePeStatus(merchantTransactionId);
      
      if (statusCheck.success && statusCheck.data?.success) {
        const paymentData = statusCheck.data.data;
        
        if (paymentData.state === 'COMPLETED' && paymentData.responseCode === 'SUCCESS') {
          // Payment successful
          if (payment.status !== 'SUCCESS') {
            payment.status = 'SUCCESS';
            payment.paymentId = transactionId || paymentData.transactionId;
            payment.razorpayPaymentId = transactionId || paymentData.transactionId;
            payment.paidAt = new Date();
            await payment.save();

            // Update shop payment status
            const shop = await AgentShop.findById(payment.shopId);
            if (shop) {
              const wasPending = shop.paymentStatus === 'PENDING';
              const planAmount = payment.amount / 100; // Convert paise to rupees
              const agentCommission = calculateAgentCommission(payment.planType, planAmount);

              shop.paymentStatus = 'PAID';
              shop.paymentMode = 'NONE';
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

          return NextResponse.json(
            { success: true, message: 'Payment processed successfully' },
            { status: 200 }
          );
        }
      }
    }

    // Payment failed
    if (payment.status === 'PENDING') {
      payment.status = 'FAILED';
      payment.errorMessage = `Payment failed: ${code || state}`;
      await payment.save();
    }

    return NextResponse.json(
      { success: false, message: 'Payment not successful' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('PhonePe webhook error:', error);
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

