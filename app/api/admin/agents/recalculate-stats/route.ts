import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Agent from '@/lib/models/Agent';
import AgentShop from '@/lib/models/AgentShop';
import { requireAdmin } from '@/lib/auth';
import mongoose from 'mongoose';

/**
 * POST /api/admin/agents/recalculate-stats
 * Recalculate all agents' totalShops and totalEarnings based on actual AgentShop data
 */
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const agents = await Agent.find({});
    const updates: Array<{ agentId: string; oldShops: number; newShops: number; oldEarnings: number; newEarnings: number }> = [];

    for (const agent of agents) {
      const agentObjectId = new mongoose.Types.ObjectId(agent._id);
      
      // Count actual shops
      const actualTotalShops = await AgentShop.countDocuments({
        agentId: agentObjectId,
      });

      // Calculate actual earnings from paid shops
      const paidShops = await AgentShop.find({
        agentId: agentObjectId,
        paymentStatus: 'PAID',
      }).lean();

      let calculatedEarnings = 0;
      for (const shop of paidShops) {
        calculatedEarnings += shop.agentCommission || 0;
      }

      const oldShops = agent.totalShops || 0;
      const oldEarnings = agent.totalEarnings || 0;

      // Update if different
      if (actualTotalShops !== oldShops || calculatedEarnings !== oldEarnings) {
        agent.totalShops = actualTotalShops;
        agent.totalEarnings = calculatedEarnings;
        await agent.save();

        updates.push({
          agentId: agent._id.toString(),
          oldShops,
          newShops: actualTotalShops,
          oldEarnings,
          newEarnings: calculatedEarnings,
        });

        console.log(`Updated agent ${agent.name} (${agent.agentCode}): Shops ${oldShops} → ${actualTotalShops}, Earnings ₹${oldEarnings} → ₹${calculatedEarnings}`);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Recalculated stats for ${agents.length} agents. ${updates.length} agents were updated.`,
        totalAgents: agents.length,
        updatedAgents: updates.length,
        updates,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Recalculate stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});










