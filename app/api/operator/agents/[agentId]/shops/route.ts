import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Agent from '@/lib/models/Agent';
import AgentShop from '@/lib/models/AgentShop';
import { verifyOperatorToken, getOperatorTokenFromRequest } from '@/lib/utils/operatorAuth';
import { calculateAgentCommission, calculateOperatorCommission, PlanType } from '@/app/utils/pricing';

/**
 * GET /api/operator/agents/[agentId]/shops
 * Get all shops for a specific agent (operator can view their agent's shops)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
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

    const { agentId } = await params;

    // Verify agent belongs to this operator
    const agent = await Agent.findById(agentId);
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    if (agent.operatorId?.toString() !== payload.operatorId) {
      return NextResponse.json(
        { error: 'Unauthorized - Agent does not belong to this operator' },
        { status: 403 }
      );
    }

    // Get all shops for this agent
    const shops = await AgentShop.find({ agentId: agent._id })
      .sort({ createdAt: -1 });

    // Recalculate commissions based on plan type
    const shopsWithDetails = await Promise.all(shops.map(async (shop) => {
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
      
      return {
        _id: shop._id.toString(),
        shopName: shop.shopName,
        ownerName: shop.ownerName,
        mobile: shop.mobile,
        email: shop.email,
        category: shop.category,
        pincode: shop.pincode,
        area: shop.area,
        address: shop.address,
        photoUrl: shop.photoUrl,
        paymentStatus: shop.paymentStatus,
        paymentMode: shop.paymentMode,
        amount: shop.amount,
        planType: shop.planType,
        planAmount: shop.planAmount,
        agentCommission: agentCommission, // Use recalculated commission
        operatorCommission: operatorCommission, // Use recalculated commission
        receiptNo: shop.receiptNo,
        createdAt: shop.createdAt,
        lastPaymentDate: shop.lastPaymentDate,
        paymentExpiryDate: shop.paymentExpiryDate,
        visitorCount: shop.visitorCount,
      };
    }));

    // Calculate totals using recalculated commissions
    const paidShops = shopsWithDetails.filter(s => s.paymentStatus === 'PAID');
    const totalRevenue = paidShops.reduce((sum, shop) => sum + shop.amount, 0);
    const totalAgentCommission = paidShops.reduce((sum, shop) => sum + shop.agentCommission, 0);
    const totalOperatorCommission = paidShops.reduce((sum, shop) => sum + shop.operatorCommission, 0);

    return NextResponse.json({
      success: true,
      agent: {
        _id: agent._id.toString(),
        name: agent.name,
        agentCode: agent.agentCode,
        email: agent.email,
        phone: agent.phone,
      },
      shops: shopsWithDetails,
      stats: {
        totalShops: shops.length,
        paidShops: paidShops.length,
        pendingShops: shops.length - paidShops.length,
        totalRevenue,
        totalAgentCommission,
        totalOperatorCommission,
      },
    });
  } catch (error: any) {
    console.error('Error fetching agent shops:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch shops' },
      { status: 500 }
    );
  }
}


