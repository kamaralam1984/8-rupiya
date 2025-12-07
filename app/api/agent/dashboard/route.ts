import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Agent from '@/lib/models/Agent';
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

    const agent = await Agent.findById(payload.agentId);
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get this month's date range
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    // Count shops
    const agentObjectId = new mongoose.Types.ObjectId(payload.agentId);
    const totalShopsToday = await AgentShop.countDocuments({
      agentId: agentObjectId,
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const totalShopsThisMonth = await AgentShop.countDocuments({
      agentId: agentObjectId,
      createdAt: { $gte: thisMonth },
    });

    // Calculate total shops from actual AgentShop count instead of cached value
    const actualTotalShops = await AgentShop.countDocuments({
      agentId: agentObjectId,
    });

    // Update agent's totalShops if it doesn't match actual count
    if (actualTotalShops !== (agent.totalShops || 0)) {
      console.log('Updating agent totalShops:', {
        agentId: agent._id.toString(),
        oldTotalShops: agent.totalShops || 0,
        actualTotalShops,
      });
      
      agent.totalShops = actualTotalShops;
      await agent.save();
      
      console.log('Agent totalShops updated to:', actualTotalShops);
    }

    const totalShopsOverall = agent.totalShops || 0;

    // Calculate earnings from all PAID shops
    // Commission is 20% of paid amount (typically 100, so 20 per shop)
    const paidShops = await AgentShop.find({
      agentId: agentObjectId,
      paymentStatus: 'PAID',
    }).lean();

    // Recalculate total earnings from all paid shops to ensure accuracy
    let calculatedEarnings = 0;
    for (const shop of paidShops) {
      const paymentAmount = shop.amount || 100;
      const commission = Math.round(paymentAmount * 0.2);
      calculatedEarnings += commission;
    }

    // Update agent's totalEarnings if it doesn't match calculated value
    // This fixes any discrepancies from missing commission updates
    if (calculatedEarnings !== (agent.totalEarnings || 0)) {
      console.log('Recalculating agent earnings:', {
        agentId: agent._id.toString(),
        oldEarnings: agent.totalEarnings || 0,
        calculatedEarnings,
        paidShopsCount: paidShops.length,
      });
      
      agent.totalEarnings = calculatedEarnings;
      await agent.save();
      
      console.log('Agent earnings updated to:', calculatedEarnings);
    }

    const totalEarnings = agent.totalEarnings || calculatedEarnings;

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalShopsToday,
          totalShopsThisMonth,
          totalShopsOverall,
          totalEarnings,
          agentCode: agent.agentCode,
          agentName: agent.name,
          agentPanelText: agent.agentPanelText,
          agentPanelTextColor: agent.agentPanelTextColor,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

