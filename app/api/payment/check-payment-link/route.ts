import { NextRequest, NextResponse } from 'next/server';
import { getPaymentLinkDetails } from '@/lib/utils/razorpay';

/**
 * GET /api/payment/check-payment-link
 * Check payment link status
 * 
 * Query params:
 * - paymentLinkId: string
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentLinkId = searchParams.get('paymentLinkId');

    if (!paymentLinkId) {
      return NextResponse.json(
        { error: 'paymentLinkId is required' },
        { status: 400 }
      );
    }

    // Fetch payment link details from Razorpay
    const paymentLink = await getPaymentLinkDetails(paymentLinkId);

    return NextResponse.json({
      success: true,
      paymentLink: {
        id: paymentLink.id,
        status: paymentLink.status,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        short_url: paymentLink.short_url,
      },
    });
  } catch (error: any) {
    console.error('Error checking payment link:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to check payment link status' 
      },
      { status: 500 }
    );
  }
}

