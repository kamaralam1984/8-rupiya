import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/lib/models/Payment';
import AgentShop from '@/lib/models/AgentShop';
import Agent from '@/lib/models/Agent';
import { verifyPaymentSignature, fetchPaymentDetails } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    // Validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: 'Missing payment details' },
        { status: 400 }
      );
    }

    // Verify signature
    const isValid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Find payment record
    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'Payment record not found' },
        { status: 404 }
      );
    }

    // Check if already processed
    if (payment.status === 'SUCCESS') {
      return NextResponse.json({
        success: true,
        message: 'Payment already processed',
        payment,
      });
    }

    // Fetch payment details from Razorpay
    const paymentDetailsResult = await fetchPaymentDetails(razorpay_payment_id);
    
    if (!paymentDetailsResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to fetch payment details from Razorpay',
        },
        { status: 500 }
      );
    }

    const razorpayPayment = paymentDetailsResult.payment;

    // Update payment record
    payment.status = 'SUCCESS';
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.paidAt = new Date();
    payment.paymentId = razorpay_payment_id;
    payment.paymentSignature = razorpay_signature;
    
    // Save success message in metadata
    if (!payment.metadata) {
      payment.metadata = {};
    }
    payment.metadata.successMessage = `Payment successful! Order ID: ${razorpay_order_id}, Payment ID: ${razorpay_payment_id}, Amount: ₹${(payment.amount / 100).toFixed(2)}`;

    await payment.save();

    // Update shop payment status (only if shopId exists)
    if (payment.shopId) {
      const shop = await AgentShop.findById(payment.shopId);
      if (shop) {
      shop.paymentStatus = 'PAID';
      shop.paymentMode = 'UPI';
      shop.amount = payment.amount / 100; // Convert paise to rupees
      shop.planType = payment.planType;
      shop.planAmount = payment.amount / 100;
      shop.lastPaymentDate = new Date();
      shop.receiptNo = payment.metadata?.receiptNo || '';
      
      // Set payment expiry date to 365 days from now
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 365);
      shop.paymentExpiryDate = expiryDate;

      // Calculate commissions
      const amountInRupees = payment.amount / 100;
      const agentCommissionPercent = 20; // 20% to agent
      const operatorCommissionPercent = 15; // 15% of remaining after agent commission

      shop.agentCommission = (amountInRupees * agentCommissionPercent) / 100;
      const remainingAfterAgent = amountInRupees - shop.agentCommission;
      shop.operatorCommission = (remainingAfterAgent * operatorCommissionPercent) / 100;

      await shop.save();

        // Update agent's total earnings if agentId exists
        if (payment.agentId) {
          const agent = await Agent.findById(payment.agentId);
          if (agent) {
            agent.totalEarnings += shop.agentCommission;
            await agent.save();
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment: {
        orderId: payment.razorpayOrderId,
        paymentId: payment.razorpayPaymentId,
        amount: payment.amount / 100, // Convert to rupees for display
        currency: payment.currency,
        status: payment.status,
        planType: payment.planType,
        receiptNo: payment.metadata?.receiptNo,
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Payment verification error:', error);
    }
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
