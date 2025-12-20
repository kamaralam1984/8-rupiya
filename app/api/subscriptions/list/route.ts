import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Subscription from '@/lib/models/Subscription';
import { verifyAgentToken, getAgentTokenFromRequest } from '@/lib/utils/agentAuth';
import mongoose from 'mongoose';

/**
 * GET /api/subscriptions/list
 * Get all subscriptions with filters (for Agent, Shopper, or Admin)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const shopperId = searchParams.get('shopperId');
    const shopId = searchParams.get('shopId');
    const status = searchParams.get('status'); // ACTIVE, EXPIRED, CANCELLED, PENDING
    const planType = searchParams.get('planType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query: any = {};

    // Filter by agentId (with auth check)
    if (agentId) {
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
    }

    // Filter by shopperId
    if (shopperId) {
      query.shopperId = new mongoose.Types.ObjectId(shopperId);
    }

    // Filter by shopId
    if (shopId) {
      query.shopId = new mongoose.Types.ObjectId(shopId);
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by planType
    if (planType) {
      query.planType = planType;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const subscriptions = await Subscription.find(query)
      .populate('shopId', 'shopName ownerName mobile email')
      .populate('agentId', 'name agentCode')
      .populate('shopperId', 'name shopperCode')
      .populate('paymentId', 'orderId receiptNo paidAt amount status')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate days remaining for each subscription
    const now = new Date();
    const subscriptionsWithDetails = subscriptions.map((sub: any) => {
      const expiryDate = new Date(sub.expiryDate);
      const daysRemaining = sub.status === 'ACTIVE'
        ? Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;
      
      return {
        ...sub,
        daysRemaining,
        isActive: sub.status === 'ACTIVE' &&
                  new Date(sub.startDate) <= now &&
                  expiryDate >= now,
      };
    });

    return NextResponse.json(
      {
        success: true,
        subscriptions: subscriptionsWithDetails,
        count: subscriptionsWithDetails.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch subscriptions',
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}




