import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop'; // सिर्फ AgentShop - homepage के लिए

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
  planType?: string;
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
 * 
 * **NEW: Plan-Based Organization**
 * - Shops are organized by their planType field
 * - HERO → mainResults (hero banner)
 * - LEFT_BAR → leftRail (left sidebar ads)
 * - RIGHT_SIDE → rightRail (right sidebar ads)
 * - BOTTOM_RAIL → bottomStrip (priority in bottom strip)
 * - PREMIUM/FEATURED/BASIC → bottomStrip (lower priority)
 * 
 * **Performance Optimizations:**
 * - Index hints for faster queries
 * - Field projection to reduce data transfer
 * - Response caching (60s with stale-while-revalidate)
 * - Deduplication to avoid showing same shop multiple times
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get('pincode') || undefined;
    const area = searchParams.get('area') || undefined;
    const category = searchParams.get('category') || undefined;
    const shopName = searchParams.get('shopName') || undefined;
    const planType = searchParams.get('planType') || undefined;
    const userLat = searchParams.get('userLat') ? parseFloat(searchParams.get('userLat')!) : undefined;
    const userLng = searchParams.get('userLng') ? parseFloat(searchParams.get('userLng')!) : undefined;

    const searchParamsObj: SearchParams = {
      pincode,
      area,
      category,
      shopName,
      planType,
      userLat,
      userLng,
    };

    // Build MongoDB query - FIXED for exact matching
    const query: any = {};

    // EXACT Pincode match (when pincode is selected)
    // Normalize pincode: trim whitespace and ensure it's a string
    if (pincode) {
      const normalizedPincode = pincode.toString().trim();
      if (normalizedPincode) {
        query.pincode = normalizedPincode; // Exact match, not regex
        console.log(`📍 Filtering by pincode: "${normalizedPincode}"`);
      }
    }

    // Area filter (flexible matching)
    if (area) {
      query.$or = [
        { area: new RegExp(area, 'i') },
        { address: new RegExp(area, 'i') },
        { fullAddress: new RegExp(area, 'i') },
        { city: new RegExp(area, 'i') },
      ];
    }

    // EXACT Category match (when category is selected)
    // This ensures only shops from selected category are shown
    if (category) {
      query.category = category; // Exact match, not regex
    }

    // Shop Name filter (flexible matching for partial names)
    if (shopName) {
      query.$or = query.$or || [];
      query.$or.push(
        { shopName: new RegExp(shopName, 'i') },
        { name: new RegExp(shopName, 'i') }
      );
    }

    // Always filter for PAID shops only
    // Build proper $and query to combine all filters
    const finalQuery: any = {};
    
    // Payment status filter (always required)
    const paymentFilter = {
      $or: [
        { paymentStatus: 'PAID' },
        { paymentStatus: { $exists: false } },
      ],
    };

    // Combine all filters with $and
    const conditions: any[] = [paymentFilter];
    
    // Add specific filters
    if (pincode) {
      const normalizedPincode = pincode.toString().trim();
      if (normalizedPincode) {
        conditions.push({ pincode: normalizedPincode });
      }
    }
    
    if (category) {
      conditions.push({ category: category });
    }
    
    // Plan Type filter (exact match)
    if (planType) {
      conditions.push({ planType: planType.toUpperCase() });
    }
    
    if (area || shopName) {
      if (query.$or && query.$or.length > 0) {
        conditions.push({ $or: query.$or });
      }
    }
    
    // Build final query
    if (conditions.length > 1) {
      finalQuery.$and = conditions;
    } else {
      Object.assign(finalQuery, conditions[0]);
    }

    // Fetch shops from all sources - PRIORITIZE AgentShops
    // Use lean() for performance, select only needed fields, add index hints
    const projection = {
      shopName: 1,
      name: 1,
      category: 1,
      area: 1,
      city: 1,
      pincode: 1,
      photoUrl: 1,
      imageUrl: 1,
      latitude: 1,
      longitude: 1,
      shopUrl: 1,
      website: 1,
      mobile: 1,
      visitorCount: 1,
      priorityRank: 1,
      planType: 1,
      offers: 1,
      paymentStatus: 1,
    };

    // IMPORTANT: Homepage पर सिर्फ AgentShop से shops fetch करें
    // Shop.ts (AdminShop) और old Shop model से नहीं
    // Limit to 150 shops max for performance
    const agentShops = await AgentShop.find(finalQuery)
      .select(projection)
      .limit(150) // Reduced from 200 for better performance
      .lean()
      .hint({ paymentStatus: 1, planType: 1, pincode: 1 }) // Use indexes for better performance
      .catch((err) => {
        console.error('Error fetching AgentShops:', err);
        return [];
      });

    // Log counts for debugging
    console.log(`\n🔍 Search Parameters:`, { shopName, category, pincode, planType, area, userLat, userLng });
    console.log(`📋 MongoDB Query:`, JSON.stringify(finalQuery, null, 2));
    console.log(`📊 Database Results: Agent=${agentShops.length} (सिर्फ AgentShop से)`);
    
    // Log plan type distribution
    const planTypeCounts: Record<string, number> = {};
    agentShops.forEach((shop: any) => {
      const plan = shop.planType || 'BASIC';
      planTypeCounts[plan] = (planTypeCounts[plan] || 0) + 1;
    });
    console.log(`📊 Plan Type Distribution:`, planTypeCounts);

    // Transform shops - सिर्फ AgentShop से
    const transformedAgentShops = agentShops.map((shop: any) => ({
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
      ownerName: shop.ownerName, // Add ownerName for duplicate detection
      visitorCount: shop.visitorCount || 0,
      priorityRank: shop.priorityRank || 0,
      planType: shop.planType,
      offers: shop.offers || [],
      source: 'agent', // Mark as agent shop
    }));

    // Remove duplicates - same shopName + ownerName + mobile combination
    const uniqueShopsMap = new Map<string, Shop>();
    transformedAgentShops.forEach((shop: any) => {
      // Skip shops without enough identifying information
      const shopName = (shop.name || shop.shopName || '').trim();
      const ownerName = (shop.ownerName || '').trim();
      const mobile = (shop.mobile || shop.phone || '').trim();
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
    const allShops: Shop[] = Array.from(uniqueShopsMap.values());
    
    console.log(`✅ After removing duplicates: ${allShops.length} unique shops from AgentShop (removed ${transformedAgentShops.length - allShops.length} duplicates)`);

    // Calculate scores for all shops
    const scoredShops = allShops.map((shop) => {
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

    // **STEP 1: Organize by Plan Type First (Priority System)**
    
    // HERO Plan Shops - for hero banner section
    const heroShops = scoredShops.filter((s) => s.planType === 'HERO');
    
    // LEFT_BAR Plan Shops - for left rail section
    const leftBarShops = scoredShops.filter((s) => s.planType === 'LEFT_BAR');
    
    // RIGHT_SIDE Plan Shops - for right rail section  
    const rightSideShops = scoredShops.filter((s) => s.planType === 'RIGHT_SIDE');
    
    // BOTTOM_RAIL Plan Shops - for bottom rail section
    const bottomRailShops = scoredShops.filter((s) => s.planType === 'BOTTOM_RAIL');
    
    // PREMIUM, FEATURED, BASIC, BANNER - for bottom strip
    const bottomStripShops = scoredShops.filter((s) => 
      s.planType === 'PREMIUM' || 
      s.planType === 'FEATURED' || 
      s.planType === 'BASIC' || 
      s.planType === 'BANNER' ||
      !s.planType // Include shops without plan type
    );

    // Log plan-based organization
    console.log(`📋 Plan Organization: HERO=${heroShops.length}, LEFT_BAR=${leftBarShops.length}, RIGHT_SIDE=${rightSideShops.length}, BOTTOM_RAIL=${bottomRailShops.length}, Other=${bottomStripShops.length}`);

    // **STEP 2: Main Results - Hero shops appear here**
    const mainResults: Shop[] = [];
    for (const shop of heroShops) {
      if (displayedShopIds.has(shop.id)) continue;
      mainResults.push(shop);
      displayedShopIds.add(shop.id);
      if (mainResults.length >= 5) break;
    }

    // **STEP 3: Left Rail - LEFT_BAR plan shops (sorted by score)**
    const leftRail: Shop[] = [];
    const leftRailCandidates = leftBarShops
      .filter((s) => !displayedShopIds.has(s.id))
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    for (const shop of leftRailCandidates) {
      if (displayedShopIds.has(shop.id)) continue;
      leftRail.push(shop);
      displayedShopIds.add(shop.id);
      if (leftRail.length >= 10) break; // Increased limit for paid ads
    }

    // **STEP 4: Right Rail - RIGHT_SIDE plan shops (sorted by score)**
    const rightRail: Shop[] = [];
    const rightRailCandidates = rightSideShops
      .filter((s) => !displayedShopIds.has(s.id))
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    for (const shop of rightRailCandidates) {
      if (displayedShopIds.has(shop.id)) continue;
      rightRail.push(shop);
      displayedShopIds.add(shop.id);
      if (rightRail.length >= 10) break; // Increased limit for paid ads
    }

    // **STEP 5: Bottom Strip - Mix of BOTTOM_RAIL, BASIC, PREMIUM, FEATURED, BANNER, and HERO**
    // HERO shops appear in both hero section AND bottom strip
    const bottomStrip: Shop[] = [];
    
    // Combine BOTTOM_RAIL and other plan shops for bottom strip
    const allBottomStripCandidates = [
      ...bottomRailShops,
      ...bottomStripShops,
      ...heroShops, // HERO shops also appear in bottom strip
    ]
      .filter((s) => !displayedShopIds.has(s.id))
      .sort((a, b) => {
        // Sort by plan priority: HERO > BOTTOM_RAIL > PREMIUM > FEATURED > BANNER > BASIC
        const planPriority: Record<string, number> = {
          'HERO': 6,
          'BOTTOM_RAIL': 5,
          'PREMIUM': 4,
          'FEATURED': 3,
          'BANNER': 2,
          'BASIC': 1,
        };
        const priorityA = (a.planType ? planPriority[a.planType] : undefined) || 0;
        const priorityB = (b.planType ? planPriority[b.planType] : undefined) || 0;
        if (priorityB !== priorityA) {
          return priorityB - priorityA;
        }
        // If same plan priority, sort by score (which includes distance, popularity, etc.)
        return (b.score || 0) - (a.score || 0);
      });

    for (const shop of allBottomStripCandidates) {
      if (displayedShopIds.has(shop.id)) continue;
      bottomStrip.push(shop);
      // Don't mark HERO shops as displayed (they're already in hero section)
      if (shop.planType !== 'HERO') {
        displayedShopIds.add(shop.id);
      }
      if (bottomStrip.length >= 30) break; // Limit for performance
    }

    // Log final results
    console.log(`✅ Search Results Ready: Hero=${mainResults.length}, Left=${leftRail.length}, Right=${rightRail.length}, Bottom=${bottomStrip.length}, Total=${allShops.length}`);
    console.log(`📌 Pincode Filter: ${pincode || 'None'}, Found Shops: ${allShops.length}`);

    // If pincode filter is active but no shops found, log warning
    if (pincode && allShops.length === 0) {
      console.warn(`⚠️ No shops found for pincode: ${pincode}`);
    }

    const response = NextResponse.json({
      success: true,
      mainResults,
      leftRail,
      rightRail,
      bottomStrip,
      totalFound: allShops.length,
      resultCounts: {
        hero: mainResults.length,
        leftBar: leftRail.length,
        rightSide: rightRail.length,
        bottomStrip: bottomStrip.length,
      },
      filters: {
        pincode: pincode || null,
        category: category || null,
      },
    });

    // Aggressive caching - cache for 2 minutes for search results
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
    
    return response;
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

