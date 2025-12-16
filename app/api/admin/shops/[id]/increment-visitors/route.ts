import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import AdminShop from '@/lib/models/Shop';
import Shop from '@/models/Shop'; // Old Shop model
import AgentShop from '@/lib/models/AgentShop';

/**
 * POST /api/admin/shops/[id]/increment-visitors
 * Manually increment visitor count for a shop (Admin only)
 */
export const POST = requireAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const incrementBy = body.incrementBy || 1; // Default increment by 1

    if (incrementBy < 1 || incrementBy > 1000) {
      return NextResponse.json(
        { success: false, error: 'Increment value must be between 1 and 1000' },
        { status: 400 }
      );
    }

    // Try to find shop in new AdminShop collection first
    let shop: any = await AdminShop.findById(id);
    let isOldModel = false;
    let shopModel = 'admin';

    // If not found, try old Shop model
    if (!shop) {
      shop = await Shop.findById(id);
      isOldModel = true;
      shopModel = 'old';
    }

    // If still not found, try AgentShop
    if (!shop) {
      shop = await AgentShop.findById(id);
      shopModel = 'agent';
    }

    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 404 }
      );
    }

    const shopName = shop.shopName || shop.name || 'Unknown';
    const previousCount = shop.visitorCount || 0;

    // Increment visitor count
    if (isOldModel) {
      if ('visitorCount' in shop) {
        shop.visitorCount = previousCount + incrementBy;
        await shop.save();
      } else {
        return NextResponse.json(
          { success: false, error: 'visitorCount field not available in old model' },
          { status: 400 }
        );
      }
    } else {
      shop.visitorCount = previousCount + incrementBy;
      await shop.save();
    }

    const newCount = shop.visitorCount || previousCount;

    console.log(`[ADMIN VISIT] ✅ Manual increment: ${shopName} (${id}) | Model: ${shopModel} | Count: ${previousCount} → ${newCount} | Increment: +${incrementBy}`);

    return NextResponse.json({
      success: true,
      message: `Visitor count incremented by ${incrementBy}`,
      visitorCount: newCount,
      previousCount,
      incrementBy,
      shop: {
        _id: shop._id.toString(),
        name: shopName,
        visitorCount: newCount,
      },
    });
  } catch (error: any) {
    console.error('[ADMIN VISIT] ❌ Error manually incrementing visitors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to increment visitor count', details: error.message },
      { status: 500 }
    );
  }
});



