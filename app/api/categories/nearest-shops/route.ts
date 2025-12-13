import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import AdminShop from '@/lib/models/Shop';
import AgentShop from '@/lib/models/AgentShop';
import Shop from '@/models/Shop';
import { calculateDistance } from '@/app/utils/distance';

// Cache-Control headers
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240',
};

/**
 * GET /api/categories/nearest-shops
 * Get nearest shop for each category in a single query
 * Query parameters:
 * - userLat: User's latitude (required)
 * - userLng: User's longitude (required)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userLat = searchParams.get('userLat');
    const userLng = searchParams.get('userLng');

    if (!userLat || !userLng) {
      return NextResponse.json(
        { success: false, error: 'userLat and userLng are required' },
        { status: 400 }
      );
    }

    const userLatNum = parseFloat(userLat);
    const userLngNum = parseFloat(userLng);

    if (isNaN(userLatNum) || isNaN(userLngNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // Fetch all active categories
    const categories = await Category.find({ isActive: true })
      .select('_id name slug')
      .lean();

    if (categories.length === 0) {
      return NextResponse.json({
        success: true,
        categoryShops: {},
      }, {
        headers: CACHE_HEADERS,
      });
    }

    // Payment filter
    const paymentFilter = {
      $or: [
        { paymentStatus: 'PAID' },
        { paymentStatus: { $exists: false } },
      ],
    };

    const categoryIds = categories.map((cat: any) => cat._id);
    const categoryNames = categories.map((cat: any) => cat.name);

    // Fetch nearest shop for each category using aggregation
    // This is much more efficient than N+1 queries
    const [adminShops, agentShops, oldShops] = await Promise.all([
      AdminShop.find({
        ...paymentFilter,
        $or: [
          { categoryRef: { $in: categoryIds } },
          { category: { $in: categoryNames } },
        ],
        latitude: { $exists: true, $nin: [null, 0] },
        longitude: { $exists: true, $nin: [null, 0] },
      })
        .select('category categoryRef latitude longitude visitorCount')
        .lean()
        .catch(() => []),
      AgentShop.find({
        ...paymentFilter,
        category: { $in: categoryNames },
        latitude: { $exists: true, $nin: [null, 0] },
        longitude: { $exists: true, $nin: [null, 0] },
      })
        .select('category latitude longitude visitorCount')
        .lean()
        .catch(() => []),
      Shop.find({
        ...paymentFilter,
        category: { $in: categoryNames },
        latitude: { $exists: true, $nin: [null, 0] },
        longitude: { $exists: true, $nin: [null, 0] },
      })
        .select('category latitude longitude')
        .lean()
        .catch(() => []),
    ]);

    // Combine all shops
    const allShops = [
      ...adminShops.map((shop: any) => ({
        categoryId: shop.categoryRef?.toString(),
        categoryName: shop.category,
        latitude: shop.latitude,
        longitude: shop.longitude,
        visitorCount: shop.visitorCount || 0,
      })),
      ...agentShops.map((shop: any) => ({
        categoryId: null,
        categoryName: shop.category,
        latitude: shop.latitude,
        longitude: shop.longitude,
        visitorCount: shop.visitorCount || 0,
      })),
      ...oldShops.map((shop: any) => ({
        categoryId: null,
        categoryName: shop.category,
        latitude: shop.latitude,
        longitude: shop.longitude,
        visitorCount: 0,
      })),
    ];

    // Calculate distance for each shop and group by category
    const categoryShopsMap: Record<string, { distance: number; visitorCount: number }> = {};

    categories.forEach((category: any) => {
      const categorySlug = category.slug;
      const categoryId = category._id.toString();
      const categoryName = category.name;

      // Find shops for this category
      const categoryShops = allShops.filter(
        (shop) =>
          (shop.categoryId === categoryId) ||
          (shop.categoryName && shop.categoryName.toLowerCase() === categoryName.toLowerCase())
      );

      if (categoryShops.length === 0) {
        categoryShopsMap[categorySlug] = { distance: 0, visitorCount: 0 };
        return;
      }

      // Calculate distances and find nearest
      let nearestShop = categoryShops[0];
      let minDistance = calculateDistance(
        userLatNum,
        userLngNum,
        nearestShop.latitude,
        nearestShop.longitude
      );

      for (const shop of categoryShops) {
        const distance = calculateDistance(
          userLatNum,
          userLngNum,
          shop.latitude,
          shop.longitude
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestShop = shop;
        }
      }

      categoryShopsMap[categorySlug] = {
        distance: minDistance,
        visitorCount: nearestShop.visitorCount,
      };
    });

    return NextResponse.json({
      success: true,
      categoryShops: categoryShopsMap,
    }, {
      headers: CACHE_HEADERS,
    });
  } catch (error: any) {
    // Only log critical errors - reduce verbosity
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching nearest shops for categories:', error.message);
    }
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
        categoryShops: {},
      },
      { status: 500 }
    );
  }
}

