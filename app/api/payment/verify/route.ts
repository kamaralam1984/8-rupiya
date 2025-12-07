import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop';
import AdminShop from '@/lib/models/Shop';

/**
 * POST /api/payment/verify
 * Verify UPI payment (simulated - in production, integrate with payment gateway)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { paymentId, amount, shopName, ownerName, mobile } = body;

    if (!paymentId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Payment ID and amount are required' },
        { status: 400 }
      );
    }

    // In production, this would verify with actual payment gateway
    // For now, we'll simulate verification by checking if payment exists
    // You can integrate with Razorpay, Paytm, PhonePe, etc.

    // Simulated verification logic
    // In real implementation, check payment gateway API
    const isVerified = await simulatePaymentVerification(paymentId, amount);

    if (isVerified) {
      // Update shop payment status if shop exists
      try {
        const agentShop = await AgentShop.findOne({
          shopName: shopName,
          ownerName: ownerName,
          mobile: mobile,
        });

        if (agentShop && agentShop.paymentStatus === 'PENDING') {
          agentShop.paymentStatus = 'PAID';
          agentShop.paymentMode = 'UPI';
          agentShop.lastPaymentDate = new Date();
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 365);
          agentShop.paymentExpiryDate = expiryDate;
          await agentShop.save();
        }

        // Also update admin shop
        const adminShop = await AdminShop.findOne({
          shopName: shopName,
          ownerName: ownerName,
        });

        if (adminShop) {
          adminShop.lastPaymentDate = new Date();
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 365);
          adminShop.paymentExpiryDate = expiryDate;
          await adminShop.save();
        }
      } catch (updateError) {
        console.error('Error updating shop payment:', updateError);
        // Continue even if update fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        verified: isVerified,
        paymentId: paymentId,
        message: isVerified ? 'Payment verified successfully' : 'Payment not verified yet',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}

/**
 * Simulate payment verification
 * In production, replace this with actual payment gateway API call
 */
async function simulatePaymentVerification(paymentId: string, amount: number): Promise<boolean> {
  // Simulated: In production, call payment gateway API
  // Example with Razorpay:
  // const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  // const payment = await razorpay.payments.fetch(paymentId);
  // return payment.status === 'captured' && payment.amount === amount * 100; // Amount in paise

  // For demo: Return true after a delay (simulating payment processing)
  // In real scenario, user would have already paid via UPI app
  // and we verify with payment gateway
  
  // Simulate: Check if payment was made (in production, this checks actual gateway)
  // For now, we'll return false and let user manually verify
  // In production, integrate with payment gateway webhook or polling
  
  return false; // Default: payment not verified (user needs to manually confirm)
}

