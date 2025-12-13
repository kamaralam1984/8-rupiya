import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop';
// Note: Only AgentShop is used for homepage to avoid duplicates

/**
 * GET /api/shops/search-options
 * Get unique pincodes, areas, and categories from all shops
 * This connects homepage search to admin panel shops data
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB database
    await connectDB();
    console.log('✅ Database connected for search options');

    // ONLY fetch from AgentShop to match homepage search behavior
    // IMPORTANT: Only show options from PAID shops (same filter as search API)
    const paymentFilter = {
      $or: [
        { paymentStatus: 'PAID' },
        { paymentStatus: { $exists: false } }, // Include old shops without paymentStatus
      ],
    };
    
    // Fetch from AgentShop database - this connects dropdown options to database
    console.log('🔗 Fetching search options from AgentShop database...');
    const agentShops = await AgentShop.find(paymentFilter)
      .select('pincode area category city paymentStatus')
      .lean()
      .catch((err) => {
        console.error('❌ Error fetching AgentShops for search options:', err);
        return [];
      });
    
    console.log(`✅ Successfully fetched ${agentShops.length} shops for search options`);

    // Use only AgentShop data
    const allShops = agentShops.map((shop: any) => ({
      pincode: shop.pincode ? String(shop.pincode).trim() : null,
      area: shop.area ? String(shop.area).trim() : null,
      category: shop.category ? String(shop.category).trim() : null,
      city: shop.city ? String(shop.city).trim() : null,
      source: 'agent',
    }));

    // Extract unique values
    const pincodes = new Set<string>();
    const areas = new Set<string>();
    const categories = new Set<string>();

    allShops.forEach((shop: any) => {
      // Pincodes - ensure it's a valid 6-digit pincode
      if (shop.pincode && String(shop.pincode).trim().length === 6) {
        pincodes.add(String(shop.pincode).trim());
      }

      // Areas
      if (shop.area && String(shop.area).trim()) {
        areas.add(String(shop.area).trim());
      }
      // Also extract area from city if available
      if (shop.city && String(shop.city).trim()) {
        areas.add(String(shop.city).trim());
      }

      // Categories
      if (shop.category && String(shop.category).trim()) {
        categories.add(String(shop.category).trim());
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

