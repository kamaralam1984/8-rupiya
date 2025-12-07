import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Agent from '@/lib/models/Agent';
import AgentShop from '@/lib/models/AgentShop';
import { requireAdmin } from '@/lib/auth';
import mongoose from 'mongoose';

/**
 * POST /api/admin/agents/[id]/recalculate-earnings
 * Recalculate agent's total earnings from all PAID shops
 */
export const POST = requireAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await connectDB();

    const { id } = await params;
    const agentId = id;

    const agent = await Agent.findById(agentId);
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Get all PAID shops for this agent
    const paidShops = await AgentShop.find({
      agentId: new mongoose.Types.ObjectId(agentId),
      paymentStatus: 'PAID',
    }).lean();

    // Recalculate total earnings
    let calculatedEarnings = 0;
    for (const shop of paidShops) {
      const paymentAmount = shop.amount || 100;
      const commission = Math.round(paymentAmount * 0.2);
      calculatedEarnings += commission;
    }

    const oldEarnings = agent.totalEarnings || 0;
    agent.totalEarnings = calculatedEarnings;
    await agent.save();

    return NextResponse.json({
      success: true,
      message: 'Earnings recalculated successfully',
      agent: {
        _id: agent._id,
        name: agent.name,
        agentCode: agent.agentCode,
        oldEarnings,
        newEarnings: calculatedEarnings,
        paidShopsCount: paidShops.length,
      },
    });
  } catch (error: any) {
    console.error('Recalculate earnings error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

