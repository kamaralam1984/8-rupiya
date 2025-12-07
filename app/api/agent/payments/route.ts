import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop';
import { verifyAgentToken, getAgentTokenFromRequest } from '@/lib/utils/agentAuth';
import mongoose from 'mongoose';

// GET /api/agent/payments - Get payment history and analytics
export async function GET(request: NextRequest) {
  try {
    const token = getAgentTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyAgentToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const dateFilter = searchParams.get('date') || 'all'; // today, week, month, all
    const paymentFilter = searchParams.get('payment') || 'all'; // all, paid, pending

    const agentObjectId = new mongoose.Types.ObjectId(payload.agentId);

    // Build date filter
    let dateQuery: any = {};
    if (dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateQuery.createdAt = { $gte: today };
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      dateQuery.createdAt = { $gte: weekAgo };
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      monthAgo.setHours(0, 0, 0, 0);
      dateQuery.createdAt = { $gte: monthAgo };
    }

    // Build payment filter
    let paymentQuery: any = {};
    if (paymentFilter === 'paid') {
      paymentQuery.paymentStatus = 'PAID';
    } else if (paymentFilter === 'pending') {
      paymentQuery.paymentStatus = 'PENDING';
    }

    // Combine queries
    const query: any = {
      agentId: agentObjectId,
      ...dateQuery,
      ...paymentQuery,
    };

    // Get all shops for analytics
    const allShops = await AgentShop.find({
      agentId: agentObjectId,
      ...dateQuery,
    }).lean();

    // Get filtered shops
    const shops = await AgentShop.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Calculate analytics
    const totalShops = allShops.length;
    const paidShops = allShops.filter((shop) => shop.paymentStatus === 'PAID');
    const pendingShops = allShops.filter((shop) => shop.paymentStatus === 'PENDING');

    const totalAmount = paidShops.reduce((sum, shop) => sum + (shop.amount || 100), 0);
    const totalCommission = Math.round(totalAmount * 0.2); // 20% commission
    const pendingAmount = pendingShops.length * 100; // Assuming 100 per pending shop

    // Payment mode breakdown
    const cashPayments = paidShops.filter((shop) => shop.paymentMode === 'CASH').length;
    const upiPayments = paidShops.filter((shop) => shop.paymentMode === 'UPI').length;

    return NextResponse.json(
      {
        success: true,
        shops,
        analytics: {
          totalShops,
          paidCount: paidShops.length,
          pendingCount: pendingShops.length,
          totalAmount,
          totalCommission,
          pendingAmount,
          cashPayments,
          upiPayments,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get payments error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

