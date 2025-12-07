import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminShop from '@/lib/models/Shop';
import Shop from '@/models/Shop'; // Old model
import AgentShop from '@/lib/models/AgentShop';
import { requireAdmin } from '@/lib/auth';
import { PRICING_PLANS, PlanType } from '@/app/utils/pricing';

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

    const validPlans: PlanType[] = ['BASIC', 'PREMIUM', 'FEATURED', 'LEFT_BAR', 'RIGHT_BAR', 'BANNER', 'HERO'];
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

    // Update corresponding AgentShop if exists
    try {
      const agentShop = await AgentShop.findOne({
        shopName: shop.shopName || shop.name,
        ownerName: shop.ownerName || 'N/A',
      });

      if (agentShop) {
        agentShop.planType = planType;
        agentShop.planAmount = planDetails.amount;
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

