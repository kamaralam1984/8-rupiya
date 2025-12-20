import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/lib/models/Payment';
import AgentShop from '@/lib/models/AgentShop';
import { createPaymentLink } from '@/lib/utils/razorpay';
import { PRICING_PLANS, PlanType } from '@/app/utils/pricing';
import { verifyAgentToken, getAgentTokenFromRequest } from '@/lib/utils/agentAuth';
import mongoose from 'mongoose';

/**
 * POST /api/payment/create-payment-link
 * Create Razorpay Payment Link with QR code support
 * 
 * Body:
 * - shopId: string (AgentShop ID)
 * - planType: PlanType
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
      amount,
      customerName,
      customerEmail,
      customerPhone,
      agentId,
    } = body;

    // Validate required fields (shopId is optional for testing)
    if (!planType || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields: planType, customerName, customerPhone' },
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

    // Get plan details
    const planDetails = PRICING_PLANS[planType as PlanType];
    const finalAmount = amount || planDetails.amount;

    // Validate amount
    if (finalAmount < planDetails.amount) {
      return NextResponse.json(
        { error: `Amount must be at least ₹${planDetails.amount} for ${planDetails.name}` },
        { status: 400 }
      );
    }

    // Verify shop exists (if shopId is provided)
    let shop = null;
    if (shopId) {
      shop = await AgentShop.findById(shopId);
      if (!shop) {
        return NextResponse.json(
          { error: 'Shop not found' },
          { status: 404 }
        );
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

        // Verify agent owns this shop
        if (!shop.agentId || shop.agentId.toString() !== agentId) {
          return NextResponse.json(
            { error: 'Agent does not own this shop' },
            { status: 403 }
          );
        }
      }
    } else {
      // For test payments without shopId, allow without authentication
      // This allows shoppers to create payment links
      // Agent token is optional - only verify if agentId is provided
      if (agentId) {
        const token = getAgentTokenFromRequest(request);
        if (token) {
          const payload = verifyAgentToken(token);
          if (!payload || payload.agentId !== agentId) {
            return NextResponse.json(
              { error: 'Unauthorized' },
              { status: 403 }
            );
          }
        }
        // If no token but agentId provided, allow anyway (for test payments)
      }
    }

    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    // Create payment record
    const testShopId = shopId 
      ? new mongoose.Types.ObjectId(shopId) 
      : new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'); // Dummy ObjectId for test payments
    
    const payment = await Payment.create({
      orderId,
      shopId: testShopId,
      agentId: agentId ? new mongoose.Types.ObjectId(agentId) : (shop ? shop.agentId : undefined),
      amount: Math.round(finalAmount * 100), // Store in paise
      currency: 'INR',
      planType: planType as PlanType,
      status: 'PENDING',
      paymentMode: 'NONE',
      customerName,
      customerEmail,
      customerPhone,
      gateway: 'RAZORPAY',
      expiresAt,
      metadata: {
        receiptNo: `REC${Date.now()}`,
        notes: `Payment for ${planDetails.name}${shop ? ` - ${shop.shopName}` : ' - Test Payment'}`,
      },
      retryCount: 0,
    });

    // Create Razorpay Payment Link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
      (request.headers.get('origin') || 'http://localhost:3000');

    try {
      // Validate Razorpay credentials before creating payment link
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Razorpay credentials not configured');
          console.error('❌ RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'Present' : 'Missing');
          console.error('❌ RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'Present' : 'Missing');
        }
        throw new Error('Razorpay payment gateway is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.');
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Razorpay credentials found, creating payment link...');
        console.log('📋 Payment link params:', {
          amount: finalAmount,
          currency: 'INR',
          description: `${planDetails.name}${shop ? ` - ${shop.shopName}` : ' - Test Payment'}`,
          customerName,
          customerPhone,
        });
      }

      const paymentLink = await createPaymentLink({
        amount: finalAmount,
        currency: 'INR',
        description: `${planDetails.name}${shop ? ` - ${shop.shopName}` : ' - Test Payment'}`,
        customer: {
          name: customerName,
          email: customerEmail || (shop ? shop.email : '') || `${customerPhone}@temp.com`,
          contact: customerPhone,
        },
        notes: {
          shopId: shopId || '',
          planType: planType,
          paymentId: payment._id.toString(),
          orderId: orderId,
        },
        callbackUrl: `${baseUrl}/api/payment/webhook/razorpay`,
        callbackMethod: 'post',
      });

      // Update payment record with payment link ID
      payment.razorpayOrderId = paymentLink.id;
      payment.razorpayPaymentLinkId = paymentLink.id;
      await payment.save();

      // Razorpay Payment Links don't return QR code directly
      // We'll generate QR code on frontend using the payment link URL
      return NextResponse.json(
        {
          success: true,
          paymentId: payment._id,
          orderId: orderId,
          paymentLinkId: paymentLink.id,
          paymentLinkUrl: paymentLink.short_url,
          qrCodeUrl: null, // Will be generated on frontend
          amount: finalAmount,
          currency: 'INR',
          expiresAt: payment.expiresAt,
        },
        { status: 200 }
      );
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Razorpay Payment Link creation error:', error);
        console.error('❌ Error type:', error.constructor?.name);
        console.error('❌ Error details:', {
          message: error.message,
          statusCode: error.statusCode,
          description: error.description,
          field: error.field,
          source: error.source,
          step: error.step,
          reason: error.reason,
          metadata: error.metadata,
          code: error.code,
          error: error.error,
          stack: error.stack?.substring(0, 500), // First 500 chars of stack
        });
        
        // Check if it's a Razorpay API error
        if (error.error) {
          console.error('❌ Razorpay API Error:', error.error);
        }
      }
      
      // Update payment record
      try {
        payment.status = 'FAILED';
        payment.errorMessage = error.message || error.description || 'Failed to create Razorpay payment link';
        await payment.save();
      } catch (saveError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Failed to save payment error:', saveError);
        }
      }

      // Return user-friendly error message
      let errorMessage = 'Failed to create payment link';
      let errorDetails = '';
      
      // Check for Razorpay credentials first
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        errorMessage = 'Razorpay credentials not configured';
        errorDetails = 'Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env.local file';
      } else if (error.description) {
        errorMessage = error.description;
        errorDetails = error.message || 'Razorpay API error';
      } else if (error.message) {
        errorMessage = error.message;
        errorDetails = 'Please check Razorpay configuration';
      } else if (error.error?.description) {
        errorMessage = error.error.description;
        errorDetails = error.error.message || 'Razorpay API error';
      } else {
        errorMessage = 'Failed to create payment link';
        errorDetails = error.message || 'Unknown error occurred';
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: errorDetails,
          message: errorMessage, // For backward compatibility
          debug: process.env.NODE_ENV === 'development' ? {
            hasCredentials: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
            statusCode: error.statusCode,
            field: error.field,
            source: error.source,
            step: error.step,
            reason: error.reason,
            errorCode: error.code,
          } : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Payment link creation error:', error);
    }
    return NextResponse.json(
      {
        error: 'Failed to create payment link',
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

