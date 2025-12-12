import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import AdminShop from '@/lib/models/Shop';

/**
 * PUT /api/admin/shops/[id]/visibility
 * Toggle shop visibility (show/hide)
 */
export const PUT = requireAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await connectDB();
    const { id } = await params;
    const shopId = id;
    const { isVisible } = await request.json();

    if (typeof isVisible !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isVisible must be a boolean' },
        { status: 400 }
      );
    }

    // Update shop visibility
    const shop = await AdminShop.findByIdAndUpdate(
      shopId,
      { isVisible },
      { new: true }
    );

    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      shop: {
        _id: shop._id.toString(),
        shopName: shop.shopName,
        isVisible: shop.isVisible,
      },
    });
  } catch (error: any) {
    console.error('Error updating shop visibility:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update shop visibility', details: error.message },
      { status: 500 }
    );
  }
});

