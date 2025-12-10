import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminShop from '@/lib/models/Shop';
import AgentShop from '@/lib/models/AgentShop';
import OldShop from '@/models/Shop';

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
    const query: any = {};

    if (pincode) {
      query.pincode = pincode;
    }

    if (area) {
      query.$or = [
        { area: new RegExp(area, 'i') },
        { address: new RegExp(area, 'i') },
        { fullAddress: new RegExp(area, 'i') },
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

    // Fetch shops from all sources
    const [adminShops, agentShops, oldShops] = await Promise.all([
      AdminShop.find(query).limit(200).lean().catch(() => []),
      AgentShop.find(query).limit(200).lean().catch(() => []),
      OldShop ? OldShop.find(query).limit(200).lean().catch(() => []) : Promise.resolve([]),
    ]);

    // Transform shops
    const allShops: Shop[] = [
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
      })),
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
      })),
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
      })),
    ];

    // Remove duplicates
    const uniqueShops = Array.from(
      new Map(allShops.map((shop) => [`${shop.name}-${shop.area}-${shop.pincode}`, shop])).values()
    );

    // Calculate scores for all shops
    const scoredShops = uniqueShops.map((shop) => ({
      ...shop,
      score: calculateShopScore(shop, searchParamsObj, userLat, userLng),
    }));

    // Sort by score (descending)
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

