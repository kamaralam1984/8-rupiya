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
    const pincode = searchParams.get('pincode');
    const category = searchParams.get('category');

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
    
    // Build filters array
    const filters: any[] = [
      { planType: planType.toUpperCase() },
      paymentFilter,
    ];
    
    // Add pincode filter if provided
    if (pincode) {
      filters.push({ pincode: pincode });
    }
    
    // Add category filter if provided
    if (category) {
      filters.push({ category: category });
    }
    
    // Combine all filters using $and
    const query = {
      $and: filters,
    };
    
    // Fetch shops with specified plan type and PAID status only
    const [adminShops, agentShops] = await Promise.all([
      AdminShop.find(query).limit(limit).lean(),
      AgentShop.find(query).limit(limit).lean(),
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
    });
  } catch (error: any) {
    console.error('Error fetching shops by plan type:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}










