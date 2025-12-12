import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Agent from '@/lib/models/Agent';
import AgentShop from '@/lib/models/AgentShop';
import { requireAdmin } from '@/lib/auth';
import mongoose from 'mongoose';

export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    // Get all agents
    const agents = await Agent.find({}).lean();
    console.log('📊 Total agents found:', agents.length);

    // Calculate performance for each agent
    const agentPerformance = await Promise.all(
      agents.map(async (agent) => {
        // Convert agent._id to ObjectId for querying
        const agentId = new mongoose.Types.ObjectId(agent._id);

        // Get all shops by this agent using agentId (ObjectId)
        const allShops = await AgentShop.find({ agentId }).lean();
        console.log(`🏪 Agent ${agent.name} (${agent.agentCode}): ${allShops.length} shops`);
        
        // Calculate date ranges
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Count shops
        const shopsToday = allShops.filter((shop: any) => {
          const createdAt = new Date(shop.createdAt);
          return createdAt >= today;
        }).length;

        const shopsThisMonth = allShops.filter((shop: any) => {
          const createdAt = new Date(shop.createdAt);
          return createdAt >= thisMonthStart;
        }).length;

        // Calculate earnings from actual shops (agentCommission)
        // Only count commission from PAID shops
        const totalEarnings = allShops
          .filter((shop: any) => shop.paymentStatus === 'PAID')
          .reduce((sum: number, shop: any) => sum + (shop.agentCommission || 0), 0);

        // Paid amount is what has been paid to agent (currently not tracked in agent model)
        const paidAmount = 0; // TODO: Add paidAmount field to Agent model if needed
        const pendingPayment = totalEarnings - paidAmount;

        return {
          _id: agent._id.toString(),
          agentCode: agent.agentCode,
          agentName: agent.name,
          totalShops: allShops.length,
          shopsToday,
          shopsThisMonth,
          totalEarnings,
          paidAmount,
          pendingPayment,
        };
      })
    );

    console.log('📈 Agent Performance Summary:', agentPerformance.map(a => ({
      name: a.agentName,
      shops: a.totalShops,
      earnings: a.totalEarnings
    })));

    // Sort by total shops (descending)
    agentPerformance.sort((a, b) => b.totalShops - a.totalShops);

    return NextResponse.json({
      success: true,
      agents: agentPerformance,
    });
  } catch (error: any) {
    console.error('Error fetching agent reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agent reports', details: error.message },
      { status: 500 }
    );
  }
});

