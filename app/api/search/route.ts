import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop';
// Note: Only AgentShop is used for homepage to avoid duplicates
// AdminShop and OldShop imports removed as they're no longer needed

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
    // Connect to MongoDB database
    await connectDB();
    console.log('✅ Database connected successfully');

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

    // Area filter (flexible matching) - matches area, address, or city
    if (area) {
      const areaRegex = new RegExp(area.trim(), 'i');
      query.$or = [
        { area: areaRegex },
        { address: areaRegex },
        { fullAddress: areaRegex },
        { city: areaRegex },
      ];
      console.log(`📍 Filtering by area/city: "${area.trim()}"`);
    }

    // Category filter (case-insensitive flexible matching)
    // This ensures shops from selected category are shown
    if (category) {
      // Use case-insensitive regex for flexible matching
      query.category = new RegExp(category.trim(), 'i');
      console.log(`📍 Filtering by category: "${category.trim()}"`);
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
        // Pincode is stored as String in AgentShop schema, so match as string
        conditions.push({ pincode: normalizedPincode });
      }
    }
    
    if (category) {
      // Use case-insensitive regex for flexible category matching
      conditions.push({ category: new RegExp(category.trim(), 'i') });
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

    // ONLY fetch from AgentShop to avoid duplicates on homepage
    // This is the MAIN database connection point for Search Shops
    console.log('🔗 Fetching shops from AgentShop database...');
    let agentShops = await AgentShop.find(finalQuery)
      .select(projection)
      .limit(200)
      .lean()
      .hint({ planType: 1, pincode: 1 }) // Use index for better performance
      .catch((err) => {
        console.error('❌ Error fetching AgentShops from database:', err);
        return [];
      });
    
    console.log(`✅ Successfully fetched ${agentShops.length} shops from AgentShop database`);

    // Log counts for debugging
    console.log(`\n🔍 Search Parameters:`, { shopName, category, pincode, planType, area, userLat, userLng });
    console.log(`📋 MongoDB Query:`, JSON.stringify(finalQuery, null, 2));
    console.log(`📊 Database Results (Exact Match): Agent=${agentShops.length} (ONLY AgentShop used for homepage)`);
    
    // FALLBACK: If no shops found with exact filters, try with less strict filters
    // This ensures shops are always shown when user searches
    if (agentShops.length === 0 && (pincode || category || area || shopName)) {
      console.log(`⚠️ No exact matches found. Trying fallback query with flexible filters...`);
      
      // Build fallback query - keep flexible filters (shopName, area) but remove strict ones (pincode, category)
      const fallbackConditions: any[] = [paymentFilter];
      
      // Keep shopName filter (flexible regex matching)
      if (shopName) {
        fallbackConditions.push({
          $or: [
            { shopName: new RegExp(shopName, 'i') },
            { name: new RegExp(shopName, 'i') }
          ]
        });
      }
      
      // Keep category filter (flexible regex matching)
      if (category) {
        fallbackConditions.push({ category: new RegExp(category.trim(), 'i') });
      }
      
      // Keep area filter (flexible regex matching)
      if (area) {
        const areaRegex = new RegExp(area.trim(), 'i');
        fallbackConditions.push({
          $or: [
            { area: areaRegex },
            { address: areaRegex },
            { fullAddress: areaRegex },
            { city: areaRegex }
          ]
        });
      }
      
      // Build fallback query
      const fallbackQuery: any = fallbackConditions.length > 1 
        ? { $and: fallbackConditions }
        : fallbackConditions[0];
      
      // If no flexible filters, just show all paid shops
      const finalFallbackQuery = (shopName || category || area) ? fallbackQuery : paymentFilter;
      
      agentShops = await AgentShop.find(finalFallbackQuery)
        .select(projection)
        .limit(200)
        .lean()
        .hint({ planType: 1, pincode: 1 })
        .catch((err) => {
          console.error('Error fetching AgentShops (fallback):', err);
          return [];
        });
      
      console.log(`📊 Database Results (Fallback): Agent=${agentShops.length}`);
      
      // If still no results, show all paid shops (final fallback)
      if (agentShops.length === 0) {
        console.log(`⚠️ No shops found with filters. Showing all paid shops...`);
        agentShops = await AgentShop.find(paymentFilter)
          .select(projection)
          .limit(200)
          .lean()
          .hint({ planType: 1, pincode: 1 })
          .catch((err) => {
            console.error('Error fetching AgentShops (final fallback):', err);
            return [];
          });
        console.log(`📊 Database Results (Final Fallback - All Paid Shops): Agent=${agentShops.length}`);
      }
    }
    
    // Log plan type distribution
    const planTypeCounts: Record<string, number> = {};
    agentShops.forEach((shop: any) => {
      const plan = shop.planType || 'BASIC';
      planTypeCounts[plan] = (planTypeCounts[plan] || 0) + 1;
    });
    console.log(`📊 Plan Type Distribution:`, planTypeCounts);

    // Transform shops - ONLY AgentShops
    const allShops: Shop[] = agentShops.map((shop: any) => ({
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
      planType: shop.planType || 'BASIC', // Ensure planType is always set
      offers: shop.offers || [],
      source: 'agent', // Mark as agent shop
    }));

    // No need to remove duplicates since we're only using AgentShop
    const uniqueShops = allShops;
    
    // Debug: Log transformed shops
    console.log(`🔄 Transformed shops: ${uniqueShops.length}`);
    if (uniqueShops.length > 0) {
      console.log(`📋 Sample shop plans:`, uniqueShops.slice(0, 5).map(s => ({ id: s.id, name: s.name, planType: s.planType })));
    }

      // Calculate scores for all shops (all are agent shops now)
      const scoredShops = uniqueShops.map((shop) => {
        const baseScore = calculateShopScore(shop, searchParamsObj, userLat, userLng);
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
    
    // Debug: Log all plan types before filtering
    const allPlanTypes = scoredShops.map(s => s.planType || 'BASIC');
    console.log(`📊 All plan types in scored shops:`, [...new Set(allPlanTypes)]);
    console.log(`📊 Total scored shops: ${scoredShops.length}`);
    
    // HERO Plan Shops - for hero banner section
    const heroShops = scoredShops.filter((s) => s.planType === 'HERO');
    
    // LEFT_BAR Plan Shops - for left rail section
    const leftBarShops = scoredShops.filter((s) => s.planType === 'LEFT_BAR');
    
    // RIGHT_SIDE Plan Shops - for right rail section  
    const rightSideShops = scoredShops.filter((s) => s.planType === 'RIGHT_SIDE');
    
    // BOTTOM_RAIL Plan Shops - for bottom rail section
    const bottomRailShops = scoredShops.filter((s) => s.planType === 'BOTTOM_RAIL');
    
    // All other shops (PREMIUM, FEATURED, BASIC, BANNER, or no planType) - for bottom strip
    // Include ALL shops that are not HERO, LEFT_BAR, RIGHT_SIDE, or BOTTOM_RAIL
    const bottomStripShops = scoredShops.filter((s) => {
      const plan = s.planType || 'BASIC'; // Default to BASIC if no planType
      return !['HERO', 'LEFT_BAR', 'RIGHT_SIDE', 'BOTTOM_RAIL'].includes(plan);
    });

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
    // IMPORTANT: Bottom strip should show ALL remaining shops that weren't placed in other sections
    // This ensures all shops are displayed somewhere
    const bottomStrip: Shop[] = [];
    
    // Get all shops that haven't been displayed yet
    const remainingShops = scoredShops.filter((s) => !displayedShopIds.has(s.id));
    
    // Combine ALL remaining shops for bottom strip (not just specific plan types)
    // This ensures no shop is left out
    const allBottomStripCandidates = [
      ...bottomRailShops.filter((s) => !displayedShopIds.has(s.id)),
      ...bottomStripShops.filter((s) => !displayedShopIds.has(s.id)),
      ...remainingShops, // Include ALL remaining shops
    ]
      .filter((s, index, self) => {
        // Remove duplicates
        return index === self.findIndex((shop) => shop.id === s.id);
      })
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

    // Add ALL remaining shops to bottom strip (up to limit)
    for (const shop of allBottomStripCandidates) {
      if (displayedShopIds.has(shop.id)) continue;
      bottomStrip.push(shop);
      // Don't mark HERO shops as displayed (they're already in hero section)
      if (shop.planType !== 'HERO') {
        displayedShopIds.add(shop.id);
      }
      if (bottomStrip.length >= 30) break; // Limit for performance
    }
    
    // CRITICAL: If there are still shops not displayed, add them to bottom strip
    // This ensures ALL shops are shown
    const stillRemaining = scoredShops.filter((s) => !displayedShopIds.has(s.id));
    if (stillRemaining.length > 0 && bottomStrip.length < 30) {
      console.log(`⚠️ Adding ${stillRemaining.length} remaining shops to bottom strip`);
      for (const shop of stillRemaining) {
        if (bottomStrip.length >= 30) break;
        bottomStrip.push(shop);
        if (shop.planType !== 'HERO') {
          displayedShopIds.add(shop.id);
        }
      }
    }

    // Log final results
    console.log(`✅ Search Results Ready: Hero=${mainResults.length}, Left=${leftRail.length}, Right=${rightRail.length}, Bottom=${bottomStrip.length}, Total=${uniqueShops.length}`);
    console.log(`📌 Pincode Filter: ${pincode || 'None'}, Found Shops: ${uniqueShops.length}`);

    // If filters are active but no shops found, log warning
    if ((pincode || category || area || shopName) && uniqueShops.length === 0) {
      console.warn(`⚠️ No shops found for search:`, { pincode, category, area, shopName });
    }
    
    // If shops found but not distributed to any section, log warning and force add to bottom strip
    if (uniqueShops.length > 0 && mainResults.length === 0 && leftRail.length === 0 && rightRail.length === 0 && bottomStrip.length === 0) {
      console.warn(`⚠️ Shops found (${uniqueShops.length}) but not distributed to any section!`);
      console.warn(`   Plan types:`, uniqueShops.map(s => s.planType || 'BASIC'));
      console.warn(`   🔧 FIXING: Adding all shops to bottom strip...`);
      
      // Force add all shops to bottom strip if nothing was distributed
      const allShopsForBottom = scoredShops
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 30);
      
      bottomStrip.push(...allShopsForBottom);
      console.log(`   ✅ Added ${allShopsForBottom.length} shops to bottom strip`);
    }

    const response = NextResponse.json({
      success: true,
      mainResults,
      leftRail,
      rightRail,
      bottomStrip,
      totalFound: uniqueShops.length,
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

    // Add caching headers for better performance (60s cache, 2min stale-while-revalidate)
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    
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

