import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminShop from '@/lib/models/Shop';
import AgentShop from '@/lib/models/AgentShop';

/**
 * GET /api/shops/by-plan?planType=LEFT_BAR&limit=10
 * Get shops by plan type (public endpoint, no auth required)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const planType = searchParams.get('planType');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!planType) {
      return NextResponse.json(
        { error: 'planType query parameter is required' },
        { status: 400 }
      );
    }

    // Fetch shops with specified plan type
    const [adminShops, agentShops] = await Promise.all([
      AdminShop.find({ planType: planType.toUpperCase() }).limit(limit).lean(),
      AgentShop.find({ planType: planType.toUpperCase() }).limit(limit).lean(),
    ]);

    // Combine and transform shops
    const shops = [...adminShops, ...agentShops].map((shop: any) => ({
      id: shop._id.toString(),
      name: shop.shopName || shop.name,
      category: shop.category,
      imageUrl: shop.photoUrl || shop.iconUrl || shop.imageUrl,
      latitude: shop.latitude,
      longitude: shop.longitude,
      planType: shop.planType || 'BASIC',
      isLeftBar: shop.isLeftBar || shop.planType === 'LEFT_BAR' || false,
      isRightBar: shop.isRightBar || shop.planType === 'RIGHT_BAR' || false,
      distance: 0, // Will be calculated on frontend if location available
    }));

    return NextResponse.json({
      success: true,
      shops,
      count: shops.length,
      planType: planType.toUpperCase(),
    });
  } catch (error: any) {
    console.error('Error fetching shops by plan type:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}








