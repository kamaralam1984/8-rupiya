import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/lib/models/Payment';
import { requireAdmin } from '@/lib/auth';
import mongoose from 'mongoose';

/**
 * GET /api/admin/payments
 * Get all payments with filters (Admin only)
 */
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const dateRange = searchParams.get('dateRange') || 'all';
    const planType = searchParams.get('planType');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query: any = {};

    // Filter by user ID (agent or shopper)
    if (userId) {
      const userIdObj = new mongoose.Types.ObjectId(userId);
      query.$or = [
        { agentId: userIdObj },
        { shopperId: userIdObj },
      ];
    }

    // Filter by plan type
    if (planType && planType !== 'all') {
      query.planType = planType;
    }

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by date range
    if (dateRange !== 'all' || startDate || endDate) {
      query.createdAt = {};
      
      if (dateRange === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query.createdAt.$gte = today;
      } else if (dateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        query.createdAt.$gte = weekAgo;
      } else if (dateRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        monthAgo.setHours(0, 0, 0, 0);
        query.createdAt.$gte = monthAgo;
      } else if (dateRange === 'custom') {
        if (startDate) {
          query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.createdAt.$lte = end;
        }
      }
    }

    const payments = await Payment.find(query)
      .populate('shopId', 'shopName ownerName mobile email')
      .populate('agentId', 'name agentCode')
      .populate('shopperId', 'name shopperCode')
      .populate('subscriptionId', 'status startDate expiryDate')
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();

    return NextResponse.json(
      {
        success: true,
        payments,
        count: payments.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch payments',
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
});



