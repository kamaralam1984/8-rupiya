import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/lib/models/Payment';

/**
 * GET /api/payment/status/[paymentId]
 * Get payment status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    await connectDB();

    const { paymentId } = await params;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        payment: {
          id: payment._id,
          orderId: payment.orderId,
          status: payment.status,
          amount: payment.amount / 100, // Convert paise to rupees
          currency: payment.currency,
          planType: payment.planType,
          gateway: payment.gateway,
          paidAt: payment.paidAt,
          createdAt: payment.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check payment status',
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}


