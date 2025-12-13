import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import AdminShop from '@/lib/models/Shop';
import AgentShop from '@/lib/models/AgentShop';

// Cache-Control headers - cache for 5 minutes
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
};

/**
 * GET /api/categories
 * Get all active categories with shop counts (public endpoint, no auth required)
 * Used by website and agents to fetch category list
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Fetch only active categories
    const categories = await Category.find({ isActive: true })
      .select('name slug description imageUrl')
      .sort({ name: 1 }) // Sort alphabetically
      .lean();

    if (categories.length === 0) {
      return NextResponse.json({
        success: true,
        categories: [],
        count: 0,
      }, {
        headers: CACHE_HEADERS,
      });
    }

    // Payment filter for PAID shops only
    const paymentFilter = {
            $or: [
        { paymentStatus: 'PAID' },
        { paymentStatus: { $exists: false } },
      ],
    };

    // Use aggregation to get counts efficiently (single query instead of N+1)
    const categoryIds = categories.map((cat: any) => cat._id);
    const categoryNames = categories.map((cat: any) => cat.name);

    // Get shop counts using aggregation pipeline
    const [adminShopCounts, agentShopCounts] = await Promise.all([
      AdminShop.aggregate([
        {
          $match: {
            ...paymentFilter,
            $or: [
              { categoryRef: { $in: categoryIds } },
              { category: { $in: categoryNames } },
            ],
          },
        },
        {
          $group: {
            _id: {
              $cond: [
                { $ne: ['$categoryRef', null] },
                '$categoryRef',
                { $toLower: '$category' },
              ],
            },
            count: { $sum: 1 },
          },
        },
      ]).catch(() => []),
      AgentShop.aggregate([
        {
          $match: {
            ...paymentFilter,
            category: { $in: categoryNames },
          },
        },
        {
          $group: {
            _id: { $toLower: '$category' },
            count: { $sum: 1 },
          },
        },
      ]).catch(() => []),
        ]);

    // Create count maps for quick lookup
    const adminCountMap = new Map();
    adminShopCounts.forEach((item: any) => {
      const key = item._id?.toString ? item._id.toString() : item._id?.toLowerCase();
      adminCountMap.set(key, item.count);
    });

    const agentCountMap = new Map();
    agentShopCounts.forEach((item: any) => {
      const key = item._id?.toLowerCase();
      agentCountMap.set(key, (agentCountMap.get(key) || 0) + item.count);
    });

    // Map categories with counts
    const categoriesWithCounts = categories.map((cat: any) => {
      const adminCount = adminCountMap.get(cat._id.toString()) || 
                        adminCountMap.get(cat.name.toLowerCase()) || 0;
      const agentCount = agentCountMap.get(cat.name.toLowerCase()) || 0;
      const itemCount = adminCount + agentCount;

        return {
        id: cat._id.toString(),
        _id: cat._id.toString(),
          slug: cat.slug,
        displayName: cat.name,
        name: cat.name,
          description: cat.description,
        iconUrl: cat.imageUrl,
        imageUrl: cat.imageUrl,
        itemCount,
        sponsored: false,
        };
    });

    return NextResponse.json({
      success: true,
      categories: categoriesWithCounts,
      count: categoriesWithCounts.length,
    }, {
      headers: CACHE_HEADERS,
    });
  } catch (error: any) {
    // Only log critical errors - reduce verbosity
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching categories:', error.message);
    }
    
    // Return empty categories array to prevent frontend errors
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        details: error.message || 'Unknown error',
        categories: [], // Return empty array
        count: 0
      },
      { status: 500 }
    );
  }
}
