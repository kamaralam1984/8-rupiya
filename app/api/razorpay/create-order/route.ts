import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

/**
 * API Route: POST /api/razorpay/create-order
 * 
 * This API route creates a Razorpay order
 * 
 * Requirements:
 * - Uses RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET from .env
 * - Returns order details needed for frontend checkout
 */

export async function POST(request: NextRequest) {
  try {
    // Step 1: Get Razorpay credentials from environment variables
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    // Step 2: Validate credentials
    if (!razorpayKeyId || !razorpayKeySecret) {
      return NextResponse.json(
        {
          success: false,
          error: 'Razorpay credentials not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local',
        },
        { status: 500 }
      );
    }

    // Step 3: Parse request body
    const body = await request.json();
    const { amount, currency = 'INR', receipt } = body;

    // Step 4: Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid amount. Amount must be greater than 0.',
        },
        { status: 400 }
      );
    }

    // Step 5: Initialize Razorpay instance
    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    // Step 6: Create Razorpay order
    const orderOptions = {
      amount: amount, // Amount in paise (₹100 = 10000 paise)
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: {
        // Optional: Add any additional notes
        description: 'Test payment',
      },
    };

    const order = await razorpay.orders.create(orderOptions);

    // Step 7: Return order details
    return NextResponse.json(
      {
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: razorpayKeyId, // Send key ID to frontend (safe to expose)
        receipt: order.receipt,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create Razorpay order',
        details: error.description || 'Please check your Razorpay credentials and try again.',
      },
      { status: 500 }
    );
  }
}

