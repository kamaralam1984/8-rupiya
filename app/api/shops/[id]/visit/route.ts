import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminShop from '@/lib/models/Shop';
import Shop from '@/models/Shop'; // Old Shop model
import AgentShop from '@/lib/models/AgentShop';

/**
 * POST /api/shops/[id]/visit
 * Track a shop visit (increment visitor count)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Try to find and update in new AdminShop collection first
    let shop = await AdminShop.findById(id);
    let isOldModel = false;

    // If not found, try old Shop model
    if (!shop) {
      shop = await Shop.findById(id);
      isOldModel = true;
    }

    // If still not found, try AgentShop
    if (!shop) {
      shop = await AgentShop.findById(id);
    }

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Increment visitor count
    if (isOldModel) {
      // Old model might not have visitorCount field
      // Try to update if it exists, otherwise skip
      try {
        if ('visitorCount' in shop) {
          shop.visitorCount = (shop.visitorCount || 0) + 1;
          await shop.save();
        }
      } catch (error) {
        // Field doesn't exist in old model, skip
        console.log('visitorCount field not available in old model');
      }
    } else {
      shop.visitorCount = (shop.visitorCount || 0) + 1;
      await shop.save();
    }

    return NextResponse.json(
      {
        success: true,
        visitorCount: shop.visitorCount || 0,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Track visit error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

