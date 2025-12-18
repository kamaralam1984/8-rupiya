import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Agent from '@/lib/models/Agent';
import AgentShop from '@/lib/models/AgentShop';
import { verifyOperatorToken, getOperatorTokenFromRequest } from '@/lib/utils/operatorAuth';
import { calculateOperatorCommission, calculateAgentCommission, PlanType } from '@/app/utils/pricing';

/**
 * GET /api/operator/agents
 * Get all agents assigned to this operator with their details and commission
 */
export async function GET(request: NextRequest) {
  try {
    const token = getOperatorTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyOperatorToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get all agents assigned to this operator
    const agents = await Agent.find({ operatorId: payload.operatorId })
      .select('name email phone agentCode totalShops totalEarnings createdAt')
      .sort({ createdAt: -1 });

    // Get detailed stats for each agent
    const agentsWithStats = await Promise.all(
      agents.map(async (agent) => {
        // Get all shops for this agent
        const shops = await AgentShop.find({ agentId: agent._id });
        
        const paidShops = shops.filter(s => s.paymentStatus === 'PAID');
        const pendingShops = shops.filter(s => s.paymentStatus === 'PENDING');
        
        // Calculate total operator commission from this agent's shops
        // Recalculate if operatorCommission is missing or 0
        let totalOperatorCommission = 0;
        let totalAgentCommission = 0;
        
        for (const shop of paidShops) {
          const planType = (shop.planType as PlanType) || 'BASIC';
          const planAmount = shop.planAmount || shop.amount || 0;
          
          // Always recalculate agent commission based on plan type
          const correctAgentCommission = calculateAgentCommission(planType, planAmount);
          let agentCommission = shop.agentCommission || 0;
          
          // If stored commission doesn't match plan, use correct one
          if (agentCommission !== correctAgentCommission) {
            agentCommission = correctAgentCommission;
            // Update shop if commission is wrong
            if (shop.agentCommission !== correctAgentCommission) {
              shop.agentCommission = correctAgentCommission;
            }
          }
          
          // Always recalculate operator commission based on plan type and correct agent commission
          // Formula: (Amount - Agent Commission) * 0.15
          const correctOperatorCommission = calculateOperatorCommission(planType, planAmount, agentCommission);
          let operatorCommission = shop.operatorCommission || 0;
          
          // If stored commission doesn't match plan, use correct one
          if (operatorCommission !== correctOperatorCommission) {
            operatorCommission = correctOperatorCommission;
            // Update shop if commission is wrong
            if (shop.operatorCommission !== correctOperatorCommission) {
              shop.operatorCommission = correctOperatorCommission;
            }
          }
          
          // Save shop if any commission was updated
          if (shop.isModified()) {
            await shop.save();
          }
          
          totalOperatorCommission += operatorCommission;
          totalAgentCommission += agentCommission;
        }

        return {
          _id: agent._id.toString(),
          name: agent.name,
          email: agent.email,
          phone: agent.phone,
          agentCode: agent.agentCode,
          totalShops: agent.totalShops,
          totalEarnings: agent.totalEarnings,
          paidShops: paidShops.length,
          pendingShops: pendingShops.length,
          totalOperatorCommission,
          totalAgentCommission,
          createdAt: agent.createdAt,
        };
      })
    );

    // Calculate operator's total earnings from all agents
    const totalOperatorEarnings = agentsWithStats.reduce((sum, agent) => {
      return sum + agent.totalOperatorCommission;
    }, 0);

    return NextResponse.json({
      success: true,
      agents: agentsWithStats,
      totalAgents: agentsWithStats.length,
      totalOperatorEarnings,
    });
  } catch (error: any) {
    console.error('Error fetching operator agents:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}


