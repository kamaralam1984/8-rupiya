import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminShop from '@/lib/models/Shop';
import AgentShop from '@/lib/models/AgentShop';
import RenewalPayment from '@/lib/models/RenewalPayment';
import RenewShop from '@/lib/models/RenewShop';
import Agent from '@/lib/models/Agent';
import { requireAdmin } from '@/lib/auth';

/**
 * POST /api/admin/restore
 * Restore database to a specific point in time
 * Deletes all data created after the restore point
 */
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const body = await request.json();
    const { restoreDateTime } = body;

    if (!restoreDateTime) {
      return NextResponse.json(
        { error: 'Restore date/time is required' },
        { status: 400 }
      );
    }

    const restoreDate = new Date(restoreDateTime);
    if (isNaN(restoreDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date/time format' },
        { status: 400 }
      );
    }

    console.log('Executing restore to:', restoreDate);

    let totalDeleted = 0;
    const deletedDetails: any = {};

    // Delete shops created after restore point
    const shopsResult = await AdminShop.deleteMany({
      createdAt: { $gt: restoreDate }
    });
    deletedDetails.shops = shopsResult.deletedCount;
    totalDeleted += shopsResult.deletedCount;
    console.log(`Deleted ${shopsResult.deletedCount} shops`);

    // Delete agent shops created after restore point
    const agentShopsResult = await AgentShop.deleteMany({
      createdAt: { $gt: restoreDate }
    });
    deletedDetails.agentShops = agentShopsResult.deletedCount;
    totalDeleted += agentShopsResult.deletedCount;
    console.log(`Deleted ${agentShopsResult.deletedCount} agent shops`);

    // Delete renewal payments created after restore point
    const renewalPaymentsResult = await RenewalPayment.deleteMany({
      createdAt: { $gt: restoreDate }
    });
    deletedDetails.renewalPayments = renewalPaymentsResult.deletedCount;
    totalDeleted += renewalPaymentsResult.deletedCount;
    console.log(`Deleted ${renewalPaymentsResult.deletedCount} renewal payments`);

    // Delete renew shops created after restore point
    const renewShopsResult = await RenewShop.deleteMany({
      createdAt: { $gt: restoreDate }
    });
    deletedDetails.renewShops = renewShopsResult.deletedCount;
    totalDeleted += renewShopsResult.deletedCount;
    console.log(`Deleted ${renewShopsResult.deletedCount} renew shops`);

    // Recalculate agent earnings after deletion
    // This ensures agent earnings are accurate after restore
    const agents = await Agent.find({});
    for (const agent of agents) {
      const paidShops = await AgentShop.find({
        agentId: agent._id,
        paymentStatus: 'PAID'
      });

      let totalEarnings = 0;
      for (const shop of paidShops) {
        const commission = shop.agentCommission || 0;
        totalEarnings += commission;
      }

      agent.totalEarnings = totalEarnings;
      await agent.save();
    }

    console.log('Restore completed. Total deleted:', totalDeleted);

    return NextResponse.json({
      success: true,
      restoreDateTime: restoreDate.toISOString(),
      deletedCount: totalDeleted,
      details: deletedDetails,
      message: `Successfully restored database to ${restoreDate.toLocaleString('en-IN')}. Deleted ${totalDeleted} records.`,
    });
  } catch (error: any) {
    console.error('Restore error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to restore database' },
      { status: 500 }
    );
  }
});


