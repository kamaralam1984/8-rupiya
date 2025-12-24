import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * API Route: POST /api/razorpay/verify-payment
 * 
 * This API route verifies Razorpay payment signature
 * 
 * Requirements:
 * - Verifies payment signature using RAZORPAY_KEY_SECRET
 * - Ensures payment is authentic and not tampered with
 */

export async function POST(request: NextRequest) {
  try {
    // Step 1: Get Razorpay key secret from environment
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeySecret) {
      return NextResponse.json(
        {
          success: false,
          error: 'Razorpay key secret not configured',
        },
        { status: 500 }
      );
    }

    // Step 2: Parse request body
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    // Step 3: Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required payment parameters',
        },
        { status: 400 }
      );
    }

    // Step 4: Generate signature for verification
    // Razorpay creates signature using: HMAC SHA256(order_id + "|" + payment_id, key_secret)
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(text)
      .digest('hex');

    // Step 5: Compare signatures
    const isSignatureValid = generatedSignature === razorpay_signature;

    if (!isSignatureValid) {
      console.error('❌ Payment signature verification failed:', {
        received: razorpay_signature,
        generated: generatedSignature,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Payment signature verification failed',
          details: 'The payment signature does not match. Payment may be tampered with.',
        },
        { status: 400 }
      );
    }

    // Step 6: Payment verified successfully
    console.log('✅ Payment signature verified successfully');

    return NextResponse.json(
      {
        success: true,
        message: 'Payment verified successfully',
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error verifying payment:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to verify payment',
      },
      { status: 500 }
    );
  }
}

