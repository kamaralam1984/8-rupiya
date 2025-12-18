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
        if (shop.agentId.toString() !== agentId) {
          return NextResponse.json(
            { error: 'Agent does not own this shop' },
            { status: 403 }
          );
        }
      }
    } else {
      // For test payments without shopId, verify agent token
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
      const paymentLink = await createPaymentLink({
        amount: finalAmount,
        currency: 'INR',
        description: `${planDetails.name}${shop ? ` - ${shop.shopName}` : ' - Test Payment'}`,
        customer: {
          name: customerName,
          email: customerEmail || (shop ? shop.email : '') || '',
          contact: customerPhone,
        },
        notes: {
          shopId: shopId,
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
      console.error('Razorpay Payment Link creation error:', error);
      payment.status = 'FAILED';
      payment.errorMessage = error.message || 'Failed to create Razorpay payment link';
      await payment.save();

      return NextResponse.json(
        {
          error: error.message || 'Failed to create Razorpay payment link',
          details: 'Please check your Razorpay credentials in environment variables'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Payment link creation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create payment link',
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

