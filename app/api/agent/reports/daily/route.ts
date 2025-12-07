import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop';
import { verifyAgentToken, getAgentTokenFromRequest } from '@/lib/utils/agentAuth';
import mongoose from 'mongoose';

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

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's shops
    const agentObjectId = new mongoose.Types.ObjectId(payload.agentId);
    const todayShops = await AgentShop.find({
      agentId: agentObjectId,
      createdAt: { $gte: today, $lt: tomorrow },
    })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate stats
    const totalShops = todayShops.length;
    const paidShops = todayShops.filter((shop) => shop.paymentStatus === 'PAID');
    const pendingShops = todayShops.filter((shop) => shop.paymentStatus === 'PENDING');

    const totalAmountCollected = paidShops.reduce((sum, shop) => sum + (shop.amount || 100), 0);
    const totalCommission = Math.round(totalAmountCollected * 0.2); // 20% commission

    return NextResponse.json(
      {
        success: true,
        report: {
          date: today.toISOString().split('T')[0],
          totalShops,
          paidCount: paidShops.length,
          pendingCount: pendingShops.length,
          totalAmountCollected,
          totalCommission,
          shops: todayShops,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Daily report error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

