import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminShop from '@/lib/models/Shop';
import Shop from '@/models/Shop'; // Old model
import AgentShop from '@/lib/models/AgentShop';
import Agent from '@/lib/models/Agent';
import Operator from '@/lib/models/Operator';
import { requireAdmin } from '@/lib/auth';
import { PRICING_PLANS, PlanType } from '@/app/utils/pricing';
import { calculateAgentCommission, calculateOperatorCommission } from '@/app/utils/pricing';

/**
 * PUT /api/admin/shops/[id]/update-plan
 * Update shop plan type
 */
export const PUT = requireAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await connectDB();

    const { id } = await params;
    const shopId = id;
    const body = await request.json();
    const { planType } = body;

    if (!planType) {
      return NextResponse.json(
        { error: 'Plan type is required' },
        { status: 400 }
      );
    }

    const validPlans: PlanType[] = ['BASIC', 'PREMIUM', 'FEATURED', 'LEFT_BAR', 'RIGHT_SIDE', 'BOTTOM_RAIL', 'BANNER', 'HERO'];
    if (!validPlans.includes(planType as PlanType)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    const planDetails = PRICING_PLANS[planType as PlanType];

    // Try to find shop in new AdminShop collection first
    let shop: any = await AdminShop.findById(shopId);
    let isOldModel = false;

    // If not found, try old Shop model
    if (!shop) {
      shop = await Shop.findById(shopId);
      isOldModel = true;
    }

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Update shop plan
    if (!isOldModel) {
      shop.planType = planType;
      shop.planAmount = planDetails.amount;
      shop.priorityRank = planDetails.priorityRank;
      shop.isHomePageBanner = planDetails.canBeHomePageBanner;
      shop.isTopSlider = planDetails.canBeTopSlider;
      shop.isLeftBar = planDetails.canBeLeftBar;
      shop.isRightBar = planDetails.canBeRightBar;
      shop.isHero = planDetails.canBeHero;
      await shop.save();
    } else {
      // For old model, try to update if fields exist
      try {
        await Shop.findByIdAndUpdate(shopId, {
          $set: {
            planType: planType,
            planAmount: planDetails.amount,
          }
        });
      } catch (updateError) {
        console.error('Error updating old shop model:', updateError);
      }
    }

    // Update corresponding AgentShop if exists and recalculate commissions
    try {
      const agentShop = await AgentShop.findOne({
        shopName: shop.shopName || shop.name,
        ownerName: shop.ownerName || 'N/A',
      });

      if (agentShop) {
        const oldPlanType = agentShop.planType;
        const oldPlanAmount = agentShop.planAmount || agentShop.amount || 0;
        const oldAgentCommission = agentShop.agentCommission || 0;
        const oldOperatorCommission = agentShop.operatorCommission || 0;
        
        // Update plan type and amount
        agentShop.planType = planType;
        agentShop.planAmount = planDetails.amount;
        
        // Recalculate commissions if shop is PAID
        if (agentShop.paymentStatus === 'PAID') {
          const newPlanAmount = planDetails.amount;
          const newAgentCommission = calculateAgentCommission(planType as PlanType, newPlanAmount);
          const newOperatorCommission = calculateOperatorCommission(planType as PlanType, newPlanAmount, newAgentCommission);
          
          // Update commissions in AgentShop
          agentShop.agentCommission = newAgentCommission;
          agentShop.operatorCommission = newOperatorCommission;
          agentShop.amount = newPlanAmount; // Update amount too
          
          // Update agent and operator earnings if plan changed
          if (oldPlanType !== planType || oldPlanAmount !== newPlanAmount) {
            try {
              const agent = await Agent.findById(agentShop.agentId);
              if (agent) {
                // Subtract old commission and add new commission
                const oldEarnings = agent.totalEarnings || 0;
                const newEarnings = oldEarnings - oldAgentCommission + newAgentCommission;
                agent.totalEarnings = Math.max(0, newEarnings); // Ensure non-negative
                await agent.save();
                
                console.log('Agent commission updated:', {
                  agentId: agent._id.toString(),
                  oldCommission: oldAgentCommission,
                  newCommission: newAgentCommission,
                  oldEarnings,
                  newEarnings,
                });
                
                // Update operator earnings if agent has an operator
                if (agent.operatorId) {
                  const operator = await Operator.findById(agent.operatorId);
                  if (operator) {
                    const oldOperatorEarnings = operator.totalEarnings || 0;
                    const newOperatorEarnings = oldOperatorEarnings - oldOperatorCommission + newOperatorCommission;
                    operator.totalEarnings = Math.max(0, newOperatorEarnings); // Ensure non-negative
                    await operator.save();
                    
                    console.log('Operator commission updated:', {
                      operatorId: operator._id.toString(),
                      oldCommission: oldOperatorCommission,
                      newCommission: newOperatorCommission,
                      oldEarnings: oldOperatorEarnings,
                      newEarnings: newOperatorEarnings,
                    });
                  }
                }
              }
            } catch (commissionError: any) {
              console.error('Error updating commissions:', commissionError);
              // Continue even if commission update fails
            }
          }
        }
        
        await agentShop.save();
      }
    } catch (agentShopError) {
      console.error('Error updating agent shop:', agentShopError);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Plan updated successfully',
        shop: {
          _id: shop._id?.toString(),
          planType: planType,
          planAmount: planDetails.amount,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update plan error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

