import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminShop from '@/lib/models/Shop';
import AgentShop from '@/lib/models/AgentShop';
import OldShop from '@/models/Shop';
import Pincode from '@/lib/models/Pincode'; // Pincode model - only source for pincodes now

// Cache-Control headers - cache for 5 minutes
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
};

/**
 * GET /api/shops/search-options
 * Get unique pincodes, areas, and categories
 * Pincodes and areas are now ONLY from agent-entered data (Pincode model)
 * Categories are still from shops
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Fetch only PAID shops for categories
    const paymentFilter = {
      $or: [
        { paymentStatus: 'PAID' },
        { paymentStatus: { $exists: false } },
      ],
    };

    // Get pincodes and areas ONLY from Pincode model (agent-entered data)
    const [pincodeData, pincodeCount, agentCategories, agentCities,
           adminCategories, adminCities,
           oldCategories] = await Promise.all([
      // Get all pincode+area combinations from Pincode model
      Pincode.find({}).select('pincode area').lean().catch(() => []),
      // Count to check if Pincode collection is empty
      Pincode.countDocuments().catch(() => 0),
      // Categories still come from shops
      AgentShop.distinct('category', paymentFilter).catch(() => []),
      AgentShop.distinct('city', paymentFilter).catch(() => []),
      AdminShop.distinct('category', paymentFilter).catch(() => []),
      AdminShop.distinct('city', paymentFilter).catch(() => []),
      OldShop ? OldShop.distinct('category', paymentFilter).catch(() => []) : Promise.resolve([]),
    ]);

    // Extract unique pincodes and areas from Pincode model
    let allPincodes = [...new Set(pincodeData.map((p: any) => p.pincode).filter(Boolean))].sort();
    let allAreas = [...new Set(pincodeData.map((p: any) => p.area).filter(Boolean))].sort();

    // TEMPORARY FALLBACK: If Pincode collection is empty, fallback to shops
    // This helps during migration period. Remove this after migration is complete.
    if (pincodeCount === 0) {
      console.log('⚠️ Pincode collection is empty, falling back to shops for pincodes');
      const [fallbackAgentPincodes, fallbackAdminPincodes, fallbackOldPincodes] = await Promise.all([
        AgentShop.distinct('pincode', { ...paymentFilter, pincode: { $exists: true, $ne: '' } }).catch(() => []),
        AdminShop.distinct('pincode', { ...paymentFilter, pincode: { $exists: true, $ne: '' } }).catch(() => []),
        OldShop ? OldShop.distinct('pincode', { ...paymentFilter, pincode: { $exists: true, $ne: '' } }).catch(() => []) : Promise.resolve([]),
      ]);
      
      allPincodes = [...new Set([...fallbackAgentPincodes, ...fallbackAdminPincodes, ...fallbackOldPincodes].filter(Boolean))].sort();
      
      // For areas, use distinct from shops
      const [fallbackAgentAreas, fallbackAdminAreas] = await Promise.all([
        AgentShop.distinct('area', { ...paymentFilter, area: { $exists: true, $ne: '' } }).catch(() => []),
        AdminShop.distinct('area', { ...paymentFilter, area: { $exists: true, $ne: '' } }).catch(() => []),
      ]);
      
      const fallbackAreas = [...new Set([...fallbackAgentAreas, ...fallbackAdminAreas].filter(Boolean))];
      allAreas = [...new Set([...allAreas, ...fallbackAreas])].sort();
    }
    
    // Combine categories from all shop sources
    const allCategories = [...new Set([...agentCategories, ...adminCategories, ...oldCategories].filter(Boolean))];
    const allCities = [...new Set([...agentCities, ...adminCities].filter(Boolean))];

    // Get counts for total shops
    const [agentCount, adminCount, oldCount] = await Promise.all([
      AgentShop.countDocuments(paymentFilter).catch(() => 0),
      AdminShop.countDocuments(paymentFilter).catch(() => 0),
      OldShop ? OldShop.countDocuments(paymentFilter).catch(() => 0) : Promise.resolve(0),
    ]);

    const totalShops = agentCount + adminCount + oldCount;

    // Combine areas with cities (areas from Pincode model, cities from shops)
    const combinedAreas = [...new Set([...allAreas, ...allCities].filter(Boolean))];

    return NextResponse.json({
      success: true,
      pincodes: allPincodes, // Already sorted
      areas: combinedAreas.sort(),
      categories: allCategories.sort(),
      totalShops,
    }, {
      headers: CACHE_HEADERS,
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

