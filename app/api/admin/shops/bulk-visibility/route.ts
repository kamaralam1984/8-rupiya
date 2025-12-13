import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import AdminShop from '@/lib/models/Shop';

/**
 * PUT /api/admin/shops/bulk-visibility
 * Bulk update visibility for multiple shops
 */
export const PUT = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();
    const { shopIds, isVisible } = await request.json();

    if (!Array.isArray(shopIds) || shopIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'shopIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (typeof isVisible !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isVisible must be a boolean' },
        { status: 400 }
      );
    }

    // Bulk update shop visibility
    const result = await AdminShop.updateMany(
      { _id: { $in: shopIds } },
      { $set: { isVisible } }
    );

    return NextResponse.json({
      success: true,
      updatedCount: result.modifiedCount,
      totalRequested: shopIds.length,
    });
  } catch (error: any) {
    console.error('Error bulk updating shop visibility:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to bulk update shop visibility', details: error.message },
      { status: 500 }
    );
  }
});



