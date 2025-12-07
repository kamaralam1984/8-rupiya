import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import AdminShop from '@/lib/models/Shop';
import AgentShop from '@/lib/models/AgentShop';

/**
 * DELETE /api/admin/shops/delete-without-coordinates
 * Delete all shops that don't have coordinates (latitude/longitude)
 */
export const DELETE = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    // Find shops without coordinates in AdminShop collection
    const adminShopsWithoutCoords = await AdminShop.find({
      $or: [
        { latitude: { $exists: false } },
        { longitude: { $exists: false } },
        { latitude: null },
        { longitude: null },
        { latitude: 0 },
        { longitude: 0 },
      ],
    }).lean();

    // Find shops without coordinates in AgentShop collection
    const agentShopsWithoutCoords = await AgentShop.find({
      $or: [
        { latitude: { $exists: false } },
        { longitude: { $exists: false } },
        { latitude: null },
        { longitude: null },
        { latitude: 0 },
        { longitude: 0 },
      ],
    }).lean();

    const adminShopIds = adminShopsWithoutCoords.map(shop => shop._id);
    const agentShopIds = agentShopsWithoutCoords.map(shop => shop._id);

    // Delete shops from AdminShop collection
    let adminDeleted = 0;
    if (adminShopIds.length > 0) {
      const adminResult = await AdminShop.deleteMany({
        _id: { $in: adminShopIds },
      });
      adminDeleted = adminResult.deletedCount || 0;
    }

    // Delete shops from AgentShop collection
    let agentDeleted = 0;
    if (agentShopIds.length > 0) {
      const agentResult = await AgentShop.deleteMany({
        _id: { $in: agentShopIds },
      });
      agentDeleted = agentResult.deletedCount || 0;
    }

    const totalDeleted = adminDeleted + agentDeleted;

    return NextResponse.json({
      success: true,
      message: `Deleted ${totalDeleted} shops without coordinates`,
      deleted: {
        adminShops: adminDeleted,
        agentShops: agentDeleted,
        total: totalDeleted,
      },
      details: {
        adminShopsFound: adminShopsWithoutCoords.length,
        agentShopsFound: agentShopsWithoutCoords.length,
      },
    });
  } catch (error: any) {
    console.error('Delete shops without coordinates error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

