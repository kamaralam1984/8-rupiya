import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminShop from '@/lib/models/Shop';
import Shop from '@/models/Shop'; // Old Shop model
import AgentShop from '@/lib/models/AgentShop';
import Agent from '@/lib/models/Agent';
import Revenue from '@/lib/models/Revenue';
import { requireAdmin } from '@/lib/auth';
import { calculateAgentCommission, PlanType } from '@/app/utils/pricing';
import mongoose from 'mongoose';

/**
 * GET /api/admin/shops/[id]
 * Get a single shop by ID
 */
export const GET = requireAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await connectDB();

    const { id } = await params;
    const shopId = id;

    // Try to find shop in new AdminShop collection first
    let shop: any = await AdminShop.findById(shopId).lean();
    let isOldModel = false;
    
    // If not found, try old Shop model
    if (!shop) {
      shop = await Shop.findById(shopId).lean();
      isOldModel = true;
    }
    
    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Transform old model to match new format
    if (isOldModel) {
      return NextResponse.json({
        success: true,
        shop: {
          _id: shop._id,
          shopName: shop.name,
          ownerName: 'N/A',
          category: shop.category,
          photoUrl: shop.imageUrl,
          imageUrl: shop.imageUrl,
          iconUrl: shop.iconUrl,
          latitude: shop.latitude,
          longitude: shop.longitude,
          area: shop.area,
          fullAddress: shop.address,
          address: shop.address,
          city: undefined,
          pincode: undefined,
          createdAt: shop.createdAt,
          isOldModel: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      shop,
    });
  } catch (error: any) {
    console.error('Get shop error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/admin/shops/[id]
 * Update a shop
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

    const {
      shopName,
      ownerName,
      category,
      mobile,
      area,
      fullAddress,
      city,
      pincode,
      latitude,
      longitude,
      photoUrl,
    } = body;

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

    // Update shop based on model type
    if (!isOldModel) {
      // Update new model
      if (shopName) shop.shopName = shopName;
      if (ownerName) shop.ownerName = ownerName;
      if (category) shop.category = category;
      if (mobile !== undefined) shop.mobile = mobile;
      if (area !== undefined) shop.area = area;
      if (fullAddress) shop.fullAddress = fullAddress;
      if (city !== undefined) shop.city = city;
      if (pincode !== undefined) shop.pincode = pincode;
      if (latitude !== undefined) shop.latitude = Number(latitude);
      if (longitude !== undefined) shop.longitude = Number(longitude);
      if (photoUrl) {
        shop.photoUrl = photoUrl;
        shop.iconUrl = photoUrl;
      }
      await shop.save();
    } else {
      // Update old model
      if (shopName) shop.name = shopName;
      if (category) shop.category = category;
      if (area !== undefined) shop.area = area;
      if (fullAddress) shop.address = fullAddress;
      if (latitude !== undefined) shop.latitude = Number(latitude);
      if (longitude !== undefined) shop.longitude = Number(longitude);
      if (photoUrl) {
        shop.imageUrl = photoUrl;
        shop.iconUrl = photoUrl;
      }
      await shop.save();
    }

    // Update corresponding AgentShop if exists
    try {
      const agentShop = await AgentShop.findOne({
        $or: [
          {
            shopName: shop.shopName || shop.name,
            ownerName: shop.ownerName || 'N/A',
            mobile: shop.mobile || mobile,
          },
          {
            shopName: shop.shopName || shop.name,
            ownerName: shop.ownerName || 'N/A',
          },
          {
            shopName: shop.shopName || shop.name,
          }
        ]
      });

      if (agentShop) {
        if (shopName) agentShop.shopName = shopName;
        if (ownerName) agentShop.ownerName = ownerName;
        if (category) agentShop.category = category;
        if (mobile !== undefined) agentShop.mobile = mobile;
        if (pincode !== undefined) agentShop.pincode = pincode;
        if (fullAddress) agentShop.address = fullAddress;
        if (latitude !== undefined) agentShop.latitude = Number(latitude);
        if (longitude !== undefined) agentShop.longitude = Number(longitude);
        if (photoUrl) agentShop.photoUrl = photoUrl;
        await agentShop.save();
      }
    } catch (agentShopError) {
      console.error('Error updating agent shop:', agentShopError);
      // Continue even if agent shop update fails
    }

    return NextResponse.json({
      success: true,
      message: 'Shop updated successfully',
      shop,
    });
  } catch (error: any) {
    console.error('Update shop error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/admin/shops/[id]
 * Delete a shop and update agent commission and revenue
 */
export const DELETE = requireAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await connectDB();

    const { id } = await params;
    const shopId = id;

    // Try to find shop in new AdminShop collection first
    let shop: any = await AdminShop.findById(shopId).lean();
    let isOldModel = false;
    
    // If not found, try old Shop model
    if (!shop) {
      shop = await Shop.findById(shopId).lean();
      isOldModel = true;
    }
    
    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Get shop details for commission and revenue calculation
    const shopName = shop.shopName || shop.name;
    const ownerName = shop.ownerName || 'N/A';
    const shopMobile = shop.mobile;
    const planType = (shop.planType || 'BASIC') as PlanType;
    const planAmount = shop.planAmount || 100;
    const paymentStatus = shop.paymentStatus || (shop.lastPaymentDate ? 'PAID' : 'PENDING');
    const district = shop.district || 'UNKNOWN';
    const paymentDate = shop.lastPaymentDate || shop.createdAt;

    // Find corresponding AgentShop
    let agentShop: any = null;
    let agent: any = null;
    let commissionDeducted = 0;
    let revenueDeducted = 0;

    try {
      // Strategy 1: Check if createdByAdmin is an agent ID
      if (shop.createdByAdmin) {
        const possibleAgent = await Agent.findById(shop.createdByAdmin);
        if (possibleAgent) {
          // Find AgentShop by agentId
          agentShop = await AgentShop.findOne({
            agentId: shop.createdByAdmin,
            shopName: shopName,
            ownerName: ownerName,
          });
          
          if (!agentShop && shopMobile) {
            agentShop = await AgentShop.findOne({
              agentId: shop.createdByAdmin,
              shopName: shopName,
              mobile: shopMobile,
            });
          }
        }
      }

      // Strategy 2: Try to find AgentShop by matching shop details
      if (!agentShop && shopMobile) {
        agentShop = await AgentShop.findOne({
          shopName: shopName,
          ownerName: ownerName,
          mobile: shopMobile,
        });
      }
      
      if (!agentShop) {
        agentShop = await AgentShop.findOne({
          shopName: shopName,
          ownerName: ownerName,
        });
      }

      if (!agentShop) {
        agentShop = await AgentShop.findOne({
          shopName: shopName,
        });
      }

      // If AgentShop found and shop was PAID, deduct commission and revenue
      if (agentShop && paymentStatus === 'PAID') {
        agent = await Agent.findById(agentShop.agentId);
        
        if (agent) {
          // Calculate commission to deduct
          commissionDeducted = agentShop.agentCommission || calculateAgentCommission(planType, planAmount);
          
          // Deduct commission from agent's total earnings
          if (agent.totalEarnings && agent.totalEarnings >= commissionDeducted) {
            agent.totalEarnings = agent.totalEarnings - commissionDeducted;
          } else {
            console.warn(`Agent ${agent.name} has insufficient earnings (${agent.totalEarnings || 0}) to deduct commission (${commissionDeducted})`);
            // Still deduct what we can
            if (agent.totalEarnings) {
              agent.totalEarnings = Math.max(0, agent.totalEarnings - commissionDeducted);
            }
          }
          
          // Decrease agent's total shops count
          if (agent.totalShops && agent.totalShops > 0) {
            agent.totalShops = agent.totalShops - 1;
          }
          
          await agent.save();
          console.log(`Deducted ₹${commissionDeducted} commission and 1 shop from agent ${agent.name} (${agent.agentCode})`);
        }

        // Deduct revenue
        if (paymentDate) {
          const paymentDateOnly = new Date(paymentDate);
          paymentDateOnly.setHours(0, 0, 0, 0);
          const districtName = district.toUpperCase();

          // Find revenue record
          const revenue = await Revenue.findOne({
            date: paymentDateOnly,
            district: districtName,
          });

          if (revenue) {
            // Calculate revenue to deduct
            revenueDeducted = planAmount;

            // Deduct plan-specific revenue
            const revenueUpdate: any = {
              $inc: {
                totalRevenue: -revenueDeducted,
                totalAgentCommission: -commissionDeducted,
                netRevenue: -(revenueDeducted - commissionDeducted),
              },
            };

            // Deduct plan-specific revenue
            switch (planType) {
              case 'BASIC':
                revenueUpdate.$inc.basicPlanRevenue = -revenueDeducted;
                revenueUpdate.$inc.basicPlanCount = -1;
                break;
              case 'PREMIUM':
                revenueUpdate.$inc.premiumPlanRevenue = -revenueDeducted;
                revenueUpdate.$inc.premiumPlanCount = -1;
                break;
              case 'FEATURED':
                revenueUpdate.$inc.featuredPlanRevenue = -revenueDeducted;
                revenueUpdate.$inc.featuredPlanCount = -1;
                break;
              case 'LEFT_BAR':
                revenueUpdate.$inc.leftBarPlanRevenue = -revenueDeducted;
                revenueUpdate.$inc.leftBarPlanCount = -1;
                break;
              case 'RIGHT_BAR':
                revenueUpdate.$inc.rightBarPlanRevenue = -revenueDeducted;
                revenueUpdate.$inc.rightBarPlanCount = -1;
                break;
              case 'BANNER':
                revenueUpdate.$inc.bannerPlanRevenue = -revenueDeducted;
                revenueUpdate.$inc.bannerPlanCount = -1;
                break;
              case 'HERO':
                revenueUpdate.$inc.heroPlanRevenue = -revenueDeducted;
                revenueUpdate.$inc.heroPlanCount = -1;
                break;
            }

            await Revenue.findByIdAndUpdate(revenue._id, revenueUpdate);
            console.log(`Deducted ₹${revenueDeducted} revenue and ₹${commissionDeducted} commission from revenue record`);
          }
        }
      }
    } catch (deductionError: any) {
      console.error('Error deducting commission/revenue:', deductionError);
      // Continue with deletion even if deduction fails
    }

    // Delete from all collections
    // 1. Delete from AdminShop (new model)
    if (!isOldModel) {
      await AdminShop.findByIdAndDelete(shopId);
    } else {
      // 2. Delete from Shop (old model)
      await Shop.findByIdAndDelete(shopId);
    }

    // 3. Delete from AgentShop if found
    if (agentShop) {
      await AgentShop.findByIdAndDelete(agentShop._id);
      console.log('Deleted AgentShop:', agentShop._id);
    }

    return NextResponse.json({
      success: true,
      message: paymentStatus === 'PAID' 
        ? `Shop deleted successfully. Deducted ₹${commissionDeducted} from agent commission and ₹${revenueDeducted} from revenue.`
        : 'Shop deleted successfully',
      deductions: {
        commissionDeducted,
        revenueDeducted,
        agentName: agent?.name,
        agentCode: agent?.agentCode,
      },
    });
  } catch (error: any) {
    console.error('Delete shop error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

