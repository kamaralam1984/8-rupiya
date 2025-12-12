import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminShop from '@/lib/models/Shop';
import AgentShop from '@/lib/models/AgentShop';
import OldShop from '@/models/Shop';

// Cache-Control headers - cache for 1 minute (search results change frequently)
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
};

interface Shop {
  id: string;
  name: string;
  shopName?: string;
  category: string;
  area?: string;
  city?: string;
  pincode?: string;
  imageUrl?: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
  shopUrl?: string;
  website?: string;
  mobile?: string;
  visitorCount?: number;
  priorityRank?: number;
  planType?: string;
  offers?: Array<{ title: string; description: string; validTill: Date }>;
  distance?: number;
  score?: number;
}

interface SearchParams {
  pincode?: string;
  area?: string;
  category?: string;
  shopName?: string;
  userLat?: number;
  userLng?: number;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate shop score based on search criteria
 */
function calculateShopScore(
  shop: Shop,
  params: SearchParams,
  userLat?: number,
  userLng?: number
): number {
  let score = 0;

  // Exact match (60 points)
  if (params.shopName) {
    const shopNameLower = (shop.name || shop.shopName || '').toLowerCase();
    const searchNameLower = params.shopName.toLowerCase();
    if (shopNameLower === searchNameLower) {
      score += 60; // Exact match
    } else if (shopNameLower.includes(searchNameLower)) {
      score += 40; // Partial match
    }
  }

  // Category match (20 points)
  if (params.category) {
    const shopCategoryLower = (shop.category || '').toLowerCase();
    const searchCategoryLower = params.category.toLowerCase();
    if (shopCategoryLower === searchCategoryLower) {
      score += 20;
    } else if (shopCategoryLower.includes(searchCategoryLower)) {
      score += 10;
    }
  }

  // Pincode match (15 points)
  if (params.pincode && shop.pincode === params.pincode) {
    score += 15;
  }

  // Offer score (10 points)
  if (shop.offers && shop.offers.length > 0) {
    const validOffers = shop.offers.filter(
      (offer) => new Date(offer.validTill) > new Date()
    );
    score += Math.min(validOffers.length * 2, 10);
  }

  // Popularity score (15 points)
  const visitorCount = shop.visitorCount || 0;
  const popularityScore = Math.min(Math.floor(visitorCount / 100), 15);
  score += popularityScore;

  // Priority rank boost
  if (shop.priorityRank) {
    score += Math.min(shop.priorityRank / 10, 10);
  }

  // Nearby score (10 points)
  if (userLat && userLng && shop.latitude && shop.longitude) {
    const distance = calculateDistance(userLat, userLng, shop.latitude, shop.longitude);
    shop.distance = distance;
    if (distance <= 2) {
      score += 10;
    } else if (distance <= 5) {
      score += 5;
    } else if (distance <= 10) {
      score += 2;
    }
  }

  // Area match bonus
  if (params.area && shop.area) {
    const shopAreaLower = shop.area.toLowerCase();
    const searchAreaLower = params.area.toLowerCase();
    if (shopAreaLower === searchAreaLower) {
      score += 5; // Exact area match
    } else if (shopAreaLower.includes(searchAreaLower)) {
      score += 2; // Partial area match
    }
  }

  return score;
}

/**
 * GET /api/search
 * Search shops with smart recommendation system
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get('pincode') || undefined;
    const area = searchParams.get('area') || undefined;
    const category = searchParams.get('category') || undefined;
    const shopName = searchParams.get('shopName') || undefined;
    const userLat = searchParams.get('userLat') ? parseFloat(searchParams.get('userLat')!) : undefined;
    const userLng = searchParams.get('userLng') ? parseFloat(searchParams.get('userLng')!) : undefined;

    const searchParamsObj: SearchParams = {
      pincode,
      area,
      category,
      shopName,
      userLat,
      userLng,
    };

    // Build MongoDB query
    // If no search params, show all shops (empty query)
    const query: any = {};

    if (pincode) {
      query.pincode = pincode;
    }

    if (area) {
      query.$or = [
        { area: new RegExp(area, 'i') },
        { address: new RegExp(area, 'i') },
        { fullAddress: new RegExp(area, 'i') },
        { city: new RegExp(area, 'i') },
      ];
    }

    if (category) {
      if (query.$or) {
        query.$or.push({ category: new RegExp(category, 'i') });
      } else {
        query.category = new RegExp(category, 'i');
      }
    }

    if (shopName) {
      const nameQuery = { $or: [
        { shopName: new RegExp(shopName, 'i') },
        { name: new RegExp(shopName, 'i') },
      ]};
      if (query.$or) {
        query.$and = [query.$or ? { $or: query.$or } : {}, nameQuery];
        delete query.$or;
      } else {
        Object.assign(query, nameQuery);
      }
    }

    // Payment status filter: Show PAID shops, or shops without paymentStatus field
    // For AgentShop: Also include PENDING shops (they're waiting for admin approval but should be searchable)
    // For AdminShop and OldShop: Only PAID or no paymentStatus
    const agentPaymentFilter = {
      $or: [
        { paymentStatus: 'PAID' },
        { paymentStatus: 'PENDING' }, // Include pending agent shops
        { paymentStatus: { $exists: false } },
      ],
    };
    
    const adminPaymentFilter = {
      $or: [
        { paymentStatus: 'PAID' },
        { paymentStatus: { $exists: false } },
      ],
    };

    // Build separate queries for agent shops and admin/old shops
    // Agent shops: Include PENDING status (waiting for admin approval but searchable)
    // Admin/Old shops: Only PAID or no paymentStatus
    
    let agentQuery: any = {};
    let adminQuery: any = {};

    if (Object.keys(query).length === 0) {
      // No search filters - only apply payment filters
      agentQuery = agentPaymentFilter;
      adminQuery = adminPaymentFilter;
    } else {
      // Combine search filters with payment filters using $and
      // Simple approach: wrap everything in $and
      agentQuery = {
        $and: [
          query,
          agentPaymentFilter,
        ],
      };
      
      adminQuery = {
        $and: [
          query,
          adminPaymentFilter,
        ],
      };
    }

    // Log queries for debugging
    console.log('🔍 Search query for pincode:', pincode);
    console.log('🔍 Agent query:', JSON.stringify(agentQuery, null, 2));
    console.log('🔍 Admin query:', JSON.stringify(adminQuery, null, 2));

    // Get pagination params
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const skip = (page - 1) * limit;

    // Fetch shops from all sources - PRIORITIZE AgentShops
    // Use field selection to reduce payload size
    const agentFields = 'shopName category area city pincode photoUrl latitude longitude shopUrl mobile visitorCount priorityRank planType offers';
    const adminFields = 'shopName name category area city pincode photoUrl iconUrl imageUrl latitude longitude shopUrl fullAddress address mobile visitorCount priorityRank planType offers';
    const oldFields = 'name category area city pincode imageUrl iconUrl latitude longitude address phone email website rating reviews';
    
    const [agentShops, adminShops, oldShops] = await Promise.all([
      AgentShop.find(agentQuery).select(agentFields).limit(limit * 2).lean().catch((err) => {
        console.error('❌ Error fetching agent shops:', err);
        return [];
      }),
      AdminShop.find(adminQuery).select(adminFields).limit(limit * 2).lean().catch((err) => {
        console.error('❌ Error fetching admin shops:', err);
        return [];
      }),
      OldShop ? OldShop.find(adminQuery).select(oldFields).limit(limit * 2).lean().catch((err) => {
        console.error('❌ Error fetching old shops:', err);
        return [];
      }) : Promise.resolve([]),
    ]);

    console.log(`📊 Found ${agentShops.length} agent shops, ${adminShops.length} admin shops, ${oldShops.length} old shops`);
    if (pincode && agentShops.length > 0) {
      console.log(`✅ Agent shops with pincode ${pincode}:`, agentShops.map((s: any) => ({ 
        name: s.shopName, 
        pincode: s.pincode, 
        area: s.area,
        paymentStatus: s.paymentStatus 
      })));
    }

    // Removed verbose debug logs - only log errors

    // Transform shops - AgentShops FIRST (priority)
    const allShops: Shop[] = [
      // AgentShops - HIGHEST PRIORITY
      ...agentShops.map((shop: any) => ({
        id: shop._id.toString(),
        name: shop.shopName || shop.name,
        shopName: shop.shopName || shop.name,
        category: shop.category,
        area: shop.area,
        city: shop.city,
        pincode: shop.pincode,
        imageUrl: shop.photoUrl || shop.imageUrl,
        photoUrl: shop.photoUrl,
        latitude: shop.latitude,
        longitude: shop.longitude,
        shopUrl: shop.shopUrl,
        website: shop.website,
        mobile: shop.mobile,
        visitorCount: shop.visitorCount || 0,
        priorityRank: shop.priorityRank || 0,
        planType: shop.planType,
        offers: shop.offers || [],
        source: 'agent', // Mark as agent shop for priority
      })),
      // AdminShops - SECOND PRIORITY
      ...adminShops.map((shop: any) => ({
        id: shop._id.toString(),
        name: shop.shopName || shop.name,
        shopName: shop.shopName || shop.name,
        category: shop.category,
        area: shop.area,
        city: shop.city,
        pincode: shop.pincode,
        imageUrl: shop.photoUrl || shop.iconUrl || shop.imageUrl,
        photoUrl: shop.photoUrl,
        latitude: shop.latitude,
        longitude: shop.longitude,
        shopUrl: shop.shopUrl,
        website: shop.website,
        mobile: shop.mobile,
        visitorCount: shop.visitorCount || 0,
        priorityRank: shop.priorityRank || 0,
        planType: shop.planType,
        offers: shop.offers || [],
        source: 'admin',
      })),
      // OldShops - LOWEST PRIORITY
      ...oldShops.map((shop: any) => ({
        id: shop._id.toString(),
        name: shop.name || shop.shopName,
        shopName: shop.name || shop.shopName,
        category: shop.category,
        area: shop.area,
        city: shop.city,
        pincode: shop.pincode,
        imageUrl: shop.imageUrl || shop.photoUrl,
        photoUrl: shop.photoUrl,
        latitude: shop.latitude,
        longitude: shop.longitude,
        shopUrl: shop.shopUrl,
        website: shop.website,
        mobile: shop.mobile,
        visitorCount: shop.visitorCount || 0,
        priorityRank: shop.priorityRank || 0,
        planType: shop.planType,
        offers: shop.offers || [],
        source: 'old',
      })),
    ];

    // Remove duplicates
    const uniqueShops = Array.from(
      new Map(allShops.map((shop) => [`${shop.name}-${shop.area}-${shop.pincode}`, shop])).values()
    );

    // Calculate scores for all shops
    const scoredShops = uniqueShops.map((shop) => {
      let baseScore = calculateShopScore(shop, searchParamsObj, userLat, userLng);
      
      // Boost score for agent shops (priority)
      if ((shop as any).source === 'agent') {
        baseScore += 20; // Add 20 points boost for agent shops
      }
      
      return {
        ...shop,
        score: baseScore,
      };
    });

    // Sort by score (descending) - agent shops will rank higher
    scoredShops.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Deduplication Set
    const displayedShopIds = new Set<string>();

    // Main Results (best matched shops)
    const mainResults: Shop[] = [];
    for (const shop of scoredShops) {
      if (displayedShopIds.has(shop.id)) continue;
      mainResults.push(shop);
      displayedShopIds.add(shop.id);
      if (mainResults.length >= 20) break; // Limit main results
    }

    // Left Rail (Top recommended shops - high score + popularity)
    const leftRail: Shop[] = [];
    const leftRailCandidates = scoredShops
      .filter((s) => !displayedShopIds.has(s.id))
      .sort((a, b) => {
        // Prioritize high score + popularity
        const scoreA = (a.score || 0) + (a.visitorCount || 0) / 100;
        const scoreB = (b.score || 0) + (b.visitorCount || 0) / 100;
        return scoreB - scoreA;
      });

    for (const shop of leftRailCandidates) {
      if (displayedShopIds.has(shop.id)) continue;
      leftRail.push(shop);
      displayedShopIds.add(shop.id);
      if (leftRail.length >= 5) break;
    }

    // Right Rail (Trending + best offers)
    const rightRail: Shop[] = [];
    const rightRailCandidates = scoredShops
      .filter((s) => !displayedShopIds.has(s.id))
      .sort((a, b) => {
        // Prioritize offers + trending
        const offerScoreA = (a.offers?.length || 0) * 5 + (a.visitorCount || 0) / 50;
        const offerScoreB = (b.offers?.length || 0) * 5 + (b.visitorCount || 0) / 50;
        return offerScoreB - offerScoreA;
      });

    for (const shop of rightRailCandidates) {
      if (displayedShopIds.has(shop.id)) continue;
      rightRail.push(shop);
      displayedShopIds.add(shop.id);
      if (rightRail.length >= 5) break;
    }

    // Bottom Strip (Nearby fallback shops)
    const bottomStrip: Shop[] = [];
    const bottomStripCandidates = scoredShops
      .filter((s) => !displayedShopIds.has(s.id))
      .sort((a, b) => {
        // Prioritize nearby shops
        const distanceA = a.distance || 999999;
        const distanceB = b.distance || 999999;
        if (distanceA !== distanceB) {
          return distanceA - distanceB;
        }
        return (b.score || 0) - (a.score || 0);
      });

    for (const shop of bottomStripCandidates) {
      if (displayedShopIds.has(shop.id)) continue;
      bottomStrip.push(shop);
      displayedShopIds.add(shop.id);
      if (bottomStrip.length >= 10) break;
    }

    return NextResponse.json({
      success: true,
      mainResults,
      leftRail,
      rightRail,
      bottomStrip,
      totalFound: uniqueShops.length,
      page,
      limit,
      hasMore: uniqueShops.length > (skip + limit),
    }, {
      headers: CACHE_HEADERS,
    });
  } catch (error: any) {
    console.error('Error in /api/search:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
        mainResults: [],
        leftRail: [],
        rightRail: [],
        bottomStrip: [],
      },
      { status: 500 }
    );
  }
}

