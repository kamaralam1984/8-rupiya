import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Agent from '@/lib/models/Agent';
import AgentShop from '@/lib/models/AgentShop';
import { requireAdmin } from '@/lib/auth';

export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    // Fetch all agents
    const agents = await Agent.find({}).lean();

    // Calculate date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    // Calculate performance for each agent
    const agentPerformance = await Promise.all(
      agents.map(async (agent) => {
        // Find all shops for this agent
        const shops = await AgentShop.find({ agentId: agent._id }).lean();

        // Calculate totals
        const totalShops = shops.length;
        
        // Calculate paid and pending amounts (commission)
        const paidShops = shops.filter((shop) => shop.paymentStatus === 'PAID');
        const pendingShops = shops.filter((shop) => shop.paymentStatus === 'PENDING');
        
        const paidAmount = paidShops.reduce((sum, shop) => sum + (shop.agentCommission || 0), 0);
        const pendingPayment = pendingShops.reduce((sum, shop) => sum + (shop.agentCommission || 0), 0);

        // Calculate shops today
        const shopsToday = shops.filter((shop) => {
          const shopDate = new Date(shop.createdAt);
          return shopDate >= today && shopDate < tomorrow;
        }).length;

        // Calculate shops this month
        const shopsThisMonth = shops.filter((shop) => {
          const shopDate = new Date(shop.createdAt);
          return shopDate >= firstDayOfMonth;
        }).length;

        return {
          _id: agent._id.toString(),
          agentCode: agent.agentCode,
          agentName: agent.name,
          totalShops,
          totalEarnings: agent.totalEarnings || 0,
          pendingPayment,
          paidAmount,
          shopsToday,
          shopsThisMonth,
        };
      })
    );

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
