import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminShop from '@/lib/models/Shop';
import AgentShop from '@/lib/models/AgentShop';
import RenewalPayment from '@/lib/models/RenewalPayment';
import { requireAdmin } from '@/lib/auth';

/**
 * POST /api/admin/restore/preview
 * Preview what will be deleted during restore
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

    console.log('Preview restore to:', restoreDate);

    // Find shops created after restore point
    const shopsToDelete = await AdminShop.find({
      createdAt: { $gt: restoreDate }
    }).select('shopName ownerName createdAt').limit(20).lean();

    const shopsToDeleteCount = await AdminShop.countDocuments({
      createdAt: { $gt: restoreDate }
    });

    // Find agent shops created after restore point
    const agentShopsToDelete = await AgentShop.find({
      createdAt: { $gt: restoreDate }
    }).select('shopName ownerName createdAt').limit(20).lean();

    const agentShopsToDeleteCount = await AgentShop.countDocuments({
      createdAt: { $gt: restoreDate }
    });

    // Find renewal payments created after restore point
    const renewalPaymentsToDelete = await RenewalPayment.find({
      createdAt: { $gt: restoreDate }
    }).select('shopName renewalDate createdAt').limit(20).lean();

    const renewalPaymentsToDeleteCount = await RenewalPayment.countDocuments({
      createdAt: { $gt: restoreDate }
    });

    // Find shops modified after restore point (but created before)
    const modifiedShops = await AdminShop.countDocuments({
      updatedAt: { $gt: restoreDate },
      createdAt: { $lte: restoreDate }
    });

    return NextResponse.json({
      success: true,
      restoreDateTime: restoreDate.toISOString(),
      shopsToDelete: shopsToDeleteCount,
      agentShopsToDelete: agentShopsToDeleteCount,
      renewalPaymentsToDelete: renewalPaymentsToDeleteCount,
      modifiedShops,
      sampleShops: shopsToDelete,
      sampleAgentShops: agentShopsToDelete,
      sampleRenewalPayments: renewalPaymentsToDelete,
    });
  } catch (error: any) {
    console.error('Restore preview error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate preview' },
      { status: 500 }
    );
  }
});


