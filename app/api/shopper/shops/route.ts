import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop';
import { verifyShopperToken, getShopperTokenFromRequest } from '@/lib/utils/shopperAuth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = getShopperTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyShopperToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Find shops registered by this shopper
    const shops = await AgentShop.find({
      shopperId: payload.shopperId,
    })
      .select('shopName category mobile pincode area planType paymentStatus photoUrl shopUrl')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        shops: shops.map((shop) => ({
          _id: shop._id.toString(),
          shopName: shop.shopName,
          category: shop.category,
          mobile: shop.mobile,
          pincode: shop.pincode,
          area: shop.area,
          planType: shop.planType,
          paymentStatus: shop.paymentStatus,
          photoUrl: shop.photoUrl,
          shopUrl: shop.shopUrl,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching shopper shops:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}


