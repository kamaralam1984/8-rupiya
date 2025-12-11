import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminShop from '@/lib/models/Shop';
import AgentShop from '@/lib/models/AgentShop';
import OldShop from '@/models/Shop';

/**
 * GET /api/shops/search-options
 * Get unique pincodes, areas, and categories from all shops
 * This connects homepage search to admin panel shops data
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Fetch all shops from all collections - PRIORITIZE AgentShops
    const [agentShops, adminShops, oldShops] = await Promise.all([
      AgentShop.find({}).select('pincode area category city').lean().catch(() => []),
      AdminShop.find({}).select('pincode area category city').lean().catch(() => []),
      OldShop ? OldShop.find({}).select('pincode area category address').lean().catch(() => []) : Promise.resolve([]),
    ]);

    // Combine all shops - AgentShops FIRST (priority)
    const allShops = [
      ...agentShops.map((shop: any) => ({
        pincode: shop.pincode,
        area: shop.area,
        category: shop.category,
        city: shop.city,
        source: 'agent', // Mark as agent shop
      })),
      ...adminShops.map((shop: any) => ({
        pincode: shop.pincode,
        area: shop.area,
        category: shop.category,
        city: shop.city,
        source: 'admin',
      })),
      ...oldShops.map((shop: any) => ({
        pincode: shop.pincode,
        area: shop.area,
        category: shop.category,
        city: shop.city || (shop.address ? shop.address.split(',')[0] : undefined),
        source: 'old',
      })),
    ];

    // Extract unique values
    const pincodes = new Set<string>();
    const areas = new Set<string>();
    const categories = new Set<string>();

    allShops.forEach((shop: any) => {
      // Pincodes
      if (shop.pincode && typeof shop.pincode === 'string' && shop.pincode.trim()) {
        pincodes.add(shop.pincode.trim());
      }

      // Areas
      if (shop.area && typeof shop.area === 'string' && shop.area.trim()) {
        areas.add(shop.area.trim());
      }
      // Also extract area from city if available
      if (shop.city && typeof shop.city === 'string' && shop.city.trim()) {
        areas.add(shop.city.trim());
      }

      // Categories
      if (shop.category && typeof shop.category === 'string' && shop.category.trim()) {
        categories.add(shop.category.trim());
      }
    });

    // Convert to sorted arrays
    const sortedPincodes = Array.from(pincodes).sort();
    const sortedAreas = Array.from(areas).sort();
    const sortedCategories = Array.from(categories).sort();

    return NextResponse.json({
      success: true,
      pincodes: sortedPincodes,
      areas: sortedAreas,
      categories: sortedCategories,
      totalShops: allShops.length,
    });
  } catch (error: any) {
    console.error('Error fetching search options:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch search options',
        details: error.message,
        pincodes: [],
        areas: [],
        categories: [],
      },
      { status: 500 }
    );
  }
}

