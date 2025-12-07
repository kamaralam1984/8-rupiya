import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import AdminShop from '@/lib/models/Shop';
import AgentShop from '@/lib/models/AgentShop';
import Shop from '@/models/Shop'; // Old shop model
import { calculateDistance } from '@/app/utils/distance';
import { PRICING_PLANS } from '@/app/utils/pricing';

/**
 * GET /api/categories/[slug]/businesses
 * 
 * Get shops/businesses for a specific category by slug
 * Query parameters:
 * - type: 'nearby' | 'popular' | 'rated' (optional, default: 'nearby')
 * - loc: Location ID (optional)
 * - userLat: User's latitude (optional, for distance calculation)
 * - userLng: User's longitude (optional, for distance calculation)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();

    const { slug } = await params;
    
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Category slug is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'nearby';
    const userLat = searchParams.get('userLat');
    const userLng = searchParams.get('userLng');

    // Find category by slug
    const category = await Category.findOne({ 
      slug: slug.trim(),
      isActive: true 
    }).lean();

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Build query to find shops with this category
    // Match by category name (case-insensitive) or categoryRef
    const categoryQuery: any = {
      $or: [
        { category: { $regex: new RegExp(`^${category.name}$`, 'i') } },
        { categoryRef: category._id },
      ],
    };

    // Fetch shops from all collections
    const [oldShops, adminShops, agentShops] = await Promise.all([
      Shop.find(categoryQuery).lean().catch(() => []),
      AdminShop.find(categoryQuery).populate('categoryRef', 'name slug').lean().catch(() => []),
      AgentShop.find(categoryQuery).lean().catch(() => []),
    ]);

    // Transform shops to BusinessSummary format
    const transformShop = (shop: any, source: 'old' | 'admin' | 'agent'): any => {
      const shopName = shop.shopName || shop.name || 'Unknown';
      const imageUrl = shop.photoUrl || shop.imageUrl || shop.iconUrl || '';
      const address = shop.fullAddress || shop.address || '';
      
      // Calculate distance if coordinates provided
      let distance = 0;
      if (userLat && userLng && shop.latitude && shop.longitude) {
        const userLatNum = parseFloat(userLat);
        const userLngNum = parseFloat(userLng);
        if (!isNaN(userLatNum) && !isNaN(userLngNum)) {
          distance = calculateDistance(userLatNum, userLngNum, shop.latitude, shop.longitude);
        }
      }

      // Get category name from populated categoryRef if available
      const categoryName = (shop.categoryRef && typeof shop.categoryRef === 'object' && shop.categoryRef.name)
        ? shop.categoryRef.name
        : shop.category || category.name;

      const planType = (shop.planType || 'BASIC') as keyof typeof PRICING_PLANS;
      const planDetails = PRICING_PLANS[planType] || PRICING_PLANS.BASIC;
      const priorityRank = shop.priorityRank !== undefined && shop.priorityRank !== null 
        ? shop.priorityRank 
        : planDetails.priorityRank;

      return {
        id: shop._id.toString(),
        name: shopName,
        category: categoryName,
        imageUrl: imageUrl,
        rating: shop.rating || 4.5,
        reviews: shop.reviews || 0,
        city: shop.city || '',
        state: shop.state || '',
        address: address,
        area: shop.area || '',
        phone: shop.mobile || shop.phone || '',
        email: shop.email || '',
        website: shop.website || '',
        latitude: shop.latitude,
        longitude: shop.longitude,
        description: shop.description || '',
        offerPercent: shop.offerPercent || 0,
        priceLevel: shop.priceLevel || '',
        tags: shop.tags || [],
        featured: shop.planType === 'FEATURED' || shop.isHomePageBanner || false,
        sponsored: shop.planType === 'PREMIUM' || shop.planType === 'FEATURED' || false,
        distance: distance,
        visitorCount: shop.visitorCount || 0,
        planType: planType,
        priorityRank: priorityRank,
        popularity: shop.visitorCount || 0, // Use visitor count as popularity
      };
    };

    const allShops = [
      ...oldShops.map((shop: any) => transformShop(shop, 'old')),
      ...adminShops.map((shop: any) => transformShop(shop, 'admin')),
      ...agentShops.map((shop: any) => transformShop(shop, 'agent')),
    ];

    // Sort based on type
    let sortedShops = [...allShops];
    
    if (type === 'nearby') {
      // Sort by distance (if available), then by priority rank
      sortedShops.sort((a, b) => {
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
        return (b.priorityRank || 0) - (a.priorityRank || 0);
      });
    } else if (type === 'popular') {
      // Sort by visitor count (popularity), then by priority rank
      sortedShops.sort((a, b) => {
        if (b.popularity !== a.popularity) {
          return (b.popularity || 0) - (a.popularity || 0);
        }
        return (b.priorityRank || 0) - (a.priorityRank || 0);
      });
    } else if (type === 'rated') {
      // Sort by rating, then by reviews, then by priority rank
      sortedShops.sort((a, b) => {
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        if (b.reviews !== a.reviews) {
          return b.reviews - a.reviews;
        }
        return (b.priorityRank || 0) - (a.priorityRank || 0);
      });
    }

    return NextResponse.json({
      success: true,
      businesses: sortedShops,
      category: {
        name: category.name,
        slug: category.slug,
        description: category.description,
      },
      count: sortedShops.length,
    });
  } catch (error: any) {
    console.error('Error fetching businesses by category:', error);
    console.error('Error stack:', error.stack);
    
    // Return a proper error response
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error', 
        details: error.message || 'Unknown error',
        businesses: [] // Return empty array to prevent frontend errors
      },
      { status: 500 }
    );
  }
}







