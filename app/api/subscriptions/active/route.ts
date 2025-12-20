import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Subscription from '@/lib/models/Subscription';
import AgentShop from '@/lib/models/AgentShop';
import { verifyAgentToken, getAgentTokenFromRequest } from '@/lib/utils/agentAuth';
import mongoose from 'mongoose';

/**
 * GET /api/subscriptions/active
 * Get active subscription for a shop (Agent or Shopper)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const agentId = searchParams.get('agentId');
    const shopperId = searchParams.get('shopperId');

    if (!shopId && !agentId && !shopperId) {
      return NextResponse.json(
        { error: 'shopId, agentId, or shopperId is required' },
        { status: 400 }
      );
    }

    let query: any = { status: 'ACTIVE' };

    if (shopId) {
      query.shopId = new mongoose.Types.ObjectId(shopId);
    } else if (agentId) {
      // Verify agent token if agentId is provided
      const token = getAgentTokenFromRequest(request);
      if (token) {
        const payload = verifyAgentToken(token);
        if (!payload || payload.agentId !== agentId) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }
      }
      query.agentId = new mongoose.Types.ObjectId(agentId);
    } else if (shopperId) {
      query.shopperId = new mongoose.Types.ObjectId(shopperId);
    }

    // Get active subscription
    const subscription = await Subscription.findOne(query)
      .populate('shopId', 'shopName ownerName mobile email')
      .populate('paymentId', 'orderId receiptNo paidAt')
      .sort({ createdAt: -1 })
      .lean();

    if (!subscription) {
      return NextResponse.json(
        { success: true, subscription: null, message: 'No active subscription found' },
        { status: 200 }
      );
    }

    // Check if subscription is still valid
    const now = new Date();
    const isActive = subscription.status === 'ACTIVE' &&
                     new Date(subscription.startDate) <= now &&
                     new Date(subscription.expiryDate) >= now;

    if (!isActive) {
      // Update status to expired
      await Subscription.findByIdAndUpdate(subscription._id, { status: 'EXPIRED' });
      return NextResponse.json(
        { success: true, subscription: null, message: 'Subscription has expired' },
        { status: 200 }
      );
    }

    // Calculate days remaining
    const expiryDate = new Date(subscription.expiryDate);
    const daysRemaining = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return NextResponse.json(
      {
        success: true,
        subscription: {
          ...subscription,
          daysRemaining,
          isActive: true,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching active subscription:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch subscription',
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}




