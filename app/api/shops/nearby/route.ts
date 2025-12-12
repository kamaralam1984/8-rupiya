import { NextRequest, NextResponse } from 'next/server';
import { calculateDistance } from '@/app/utils/distance';
import connectDB from '@/lib/mongodb';
import Shop from '@/models/Shop'; // Old shop model
import AdminShop from '@/lib/models/Shop'; // New admin shop model (shopsfromimage collection)
import AgentShop from '@/lib/models/AgentShop'; // Agent shops
import { PRICING_PLANS } from '@/app/utils/pricing';

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
export const dynamic = 'force-dynamic';

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
        
        // Fetch from all shop sources: old Shop model, new AdminShop model, and AgentShop model
        // Apply filters to all queries - show all plan types
        // On page load (no filters), fetch ALL shops from Shop.ts (AdminShop model)
        // Check if limit parameter is provided in URL
        const limitParam = searchParams.get('limit');
        const limitCount = limitParam ? parseInt(limitParam) : (Object.keys(finalQuery).length > 0 ? undefined : undefined); // No limit if no filters (fetch all shops)
        
        // Base filter for shops without query filters (payment + visibility)
        const baseFilter = {
          $and: [paymentFilter, visibilityFilter]
        };
        
        const [oldShops, adminShops, agentShops] = await Promise.all([
          (Object.keys(finalQuery).length > 0 
            ? Shop.find(finalQuery).lean() 
            : (limitCount ? Shop.find(baseFilter).limit(limitCount).lean() : Shop.find(baseFilter).lean())
          ).catch(() => []), // Old shop model
          (Object.keys(finalQuery).length > 0 
            ? AdminShop.find(finalQuery).lean() 
            : (limitCount ? AdminShop.find(baseFilter).limit(limitCount).lean() : AdminShop.find(baseFilter).lean())
          ).catch(() => []), // New admin shop model (shopsfromimage) - Shop.ts - Fetch ALL on page load
          (Object.keys(finalQuery).length > 0 
            ? AgentShop.find(finalQuery).lean() 
            : (limitCount ? AgentShop.find(baseFilter).limit(limitCount).lean() : AgentShop.find(baseFilter).lean())
          ).catch(() => []), // Agent shops - only PAID shops
        ]);
        
        // Transform old shops
        const transformedOldShops = oldShops.map((shop: any) => ({
          id: shop._id.toString(),
          name: shop.name,
          category: shop.category,
          imageUrl: shop.imageUrl,
          rating: shop.rating || 4.5, // Default rating if not present
          reviews: shop.reviews || 0,
          city: shop.city || '',
          state: shop.state || '',
          address: shop.address || '',
          area: shop.area || '',
          pincode: shop.pincode || '', // Include pincode from database
          phone: shop.phone || '',
          email: shop.email || '',
          website: shop.website || '',
          latitude: shop.latitude,
          longitude: shop.longitude,
          description: shop.description || '',
          offerPercent: shop.offerPercent || 0,
          priceLevel: shop.priceLevel || '',
          tags: shop.tags || [],
          featured: shop.featured || false,
          sponsored: shop.sponsored || false,
          visitorCount: shop.visitorCount || 0,
        }));
        
        // Transform admin shops (from shopsfromimage collection)
        const transformedAdminShops = adminShops.map((shop: any) => ({
          id: shop._id.toString(),
          name: shop.shopName || shop.name,
          category: shop.category,
          imageUrl: shop.photoUrl || shop.iconUrl || shop.imageUrl,
          rating: 4.5, // Default rating
          reviews: 0,
          city: shop.city || '',
          state: '',
          address: shop.fullAddress || shop.address || '',
          area: shop.area || '',
          pincode: shop.pincode || '', // Include pincode
          phone: shop.mobile || '',
          email: '',
          website: '',
          latitude: shop.latitude,
          longitude: shop.longitude,
          description: '',
          offerPercent: 0,
          priceLevel: '',
          tags: [],
          featured: shop.planType === 'FEATURED' || shop.isHomePageBanner || false,
          sponsored: shop.planType === 'PREMIUM' || shop.planType === 'FEATURED' || false,
          visitorCount: shop.visitorCount || 0,
          planType: shop.planType || 'BASIC',
          priorityRank: (() => {
            const planType = (shop.planType || 'BASIC') as keyof typeof PRICING_PLANS;
            const planDetails = PRICING_PLANS[planType] || PRICING_PLANS.BASIC;
            return shop.priorityRank !== undefined && shop.priorityRank !== null 
              ? shop.priorityRank 
              : planDetails.priorityRank;
          })(),
          isLeftBar: shop.isLeftBar || shop.planType === 'LEFT_BAR' || false,
          isRightBar: shop.isRightBar || shop.planType === 'RIGHT_BAR' || false,
        }));
        
        // Transform agent shops
        const transformedAgentShops = agentShops.map((shop: any) => ({
          id: shop._id.toString(),
          name: shop.shopName,
          category: shop.category,
          imageUrl: shop.photoUrl,
          rating: 4.5, // Default rating
          reviews: 0,
          city: shop.city || '', // Agent shops may not have city
          area: shop.area || '',
          pincode: shop.pincode || '', // Include pincode from database
          state: '',
          address: shop.address,
          phone: shop.mobile || '',
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
          isRightBar: shop.planType === 'RIGHT_BAR' || false,
        }));
        
        // Combine all shops
        shops = [...transformedOldShops, ...transformedAdminShops, ...transformedAgentShops];
        
        console.log(`Loaded ${oldShops.length} old shops, ${adminShops.length} admin shops, ${agentShops.length} agent shops`);
      } catch (dbError) {
        console.error('MongoDB error:', dbError);
        // Return empty array if MongoDB fails
        shops = [];
      }
    } else {
      // Return empty array if MongoDB is not used
      shops = [];
    }

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
        // Sort by priority rank first (higher = first), then by distance
        // Priority order: HERO (200) > FEATURED (100) > BANNER (50) > LEFT_BAR/RIGHT_BAR (30/20) > PREMIUM (10) > BASIC (0)
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
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in /api/shops/nearby:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

