import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminShop from '@/lib/models/Shop';
import Shop from '@/models/Shop'; // Old Shop model
import AgentShop from '@/lib/models/AgentShop';
import Agent from '@/lib/models/Agent';
import { requireAdmin } from '@/lib/auth';
import { sendPaymentConfirmation } from '@/lib/services/notificationService';
import { calculateAgentCommission, PRICING_PLANS, PlanType } from '@/app/utils/pricing';
import Revenue from '@/lib/models/Revenue';
import mongoose from 'mongoose';

/**
 * POST /api/admin/shops/[id]/mark-payment-done
 * Admin can mark payment as done for any shop
 */
export const POST = requireAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await connectDB();

    const { id } = await params;
    const shopId = id;
    const body = await request.json();
    const { paymentMode, receiptNo, amount, mobile, planType, district } = body;
    
    // Determine plan type and amount
    const finalPlanType: PlanType = (planType || 'BASIC') as PlanType;
    const planDetails = PRICING_PLANS[finalPlanType];
    const finalAmount = amount || planDetails.amount;

    console.log('Marking payment done for shop ID:', shopId);

    // Try to find shop in new AdminShop collection first
    let shop: any = await AdminShop.findById(shopId).lean();
    let isOldModel = false;
    
    // If not found, try old Shop model
    if (!shop) {
      console.log('Shop not found in AdminShop, trying old Shop model...');
      shop = await Shop.findById(shopId).lean();
      isOldModel = true;
    }
    
    if (!shop) {
      console.error('Shop not found in any collection. ID:', shopId);
      return NextResponse.json(
        { error: 'Shop not found', shopId },
        { status: 404 }
      );
    }

    console.log('Shop found:', { 
      id: shop._id, 
      name: shop.shopName || shop.name, 
      isOldModel 
    });

    // Update payment status
    const paymentDate = new Date();
    const expiryDate = new Date(paymentDate);
    expiryDate.setDate(expiryDate.getDate() + 365); // 365 days validity

    // Update shop payment details
    // For new model (AdminShop)
    if (!isOldModel) {
      await AdminShop.findByIdAndUpdate(shopId, {
        $set: {
          paymentStatus: 'PAID', // Mark as paid
          lastPaymentDate: paymentDate,
          paymentExpiryDate: expiryDate,
          planType: finalPlanType,
          planAmount: finalAmount,
          planStartDate: paymentDate,
          planEndDate: expiryDate,
          priorityRank: planDetails.priorityRank,
          district: district || shop.district,
          isHomePageBanner: planDetails.canBeHomePageBanner,
          isTopSlider: planDetails.canBeTopSlider,
          isLeftBar: planDetails.canBeLeftBar,
          isRightBar: planDetails.canBeRightBar,
          isHero: planDetails.canBeHero,
          ...(planDetails.hasWhatsApp && { whatsappNumber: shop.whatsappNumber || shop.mobile }),
        }
      });
      console.log('Updated AdminShop payment status to PAID and plan details');
    } else {
      // For old model, we need to add these fields if they don't exist
      // Since old model might not have these fields, we'll update what we can
      // In production, you might want to migrate old shops to new model
      try {
        await Shop.findByIdAndUpdate(shopId, {
          $set: {
            lastPaymentDate: paymentDate,
            paymentExpiryDate: expiryDate,
          }
        });
        console.log('Updated old Shop model payment dates');
      } catch (updateError) {
        console.error('Error updating old shop model:', updateError);
        // Continue anyway
      }
    }

    // Get shop details for notification and AgentShop update
    const shopName = shop.shopName || shop.name || 'Unknown';
    const ownerName = shop.ownerName || 'N/A';
    const shopMobile = shop.mobile || mobile;

    // Update corresponding AgentShop if exists
    // Try multiple matching strategies to find the agent shop
    let agentShop: any = null;
    try {
      
      // Strategy 1: Match by shop name, owner name, and mobile (exact match)
      if (shopMobile && shopMobile !== 'N/A') {
        agentShop = await AgentShop.findOne({
          shopName: shopName,
          ownerName: ownerName,
          mobile: shopMobile,
        });
      }
      
      // Strategy 2: Match by shop name and owner name (if mobile doesn't match)
      if (!agentShop) {
        agentShop = await AgentShop.findOne({
          shopName: shopName,
          ownerName: ownerName,
        });
      }
      
      // Strategy 3: Match by shop name only (loose match)
      if (!agentShop) {
        agentShop = await AgentShop.findOne({
          shopName: shopName,
        });
      }

      if (agentShop) {
        console.log('Found AgentShop to update:', {
          agentShopId: agentShop._id,
          shopName: agentShop.shopName,
          currentStatus: agentShop.paymentStatus,
        });
        
        // Check if payment was previously PENDING (to add commission)
        const wasPending = agentShop.paymentStatus === 'PENDING';
        
        // Calculate commission based on plan type
        const agentCommission = calculateAgentCommission(finalPlanType, finalAmount);
        
        agentShop.paymentStatus = 'PAID';
        agentShop.paymentMode = paymentMode || 'CASH';
        agentShop.receiptNo = receiptNo || `REC${Date.now()}`;
        agentShop.amount = finalAmount;
        agentShop.planType = finalPlanType;
        agentShop.planAmount = finalAmount;
        agentShop.agentCommission = agentCommission;
        agentShop.district = district || agentShop.district;
        agentShop.lastPaymentDate = paymentDate;
        agentShop.paymentExpiryDate = expiryDate;
        agentShop.createdAt = paymentDate; // Update createdAt to payment date
        await agentShop.save();
        
        console.log('AgentShop payment status updated to PAID');
        
        // Add commission to agent if payment was PENDING
        if (wasPending) {
          try {
            console.log('Attempting to add commission. AgentShop agentId:', agentShop.agentId);
            const agent = await Agent.findById(agentShop.agentId);
            if (agent) {
              const oldEarnings = agent.totalEarnings || 0;
              agent.totalEarnings = oldEarnings + agentCommission;
              
              console.log('Before save - Commission details:', {
                agentId: agent._id.toString(),
                agentName: agent.name,
                planType: finalPlanType,
                planAmount: finalAmount,
                commission: agentCommission,
                oldEarnings,
                newTotalEarnings: agent.totalEarnings,
              });
              
              await agent.save();
              
              // Verify the save
              const updatedAgent = await Agent.findById(agent._id);
              console.log('After save - Verified totalEarnings:', updatedAgent?.totalEarnings);
              
              console.log('Agent commission added successfully:', {
                agentId: agent._id.toString(),
                agentName: agent.name,
                commission: agentCommission,
                oldEarnings,
                newTotalEarnings: agent.totalEarnings,
              });
            } else {
              console.error('Agent not found for agentId:', agentShop.agentId);
            }
          } catch (agentError: any) {
            console.error('Error updating agent commission:', {
              error: agentError.message,
              stack: agentError.stack,
              agentId: agentShop.agentId,
            });
            // Continue even if commission update fails
          }
        } else {
          console.log('Payment was already PAID, no commission added. Previous status:', agentShop.paymentStatus);
        }
      } else {
        console.log('No matching AgentShop found for:', {
          shopName,
          ownerName,
          mobile: shopMobile,
        });
        
        // Try to find agent through createdByAdmin if shop was created by agent
        // This is a fallback if AgentShop matching fails
        try {
          if (shop.createdByAdmin) {
            // Check if createdByAdmin is an agent ID
            const possibleAgent = await Agent.findById(shop.createdByAdmin);
            if (possibleAgent) {
              console.log('Found agent through createdByAdmin, adding commission as fallback');
              const paymentAmount = amount || 100;
              const commission = Math.round(paymentAmount * 0.2);
              const oldEarnings = possibleAgent.totalEarnings || 0;
              possibleAgent.totalEarnings = oldEarnings + commission;
              await possibleAgent.save();
              
              console.log('Fallback commission added:', {
                agentId: possibleAgent._id.toString(),
                agentName: possibleAgent.name,
                commission,
                newTotalEarnings: possibleAgent.totalEarnings,
              });
            }
          }
        } catch (fallbackError) {
          console.error('Fallback commission update failed:', fallbackError);
        }
      }
    } catch (agentShopError) {
      console.error('Error updating agent shop:', agentShopError);
      // Continue even if agent shop update fails
    }

    // Send notification to shop owner with complete bill/receipt
    try {
      if (shopMobile) {
        // Get agent details if available
        let agentName, agentCode;
        if (agentShop && agentShop.agentId) {
          try {
            const agent = await Agent.findById(agentShop.agentId);
            if (agent) {
              agentName = agent.name;
              agentCode = agent.agentCode;
            }
          } catch (agentError) {
            console.error('Error fetching agent details:', agentError);
          }
        }

        await sendPaymentConfirmation({
          mobile: shopMobile,
          shopName: shopName,
          ownerName: ownerName,
          amount: amount || 100,
          receiptNo: receiptNo || `REC${Date.now()}`,
          paymentDate: paymentDate,
          paymentMode: paymentMode || 'CASH',
          category: shop.category || undefined,
          address: shop.fullAddress || shop.address || undefined,
          pincode: shop.pincode || undefined,
          agentName: agentName,
          agentCode: agentCode,
        });
      }
    } catch (notificationError) {
      console.error('Notification sending failed:', notificationError);
      // Don't fail the request if notification fails
    }

    // Update revenue record for the payment date and district
    try {
      const paymentDateOnly = new Date(paymentDate);
      paymentDateOnly.setHours(0, 0, 0, 0);
      
      const districtName = (district || shop.district || 'UNKNOWN').toUpperCase();
      
      // Find or create revenue record for this date and district
      const revenueQuery = {
        date: paymentDateOnly,
        district: districtName,
      };

      // Calculate revenue by plan type
      let revenueUpdate: any = {
        $inc: {
          totalRevenue: finalAmount,
        },
      };

      // Add plan-specific revenue
      switch (finalPlanType) {
        case 'BASIC':
          revenueUpdate.$inc.basicPlanRevenue = finalAmount;
          break;
        case 'PREMIUM':
          revenueUpdate.$inc.premiumPlanRevenue = finalAmount;
          break;
        case 'FEATURED':
          revenueUpdate.$inc.featuredPlanRevenue = finalAmount;
          break;
        case 'LEFT_BAR':
          revenueUpdate.$inc.leftBarPlanRevenue = finalAmount;
          break;
        case 'RIGHT_BAR':
          revenueUpdate.$inc.rightBarPlanRevenue = finalAmount;
          break;
        case 'BANNER':
          revenueUpdate.$inc.bannerPlanRevenue = finalAmount;
          break;
        case 'HERO':
          revenueUpdate.$inc.heroPlanRevenue = finalAmount;
          break;
      }

      // Calculate agent commission for revenue
      const agentCommission = calculateAgentCommission(finalPlanType, finalAmount);
      if (agentCommission > 0) {
        revenueUpdate.$inc.totalAgentCommission = agentCommission;
        revenueUpdate.$inc.netRevenue = finalAmount - agentCommission;
      } else {
        revenueUpdate.$inc.netRevenue = finalAmount;
      }

      // Update or create revenue record
      await Revenue.findOneAndUpdate(
        revenueQuery,
        {
          ...revenueUpdate,
          $setOnInsert: {
            date: paymentDateOnly,
            district: districtName,
            basicPlanRevenue: 0,
            premiumPlanRevenue: 0,
            featuredPlanRevenue: 0,
            leftBarPlanRevenue: 0,
            rightBarPlanRevenue: 0,
            bannerPlanRevenue: 0,
            heroPlanRevenue: 0,
            advertisementRevenue: 0,
            totalRevenue: 0,
            totalAgentCommission: 0,
            netRevenue: 0,
          },
        },
        { upsert: true, new: true }
      );

      console.log('Revenue updated for payment:', {
        date: paymentDateOnly,
        district: districtName,
        amount: finalAmount,
        planType: finalPlanType,
        commission: agentCommission,
      });
    } catch (revenueError: any) {
      console.error('Error updating revenue:', revenueError);
      // Don't fail the request if revenue update fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Payment marked as done and notification sent',
        shop: {
          _id: shop._id?.toString(),
          shopName: shopName,
          ownerName: ownerName,
          lastPaymentDate: paymentDate.toISOString(),
          paymentExpiryDate: expiryDate.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Mark payment done error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

