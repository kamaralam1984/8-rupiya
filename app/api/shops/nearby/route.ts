import { NextRequest, NextResponse } from 'next/server';
import { calculateDistance } from '@/app/utils/distance';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop'; // सिर्फ AgentShop - homepage के लिए
import { PRICING_PLANS } from '@/app/utils/pricing';
import SEO from '@/lib/models/SEO'; // SEO model for ranking

interface ShopWithDistance {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  rating: number;
  reviews: number;
  city: string;
  state?: string;
  address: string;
  area?: string; // Area/locality name
  pincode?: string; // Pincode from database
  phone?: string;
  email?: string;
  website?: string;
  latitude: number;
  longitude: number;
  description?: string;
  offerPercent?: number;
  priceLevel?: string;
  tags?: string[];
  featured?: boolean;
  sponsored?: boolean;
  distance: number; // Distance in kilometers
  visitorCount?: number; // Number of visitors
  planType?: 'BASIC' | 'PREMIUM' | 'FEATURED' | 'LEFT_BAR' | 'RIGHT_SIDE' | 'BOTTOM_RAIL' | 'BANNER' | 'HERO'; // Pricing plan
  priorityRank?: number; // Priority ranking for sorting
  isLeftBar?: boolean;
  isRightBar?: boolean;
  seoRanking?: number | null; // SEO ranking from SEO collection
}

/**
 * GET /api/shops/nearby
 * 
 * Query parameters:
 * - userLat: User's latitude (required)
 * - userLng: User's longitude (required)
 * - radiusKm: Search radius in kilometers (optional, default: 10)
 * - useMongoDB: Whether to use MongoDB or mock data (optional, default: false)
 * 
 * Returns shops sorted by distance, filtered by radius
 */
// Aggressive caching - cache for 5 minutes, stale for 10 minutes
// This dramatically reduces database load while keeping data fresh enough
export const revalidate = 300; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userLat = searchParams.get('userLat');
    const userLng = searchParams.get('userLng');
    const radiusKm = searchParams.get('radiusKm');
    const useMongoDB = searchParams.get('useMongoDB') === 'true';
    const city = searchParams.get('city');
    const area = searchParams.get('area');
    const pincode = searchParams.get('pincode');
    const category = searchParams.get('category');
    const planType = searchParams.get('planType');
    const shopName = searchParams.get('shopName');

    // If city, area, pincode, or category is provided, we can search without coordinates
    // But if coordinates are provided, use them for distance calculation
    const hasLocationFilters = city || area || pincode;
    const hasCoordinates = userLat && userLng;

    let userLatNum: number | null = null;
    let userLngNum: number | null = null;
    
    if (hasCoordinates) {
      userLatNum = parseFloat(userLat!);
      userLngNum = parseFloat(userLng!);

      // Validate coordinates
      if (isNaN(userLatNum) || isNaN(userLngNum)) {
        return NextResponse.json(
          { error: 'Invalid coordinates. userLat and userLng must be valid numbers' },
          { status: 400 }
        );
      }

      if (userLatNum < -90 || userLatNum > 90 || userLngNum < -180 || userLngNum > 180) {
        return NextResponse.json(
          { error: 'Coordinates out of valid range' },
          { status: 400 }
        );
      }
    }
    
    const radiusKmNum = radiusKm ? parseFloat(radiusKm) : (hasCoordinates ? 1000 : 0); // Default 1000km if coordinates, 0 (all) if location filter

    if (isNaN(radiusKmNum) || radiusKmNum < 0) {
      return NextResponse.json(
        { error: 'radiusKm must be a non-negative number (0 for all shops)' },
        { status: 400 }
      );
    }

    // Validate that we have either coordinates or location filters
    // If neither is provided, allow fetching all shops (for homepage display)
    // No error - just fetch all shops

    let shops: any[] = [];

    // Load shops from MongoDB or mock data
    if (useMongoDB) {
      try {
        await connectDB();
        
        // Build query filters for city, area, pincode
        const queryFilter: any = {};
        
        if (city) {
          queryFilter.$or = [
            { city: new RegExp(city, 'i') },
            { fullAddress: new RegExp(city, 'i') },
            { address: new RegExp(city, 'i') },
          ];
        }
        
        if (area) {
          if (queryFilter.$or) {
            queryFilter.$or.push(
              { area: new RegExp(area, 'i') },
              { fullAddress: new RegExp(area, 'i') },
              { address: new RegExp(area, 'i') }
            );
          } else {
            queryFilter.$or = [
              { area: new RegExp(area, 'i') },
              { fullAddress: new RegExp(area, 'i') },
              { address: new RegExp(area, 'i') },
            ];
          }
        }
        
        if (pincode) {
          if (queryFilter.$or) {
            queryFilter.$or.push({ pincode: pincode });
          } else {
            queryFilter.pincode = pincode;
          }
        }
        
        // Add category filter (exact match)
        if (category) {
          // Category should be exact match, add to $and if $or exists, otherwise add directly
          if (queryFilter.$or) {
            // If $or exists, we need to use $and to combine with category
            const existingFilter = { ...queryFilter };
            queryFilter.$and = [
              existingFilter,
              { category: category }
            ];
            delete queryFilter.$or;
          } else {
            queryFilter.category = category;
          }
        }
        
        // Add planType filter
        if (planType) {
          if (queryFilter.$and) {
            queryFilter.$and.push({ planType: planType });
          } else if (queryFilter.$or) {
            const existingFilter = { ...queryFilter };
            queryFilter.$and = [
              existingFilter,
              { planType: planType }
            ];
            delete queryFilter.$or;
          } else {
            queryFilter.planType = planType;
          }
        }
        
        // Add shopName filter (search)
        if (shopName) {
          const shopNameRegex = new RegExp(shopName, 'i');
          if (queryFilter.$and) {
            queryFilter.$and.push({ shopName: shopNameRegex });
          } else if (queryFilter.$or) {
            const existingFilter = { ...queryFilter };
            queryFilter.$and = [
              existingFilter,
              { shopName: shopNameRegex }
            ];
            delete queryFilter.$or;
          } else {
            queryFilter.shopName = shopNameRegex;
          }
        }
        
        // Also filter by coordinates if provided (for shops with valid coordinates)
        if (hasCoordinates) {
          // We'll filter by distance later, but ensure shops have coordinates
          queryFilter.latitude = { $exists: true, $nin: [null, 0] };
          queryFilter.longitude = { $exists: true, $nin: [null, 0] };
        }
        
        // IMPORTANT: Only show PAID shops on homepage (PENDING shops require admin approval)
        // Filter by payment status - only PAID shops should be displayed
        // Also filter by visibility - only show shops where isVisible !== false
        const paymentFilter = {
          $or: [
            { paymentStatus: 'PAID' },
            { paymentStatus: { $exists: false } }, // Old shops without paymentStatus field
          ],
        };
        
        // Visibility filter - only show visible shops (isVisible !== false)
        const visibilityFilter = {
          $or: [
            { isVisible: true },
            { isVisible: { $exists: false } }, // Shops without isVisible field (default to visible)
          ],
        };
        
        // Combine all filters
        const allFilters = [paymentFilter, visibilityFilter];
        if (Object.keys(queryFilter).length > 0) {
          allFilters.push(queryFilter);
        }
        
        const finalQuery = allFilters.length > 1
          ? { $and: allFilters }
          : allFilters[0];
        
        // IMPORTANT: Homepage पर सिर्फ AgentShop से shops fetch करें
        // Shop.ts (AdminShop) और old Shop model से नहीं
        // Check if limit parameter is provided in URL
        const limitParam = searchParams.get('limit');
        const limitCount = limitParam ? parseInt(limitParam) : undefined;
        
        // Base filter for shops without query filters (payment + visibility)
        const baseFilter = {
          $and: [paymentFilter, visibilityFilter]
        };
        
        // सिर्फ AgentShop से fetch करें - Only select needed fields for performance
        const projection = {
          _id: 1,
          shopName: 1,
          category: 1,
          photoUrl: 1,
          city: 1,
          area: 1,
          pincode: 1,
          address: 1,
          mobile: 1,
          latitude: 1,
          longitude: 1,
          visitorCount: 1,
          planType: 1,
          ownerName: 1,
        };
        
        // Add default limit to prevent loading too much data - optimized for performance
        const maxLimit = Math.min(limitCount || 50, 100); // Reduced max to 100 for faster queries
        
        // Use optimized query with proper indexes
        const agentShops = await (Object.keys(finalQuery).length > 0 
          ? AgentShop.find(finalQuery).select(projection).limit(maxLimit).lean().hint({ paymentStatus: 1, planType: 1 }).sort({ planType: 1, visitorCount: -1 })
          : AgentShop.find(baseFilter).select(projection).limit(maxLimit).lean().hint({ paymentStatus: 1, planType: 1 }).sort({ planType: 1, visitorCount: -1 })
        ).catch(() => []);
        
        console.log(`📍 Fetching shops from AgentShop only: ${agentShops.length} shops found`);
        
        // Transform agent shops - सिर्फ AgentShop से
        const transformedAgentShops = agentShops.map((shop: any) => ({
          id: shop._id.toString(),
          name: shop.shopName,
          shopName: shop.shopName, // Add shopName for compatibility
          category: shop.category,
          imageUrl: shop.photoUrl,
          photoUrl: shop.photoUrl, // Add photoUrl for compatibility
          rating: 4.5, // Default rating
          reviews: 0,
          city: shop.city || '',
          area: shop.area || '',
          pincode: shop.pincode || '',
          state: '',
          address: shop.address,
          phone: shop.mobile || '',
          mobile: shop.mobile || '', // Add mobile for compatibility
          email: '',
          website: '',
          latitude: shop.latitude,
          longitude: shop.longitude,
          description: '',
          offerPercent: 0,
          priceLevel: '',
          tags: [],
          featured: shop.planType === 'FEATURED' || false,
          sponsored: shop.planType === 'PREMIUM' || shop.planType === 'FEATURED' || false,
          visitorCount: shop.visitorCount || 0,
          planType: shop.planType || 'BASIC',
          priorityRank: (() => {
            const planType = (shop.planType || 'BASIC') as keyof typeof PRICING_PLANS;
            const planDetails = PRICING_PLANS[planType] || PRICING_PLANS.BASIC;
            return planDetails.priorityRank;
          })(),
          isLeftBar: shop.planType === 'LEFT_BAR' || false,
          isRightBar: shop.planType === 'RIGHT_SIDE' || false,
          ownerName: shop.ownerName, // Add ownerName for compatibility
        }));
        
        // Remove duplicates - same shopName + ownerName + mobile combination
        const uniqueShopsMap = new Map<string, any>();
        transformedAgentShops.forEach((shop: any) => {
          // Skip shops without enough identifying information
          const shopName = (shop.name || shop.shopName || '').trim();
          const ownerName = (shop.ownerName || '').trim();
          const mobile = (shop.phone || shop.mobile || '').trim();
          const shopId = shop.id || shop._id || '';
          
          // If shop has no name and no ID, skip it
          if (!shopName && !shopId) {
            return;
          }
          
          // Create unique key from shopName + ownerName + mobile + ID (fallback)
          // Use ID as part of key to ensure uniqueness even if other fields are empty
          const uniqueKey = shopId 
            ? `${shopName.toLowerCase()}_${ownerName.toLowerCase()}_${mobile}_${shopId}`
            : `${shopName.toLowerCase()}_${ownerName.toLowerCase()}_${mobile}`;
          
          // अगर पहले से नहीं है, तो add करें
          // अगर है, तो latest (higher visitorCount) को keep करें
          if (!uniqueShopsMap.has(uniqueKey)) {
            uniqueShopsMap.set(uniqueKey, shop);
          } else {
            const existingShop = uniqueShopsMap.get(uniqueKey);
            // Keep the one with higher visitorCount (more popular)
            if ((shop.visitorCount || 0) > (existingShop?.visitorCount || 0)) {
              uniqueShopsMap.set(uniqueKey, shop);
            }
          }
        });
        
        // Convert map back to array
        shops = Array.from(uniqueShopsMap.values());
        
        console.log(`✅ After removing duplicates: ${shops.length} unique shops from AgentShop (removed ${transformedAgentShops.length - shops.length} duplicates)`);
      } catch (dbError) {
        console.error('MongoDB error:', dbError);
        // Return empty array if MongoDB fails
        shops = [];
      }
    } else {
      // Return empty array if MongoDB is not used
      shops = [];
    }

    // Fetch SEO rankings for shops
    const shopIds = shops.map((s: any) => s.id);
    const shopNames = shops.map((s: any) => (s.name || '').trim()).filter(Boolean);
    
    const seoEntries = await SEO.find({
      $or: [
        { shopId: { $in: shopIds.map((id: string) => id as any) } },
        { shopName: { $in: shopNames } },
      ]
    }).lean().catch(() => []);

    // Create SEO ranking map
    const seoRankingMap = new Map<string, number>();
    seoEntries.forEach((seo: any) => {
      const shopId = seo.shopId?.toString();
      const shopName = (seo.shopName || '').trim().toLowerCase();
      if (shopId) seoRankingMap.set(shopId, seo.ranking);
      if (shopName) seoRankingMap.set(shopName, seo.ranking);
    });

    // Calculate distance for each shop and filter by radius
    const shopsWithDistance: ShopWithDistance[] = shops
      .map((shop: any) => {
        // Calculate distance if coordinates are available
        let distance = 0;
        if (hasCoordinates && userLatNum !== null && userLngNum !== null && shop.latitude && shop.longitude) {
          distance = calculateDistance(
            userLatNum,
            userLngNum,
            shop.latitude,
            shop.longitude
          );
        } else if (hasLocationFilters) {
          // If searching by city/area/pincode without coordinates, set distance to 0
          // Shops will be sorted by priority rank instead
          distance = 0;
        }

        // Get plan type and priority rank
        const planType = (shop.planType || 'BASIC') as keyof typeof PRICING_PLANS;
        // Calculate priority rank from plan type if not set
        const planDetails = PRICING_PLANS[planType] || PRICING_PLANS.BASIC;
        const priorityRank = shop.priorityRank !== undefined && shop.priorityRank !== null 
          ? shop.priorityRank 
          : planDetails.priorityRank;

        // Get SEO ranking
        const shopId = shop.id;
        const shopName = (shop.name || '').trim().toLowerCase();
        const seoRanking = seoRankingMap.get(shopId) || seoRankingMap.get(shopName) || null;

        return {
          id: shop.id,
          name: shop.name,
          category: shop.category,
          imageUrl: shop.imageUrl,
          rating: shop.rating,
          reviews: shop.reviews,
          city: shop.city,
          state: shop.state,
          address: shop.address,
          area: shop.area || '',
          pincode: shop.pincode || '', // Include pincode from database
          phone: shop.phone,
          email: shop.email,
          website: shop.website,
          latitude: shop.latitude,
          longitude: shop.longitude,
          description: shop.description,
          offerPercent: shop.offerPercent,
          priceLevel: shop.priceLevel,
          tags: shop.tags,
          featured: shop.featured || planType === 'FEATURED',
          sponsored: shop.sponsored || planType === 'PREMIUM' || planType === 'FEATURED',
          distance,
          visitorCount: shop.visitorCount || 0,
          planType: planType, // Add plan type
          priorityRank: priorityRank, // Add priority rank
          isLeftBar: shop.isLeftBar || planType === 'LEFT_BAR' || false,
          isRightBar: shop.isRightBar || planType === 'RIGHT_SIDE' || false,
          seoRanking: seoRanking, // Add SEO ranking
        };
      })
      .filter((shop) => {
        // Filter by radius if coordinates are provided and radius is set
        // If radius is 1000 km, show shops from 0-1000 km range
        if (hasCoordinates && radiusKmNum > 0) {
          return shop.distance <= radiusKmNum;
        }
        // If no coordinates or radius is 0, show all shops (filtered by city/area/pincode if provided)
        return true;
      })
      .sort((a, b) => {
        // Sort by SEO ranking first (lower = better), then priority rank, then distance
        const aRanking = a.seoRanking || 999;
        const bRanking = b.seoRanking || 999;
        
        // First sort by SEO ranking (lower number = higher priority)
        if (aRanking !== bRanking) {
          return aRanking - bRanking;
        }
        
        // Then by priority rank (higher = first)
        if (b.priorityRank !== a.priorityRank) {
          return b.priorityRank - a.priorityRank;
        }
        // If coordinates available, sort by distance; otherwise keep original order
        if (hasCoordinates) {
          return a.distance - b.distance;
        }
        return 0; // Keep original order if no coordinates
      });

    return NextResponse.json(
      {
        success: true,
        shops: shopsWithDistance,
        count: shopsWithDistance.length,
        radiusKm: radiusKmNum,
        userLocation: hasCoordinates ? {
          latitude: userLatNum,
          longitude: userLngNum,
        } : null,
        filters: hasLocationFilters ? {
          city: city || null,
          area: area || null,
          pincode: pincode || null,
        } : null,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // Cache for 5min, stale for 10min
        },
      }
    );
  } catch (error: any) {
    console.error('Error in /api/shops/nearby:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

