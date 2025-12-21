import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/lib/models/Payment';
import AgentShop from '@/lib/models/AgentShop';
import { createRazorpayOrder } from '@/lib/utils/razorpay';
import { createPhonePeOrder } from '@/lib/utils/phonepe';
import { PRICING_PLANS, PlanType } from '@/app/utils/pricing';
import { verifyAgentToken, getAgentTokenFromRequest } from '@/lib/utils/agentAuth';
import mongoose from 'mongoose';

/**
 * POST /api/payment/create-order
 * Create payment order for Razorpay or PhonePe
 * 
 * Body:
 * - shopId: string (AgentShop ID)
 * - planType: PlanType
 * - gateway: 'RAZORPAY' | 'PHONEPE'
 * - amount?: number (optional, defaults to plan amount)
 * - customerName: string
 * - customerEmail?: string
 * - customerPhone: string
 * - agentId?: string (optional, for agent-initiated payments)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      shopId,
      planType,
      gateway = 'RAZORPAY',
      amount,
      customerName,
      customerEmail,
      customerPhone,
      agentId,
    } = body;

    // Validate required fields (shopId is optional for new shop registration)
    if (!planType || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields: planType, customerName, customerPhone' },
        { status: 400 }
      );
    }
    
    // Validate customer details are not empty
    if (customerName.trim() === '' || customerPhone.trim() === '') {
      return NextResponse.json(
        { error: 'Customer name and phone number are required' },
        { status: 400 }
      );
    }

    // Validate plan type
    if (!PRICING_PLANS[planType as PlanType]) {
      return NextResponse.json(
        { error: `Invalid plan type: ${planType}` },
        { status: 400 }
      );
    }

    // Validate gateway
    if (gateway !== 'RAZORPAY' && gateway !== 'PHONEPE') {
      return NextResponse.json(
        { error: 'Invalid gateway. Must be RAZORPAY or PHONEPE' },
        { status: 400 }
      );
    }

    // Get plan details
    const planDetails = PRICING_PLANS[planType as PlanType];
    const finalAmount = amount || planDetails.amount;

    // Validate amount (minimum should be plan amount)
    if (finalAmount < planDetails.amount) {
      return NextResponse.json(
        { error: `Amount must be at least ₹${planDetails.amount} for ${planDetails.name}` },
        { status: 400 }
      );
    }

    // Shop is optional for new shop registration
    let shop = null;
    if (shopId && shopId.trim() !== '') {
      shop = await AgentShop.findById(shopId);
      if (!shop) {
        return NextResponse.json(
          { error: 'Shop not found' },
          { status: 404 }
        );
      }
    }

    // If agentId is provided, verify agent token
    if (agentId) {
      const token = getAgentTokenFromRequest(request);
      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required for agent payments' },
          { status: 401 }
        );
      }

      const payload = verifyAgentToken(token);
      if (!payload || payload.agentId !== agentId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }

      // Verify agent owns the shop (only if shop exists)
      if (shop && shop.agentId && shop.agentId.toString() !== agentId) {
        return NextResponse.json(
          { error: 'Agent does not own this shop' },
          { status: 403 }
        );
      }
    }

    // Generate unique order ID
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const merchantTransactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutes expiry

    const payment = await Payment.create({
      orderId,
      shopId: shopId && shopId.trim() !== '' ? new mongoose.Types.ObjectId(shopId) : undefined,
      agentId: agentId ? new mongoose.Types.ObjectId(agentId) : (shop?.agentId || undefined),
      amount: Math.round(finalAmount * 100), // Convert to paise
      currency: 'INR',
      planType: planType as PlanType,
      status: 'PENDING',
      paymentMode: 'UPI', // Online payments are UPI
      customerName,
      customerEmail,
      customerPhone,
      razorpayOrderId: gateway === 'RAZORPAY' ? orderId : merchantTransactionId,
      gateway: gateway as 'RAZORPAY' | 'PHONEPE',
      expiresAt,
      metadata: {
        receiptNo: `REC${Date.now()}`,
        notes: shop ? `Payment for ${planDetails.name} - ${shop.shopName}` : `Payment for ${planDetails.name} - ${customerName}`,
      },
      retryCount: 0,
    });

    // Create payment order with gateway
    let gatewayResponse: any = null;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (request.headers.get('origin') || 'http://localhost:3000');

    if (gateway === 'RAZORPAY') {
      try {
        // Check Razorpay credentials BEFORE creating order
        const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
        const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
        
        // Validate credentials - only fail if truly missing or placeholder
        if (!razorpayKeyId || !razorpayKeySecret || 
            razorpayKeyId.includes('your_key') || razorpayKeySecret.includes('your_secret') ||
            razorpayKeyId.trim() === '' || razorpayKeySecret.trim() === '' ||
            !razorpayKeyId.startsWith('rzp_')) {
          throw new Error('Razorpay online payment is currently not available. Please use UPI QR Code payment option below or contact administrator to configure Razorpay.');
        }

        // Create Razorpay order
        const razorpayOrder = await createRazorpayOrder({
          amount: finalAmount,
          currency: 'INR',
          receipt: orderId,
          notes: {
            shopId: shopId,
            planType: planType,
            customerName: customerName,
            customerPhone: customerPhone,
          },
        });

        gatewayResponse = {
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          key: razorpayKeyId,
          name: '8Rupiya',
          description: shop ? `${planDetails.name} - ${shop.shopName}` : `${planDetails.name} - ${customerName}`,
          prefill: {
            name: customerName,
            email: customerEmail || (shop?.email || ''),
            contact: customerPhone,
          },
          theme: {
            color: '#2563eb',
          },
          handler: async function(response: any) {
            // This will be handled by the frontend
          },
        };
      } catch (error: any) {
        console.error('Razorpay order creation error:', error);
        payment.status = 'FAILED';
        payment.errorMessage = error.message || 'Failed to create Razorpay order';
        await payment.save();
        
        // Provide user-friendly error message
        const errorMessage = error.message?.includes('not available') 
          ? error.message 
          : 'Razorpay online payment is currently not available. Please use the UPI QR Code payment option below.';
        
        return NextResponse.json(
          { 
            success: false,
            error: errorMessage,
            details: 'You can still complete payment using UPI QR Code or manual payment methods.',
            fallbackAvailable: true
          },
          { status: 400 } // Changed to 400 (Bad Request) instead of 500 since it's a configuration issue
        );
      }
    } else if (gateway === 'PHONEPE') {
      // Create PhonePe order
      const phonePeResult = await createPhonePeOrder({
        merchantTransactionId,
        amount: finalAmount,
        merchantUserId: customerPhone,
        mobileNumber: customerPhone,
        redirectUrl: `${baseUrl}/payment/callback?paymentId=${payment._id}`,
        callbackUrl: `${baseUrl}/api/payment/webhook/phonepe`,
      });

      if (!phonePeResult.success) {
        // Mark payment as failed
        payment.status = 'FAILED';
        payment.errorMessage = phonePeResult.error;
        await payment.save();

        return NextResponse.json(
          { error: phonePeResult.error || 'Failed to create PhonePe order' },
          { status: 500 }
        );
      }

      gatewayResponse = {
        merchantTransactionId,
        redirectUrl: phonePeResult.data?.data?.instrumentResponse?.redirectInfo?.url,
        deeplink: phonePeResult.data?.data?.instrumentResponse?.redirectInfo?.deeplink,
      };
    }

    // Validate gatewayResponse exists
    if (!gatewayResponse) {
      payment.status = 'FAILED';
      payment.errorMessage = 'Failed to create payment order with gateway';
      await payment.save();
      
      return NextResponse.json(
        { error: 'Failed to create payment order. Gateway response is missing.' },
        { status: 500 }
      );
    }

    // Update payment with gateway order ID
    if (gateway === 'RAZORPAY' && gatewayResponse.orderId) {
      payment.razorpayOrderId = gatewayResponse.orderId;
      await payment.save();
    }

    return NextResponse.json(
      {
        success: true,
        paymentId: payment._id,
        orderId: gateway === 'RAZORPAY' ? gatewayResponse.orderId : merchantTransactionId,
        amount: finalAmount,
        currency: 'INR',
        gateway,
        gatewayResponse,
        expiresAt: payment.expiresAt,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Payment order creation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create payment order',
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

