import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminShop from '@/lib/models/Shop';
import Shop from '@/models/Shop'; // Old Shop model
import AgentShop from '@/lib/models/AgentShop';
import mongoose from 'mongoose';

/**
 * GET /api/shops/[id]
 * Get a single shop by ID (Public API)
 * Checks all possible shop collections: AdminShop, old Shop, AgentShop
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid shop ID format' },
        { status: 400 }
      );
    }

    // Try to find shop in new AdminShop collection first
    let shop: any = await AdminShop.findById(id).lean();
    let isOldModel = false;

    // If not found, try old Shop model
    if (!shop) {
      shop = await Shop.findById(id).lean();
      isOldModel = true;
    }

    // If still not found, try AgentShop
    if (!shop) {
      shop = await AgentShop.findById(id).lean();
    }

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Transform old model to match new format
    if (isOldModel) {
      shop = {
        ...shop,
        shopName: shop.name || shop.shopName,
        photoUrl: shop.imageUrl || shop.photoUrl,
        iconUrl: shop.iconUrl || shop.imageUrl,
        fullAddress: shop.address || shop.fullAddress,
        isOldModel: true,
      };
    }

    // Only return visible shops (if isVisible field exists)
    if (shop.isVisible === false) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Only return PAID shops for public API
    if (shop.paymentStatus && shop.paymentStatus !== 'PAID') {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
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
}

