import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminShop from '@/lib/models/Shop';
import AgentShop from '@/lib/models/AgentShop';

// Cache-Control headers - cache for 2 minutes
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240',
};

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

    // IMPORTANT: Only show PAID shops (PENDING shops require admin approval)
    // Filter by payment status - only PAID shops should be displayed
    const paymentFilter = {
      $or: [
        { paymentStatus: 'PAID' },
        { paymentStatus: { $exists: false } }, // Old shops without paymentStatus field
      ],
    };
    
    // Combine plan type and payment filters using $and
    const query = {
      $and: [
        { planType: planType.toUpperCase() },
        paymentFilter,
      ],
    };
    
    // Fetch shops with specified plan type and PAID status only
    // Use field selection to reduce payload size
    const fields = 'shopName name category photoUrl iconUrl imageUrl latitude longitude city fullAddress address area mobile planType priorityRank visitorCount shopUrl';
    const [adminShops, agentShops] = await Promise.all([
      AdminShop.find(query).select(fields).limit(limit).sort({ priorityRank: -1, createdAt: -1 }).lean(),
      AgentShop.find(query).select('shopName category photoUrl latitude longitude address area mobile planType visitorCount shopUrl').limit(limit).sort({ createdAt: -1 }).lean(),
    ]);

    // Combine and transform shops
    const shops = [...adminShops, ...agentShops].map((shop: any) => ({
      id: shop._id.toString(),
      name: shop.shopName || shop.name,
      shopName: shop.shopName || shop.name,
      category: shop.category,
      imageUrl: shop.photoUrl || shop.iconUrl || shop.imageUrl || '/placeholder-shop.jpg',
      photoUrl: shop.photoUrl || shop.iconUrl,
      shopUrl: shop.shopUrl,
      latitude: shop.latitude || 0,
      longitude: shop.longitude || 0,
      planType: shop.planType || 'BASIC',
      priorityRank: shop.priorityRank || 0,
      isLeftBar: shop.isLeftBar || shop.planType === 'LEFT_BAR' || false,
      isRightBar: shop.isRightBar || shop.planType === 'RIGHT_BAR' || false,
      website: shop.website || '',
      area: shop.area || '',
      city: shop.city || '',
      distance: 0, // Will be calculated on frontend if location available
    }));

    return NextResponse.json({
      success: true,
      shops,
      count: shops.length,
      planType: planType.toUpperCase(),
    }, {
      headers: CACHE_HEADERS,
    });
  } catch (error: any) {
    console.error('Error fetching shops by plan type:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}










