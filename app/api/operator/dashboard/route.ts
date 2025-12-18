import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop';
import Agent from '@/lib/models/Agent';
import { verifyOperatorTokenAndGetOperator } from '@/lib/utils/operatorAuth';
import { calculateOperatorCommission, calculateAgentCommission, PlanType } from '@/app/utils/pricing';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verify operator authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const operator = await verifyOperatorTokenAndGetOperator(token);
    if (!operator) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get all agents assigned to this operator
    const agents = await Agent.find({ operatorId: operator._id });
    const agentIds = agents.map(a => a._id);

    // Get all shops from operator's agents (without lean to allow updates)
    const allShops = await AgentShop.find({ 
      agentId: { $in: agentIds },
      paymentStatus: 'PAID' 
    });

    // Calculate commission breakdown
    // Recalculate operator commission if missing
    let totalOperatorEarnings = 0;
    let totalAgentCommission = 0;
    
    for (const shop of allShops) {
      const planType = (shop.planType as PlanType) || 'BASIC';
      const planAmount = shop.planAmount || shop.amount || 0;
      
      // Always recalculate agent commission based on plan type
      const correctAgentCommission = calculateAgentCommission(planType, planAmount);
      let agentCommission = shop.agentCommission || 0;
      
      // If stored commission doesn't match plan, use correct one
      if (agentCommission !== correctAgentCommission) {
        agentCommission = correctAgentCommission;
        // Update shop if commission is wrong
        shop.agentCommission = correctAgentCommission;
      }
      
      // Always recalculate operator commission based on plan type and correct agent commission
      // Formula: (Amount - Agent Commission) * 0.15
      const correctOperatorCommission = calculateOperatorCommission(planType, planAmount, agentCommission);
      let operatorCommission = shop.operatorCommission || 0;
      
      // If stored commission doesn't match plan, use correct one
      if (operatorCommission !== correctOperatorCommission) {
        operatorCommission = correctOperatorCommission;
        // Update shop if commission is wrong
        shop.operatorCommission = correctOperatorCommission;
      }
      
      // Save shop if any commission was updated
      if (shop.isModified()) {
        await shop.save();
      }
      
      totalOperatorEarnings += operatorCommission;
      totalAgentCommission += agentCommission;
    }

    // Calculate stats
    const totalShops = allShops.length;

    return NextResponse.json({
      success: true,
      stats: {
        totalShops,
        totalAgents: agents.length,
        totalOperatorEarnings: operator.totalEarnings || totalOperatorEarnings,
        totalAgentCommission,
        totalOperatorCommission: totalOperatorEarnings,
      },
    });
  } catch (error: any) {
    console.error('Error fetching operator dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard stats', details: error.message },
      { status: 500 }
    );
  }
}

