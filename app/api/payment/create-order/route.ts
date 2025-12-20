import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/lib/models/Payment';
import AgentShop from '@/lib/models/AgentShop';
import Agent from '@/lib/models/Agent';
import Shopper from '@/lib/models/Shopper';
import {
  createRazorpayOrder,
  rupeesToPaise,
  getPlanDetails,
  generateReceiptNumber,
  PlanType,
} from '@/lib/razorpay';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      shopId,
      agentId,
      shopperId,
      planType,
      customerName,
      customerEmail,
      customerPhone,
      userType, // 'agent' or 'shopper'
    } = body;

    // Validation - shopId is optional for new shop registration
    if (!planType || !customerName || !customerPhone) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!userType || !['agent', 'shopper'].includes(userType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user type' },
        { status: 400 }
      );
    }

    // Verify shop exists only if shopId is provided
    let shop = null;
    if (shopId) {
      shop = await AgentShop.findById(shopId);
      if (!shop) {
        return NextResponse.json(
          { success: false, message: 'Shop not found' },
          { status: 404 }
        );
      }
    }

    // Verify agent or shopper exists
    if (userType === 'agent' && agentId) {
      const agent = await Agent.findById(agentId);
      if (!agent) {
        return NextResponse.json(
          { success: false, message: 'Agent not found' },
          { status: 404 }
        );
      }
    } else if (userType === 'shopper' && shopperId) {
      const shopper = await Shopper.findById(shopperId);
      if (!shopper) {
        return NextResponse.json(
          { success: false, message: 'Shopper not found' },
          { status: 404 }
        );
      }
    }

    // Get plan details
    const planDetails = getPlanDetails(planType as PlanType);
    if (!planDetails) {
      return NextResponse.json(
        { success: false, message: 'Invalid plan type' },
        { status: 400 }
      );
    }

    const amountInRupees = planDetails.amount;
    const amountInPaise = rupeesToPaise(amountInRupees);

    // Generate receipt number
    const receiptNo = generateReceiptNumber('SHOP');

    // Create Razorpay order
    const orderResult = await createRazorpayOrder({
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptNo,
      notes: {
        ...(shopId && { shopId: shopId.toString() }),
        ...(shop && { shopName: shop.shopName }),
        planType,
        userType,
        ...(agentId && { agentId: agentId.toString() }),
        ...(shopperId && { shopperId: shopperId.toString() }),
      },
    });

    if (!orderResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: orderResult.error || 'Failed to create order',
        },
        { status: 500 }
      );
    }

    // Extract order from result
    const razorpayOrder = (orderResult as { success: true; order: any }).order;
    
    if (!razorpayOrder) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to create Razorpay order',
        },
        { status: 500 }
      );
    }

    // Calculate expiry (30 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    // Save payment record in database (shopId is optional for new registrations)
    const payment = new Payment({
      orderId: razorpayOrder.id,
      razorpayOrderId: razorpayOrder.id,
      ...(shopId && { shopId }),
      agentId: agentId || undefined,
      amount: amountInPaise,
      currency: 'INR',
      planType,
      status: 'PENDING',
      paymentMode: 'UPI',
      customerName,
      customerEmail: customerEmail || undefined,
      customerPhone,
      gateway: 'RAZORPAY',
      expiresAt,
      metadata: {
        receiptNo,
        userType,
        ...(shopId && { shopId: shopId.toString() }),
      },
    });

    await payment.save();

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      receiptNo,
      planName: planDetails.name,
      planAmount: amountInRupees,
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
