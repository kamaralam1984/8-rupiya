import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminShop from '@/lib/models/Shop';
import Shop from '@/models/Shop';
import AgentShop from '@/lib/models/AgentShop';
import Agent from '@/lib/models/Agent';
import Revenue from '@/lib/models/Revenue';
import { requireAdmin } from '@/lib/auth';
import { calculateAgentCommission, PlanType } from '@/app/utils/pricing';

/**
 * DELETE /api/admin/shops/delete-all
 * Delete all shops from all collections
 * Deducts commission and revenue for paid shops
 */
export const DELETE = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    // Get all shops from all collections
    const [adminShops, oldShops, agentShops] = await Promise.all([
      AdminShop.find({}).lean(),
      Shop.find({}).lean(),
      AgentShop.find({}).lean(),
    ]);

    const totalShops = adminShops.length + oldShops.length + agentShops.length;

    if (totalShops === 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'No shops found to delete',
          deleted: {
            adminShops: 0,
            oldShops: 0,
            agentShops: 0,
            total: 0,
          },
          deductions: {
            totalCommissionDeducted: 0,
            totalRevenueDeducted: 0,
            agentsAffected: 0,
          },
        },
        { status: 200 }
      );
    }

    // Track deductions
    let totalCommissionDeducted = 0;
    let totalRevenueDeducted = 0;
    const agentDeductions: Record<string, { commission: number; shops: number }> = {};
    const revenueDeductions: Record<string, Record<string, { amount: number; commission: number }>> = {};

    // Process paid shops for commission and revenue deduction
    // Combine all shops for processing
    const allShopsForProcessing = [
      ...adminShops.map((s: any) => ({ ...s, source: 'admin' })),
      ...oldShops.map((s: any) => ({ ...s, source: 'old' })),
    ];

    const paidShops = allShopsForProcessing.filter((s: any) => 
      s.paymentStatus === 'PAID' || (s.lastPaymentDate && !s.paymentStatus)
    );

    // Also process AgentShops directly
    const paidAgentShops = agentShops.filter((s: any) => 
      s.paymentStatus === 'PAID'
    );

    // Process AdminShop and OldShop paid shops
    for (const shop of paidShops) {
      try {
        const shopName = shop.shopName || shop.name;
        const ownerName = shop.ownerName || 'N/A';
        const shopMobile = shop.mobile;
        const planType = (shop.planType || 'BASIC') as PlanType;
        const planAmount = shop.planAmount || 100;
        const district = (shop.district || 'UNKNOWN').toUpperCase();
        const paymentDate = shop.lastPaymentDate || shop.createdAt;

        // Find AgentShop
        let agentShop: any = null;
        if (shop.createdByAdmin) {
          const possibleAgent = await Agent.findById(shop.createdByAdmin);
          if (possibleAgent) {
            agentShop = await AgentShop.findOne({
              agentId: shop.createdByAdmin,
              shopName: shopName,
            });
          }
        }

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

        // Deduct commission if AgentShop found
        if (agentShop && agentShop.agentId) {
          const agentId = agentShop.agentId.toString();
          const commission = agentShop.agentCommission || calculateAgentCommission(planType, planAmount);

          if (!agentDeductions[agentId]) {
            agentDeductions[agentId] = { commission: 0, shops: 0 };
          }
          agentDeductions[agentId].commission += commission;
          agentDeductions[agentId].shops += 1;
          totalCommissionDeducted += commission;
        }

        // Track revenue deduction
        if (paymentDate) {
          const paymentDateOnly = new Date(paymentDate);
          paymentDateOnly.setHours(0, 0, 0, 0);
          const dateKey = paymentDateOnly.toISOString().split('T')[0];

          if (!revenueDeductions[district]) {
            revenueDeductions[district] = {};
          }
          if (!revenueDeductions[district][dateKey]) {
            revenueDeductions[district][dateKey] = { amount: 0, commission: 0 };
          }

          const commission = agentShop?.agentCommission || calculateAgentCommission(planType, planAmount);
          revenueDeductions[district][dateKey].amount += planAmount;
          revenueDeductions[district][dateKey].commission += commission;
          totalRevenueDeducted += planAmount;
        }
      } catch (error: any) {
        console.error(`Error processing shop ${shop._id} for deductions:`, error);
        // Continue with other shops
      }
    }

    // Process AgentShops directly
    for (const agentShop of paidAgentShops) {
      try {
        if (agentShop.agentId && agentShop.paymentStatus === 'PAID') {
          const agentId = agentShop.agentId.toString();
          const commission = agentShop.agentCommission || calculateAgentCommission(
            (agentShop.planType || 'BASIC') as PlanType,
            agentShop.planAmount || 100
          );

          if (!agentDeductions[agentId]) {
            agentDeductions[agentId] = { commission: 0, shops: 0 };
          }
          agentDeductions[agentId].commission += commission;
          agentDeductions[agentId].shops += 1;
          totalCommissionDeducted += commission;

          // Track revenue deduction
          const planAmount = agentShop.planAmount || 100;
          const district = (agentShop.district || 'UNKNOWN').toUpperCase();
          const paymentDate = agentShop.lastPaymentDate || agentShop.createdAt;

          if (paymentDate) {
            const paymentDateOnly = new Date(paymentDate);
            paymentDateOnly.setHours(0, 0, 0, 0);
            const dateKey = paymentDateOnly.toISOString().split('T')[0];

            if (!revenueDeductions[district]) {
              revenueDeductions[district] = {};
            }
            if (!revenueDeductions[district][dateKey]) {
              revenueDeductions[district][dateKey] = { amount: 0, commission: 0 };
            }

            revenueDeductions[district][dateKey].amount += planAmount;
            revenueDeductions[district][dateKey].commission += commission;
            totalRevenueDeducted += planAmount;
          }
        }
      } catch (error: any) {
        console.error(`Error processing AgentShop ${agentShop._id} for deductions:`, error);
        // Continue with other shops
      }
    }

    // Deduct from agents
    for (const [agentId, deduction] of Object.entries(agentDeductions)) {
      try {
        const agent = await Agent.findById(agentId);
        if (agent) {
          if (agent.totalEarnings) {
            agent.totalEarnings = Math.max(0, agent.totalEarnings - deduction.commission);
          }
          if (agent.totalShops) {
            agent.totalShops = Math.max(0, agent.totalShops - deduction.shops);
          }
          await agent.save();
          console.log(`Deducted ₹${deduction.commission} commission and ${deduction.shops} shops from agent ${agent.name}`);
        }
      } catch (error: any) {
        console.error(`Error deducting from agent ${agentId}:`, error);
      }
    }

    // Deduct from revenue
    for (const [district, dates] of Object.entries(revenueDeductions)) {
      for (const [dateKey, deduction] of Object.entries(dates)) {
        try {
          const paymentDate = new Date(dateKey);
          paymentDate.setHours(0, 0, 0, 0);

          const revenue = await Revenue.findOne({
            date: paymentDate,
            district: district,
          });

          if (revenue) {
            await Revenue.findByIdAndUpdate(revenue._id, {
              $inc: {
                totalRevenue: -deduction.amount,
                totalAgentCommission: -deduction.commission,
                netRevenue: -(deduction.amount - deduction.commission),
              },
            });
            console.log(`Deducted ₹${deduction.amount} revenue and ₹${deduction.commission} commission from ${district} on ${dateKey}`);
          }
        } catch (error: any) {
          console.error(`Error deducting revenue for ${district} on ${dateKey}:`, error);
        }
      }
    }

    // Delete all shops from all collections
    const [adminResult, oldResult, agentResult] = await Promise.all([
      AdminShop.deleteMany({}),
      Shop.deleteMany({}),
      AgentShop.deleteMany({}),
    ]);

    // Reset all agents' totalShops to 0 since all shops are deleted
    try {
      await Agent.updateMany({}, { $set: { totalShops: 0 } });
      console.log('Reset all agents totalShops to 0');
    } catch (error: any) {
      console.error('Error resetting agents totalShops:', error);
      // Continue even if this fails
    }

    const deletedCounts = {
      adminShops: adminResult.deletedCount || 0,
      oldShops: oldResult.deletedCount || 0,
      agentShops: agentResult.deletedCount || 0,
      total: (adminResult.deletedCount || 0) + (oldResult.deletedCount || 0) + (agentResult.deletedCount || 0),
    };

    return NextResponse.json(
      {
        success: true,
        message: `All shops deleted successfully. Deducted ₹${totalCommissionDeducted} from agent commissions and ₹${totalRevenueDeducted} from revenue.`,
        deleted: deletedCounts,
        deductions: {
          totalCommissionDeducted,
          totalRevenueDeducted,
          agentsAffected: Object.keys(agentDeductions).length,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete all shops error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

