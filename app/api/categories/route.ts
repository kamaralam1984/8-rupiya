import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import AdminShop from '@/lib/models/Shop';
import AgentShop from '@/lib/models/AgentShop';

/**
 * GET /api/categories
 * Get all active categories with shop counts (public endpoint, no auth required)
 * Used by website and agents to fetch category list
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Fetch only active categories
    const categories = await Category.find({ isActive: true })
      .select('name slug description imageUrl')
      .sort({ name: 1 }) // Sort alphabetically
      .lean();

    // Get shop counts for each category
    // Count shops where category name or slug matches
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat: any) => {
        // Count shops in AdminShop and AgentShop collections
        // Match by category name (case-insensitive) or categoryRef
        const [adminShopCount, agentShopCount] = await Promise.all([
          AdminShop.countDocuments({
            $or: [
              { category: { $regex: new RegExp(`^${cat.name}$`, 'i') } },
              { categoryRef: cat._id },
            ],
          }),
          AgentShop.countDocuments({
            $or: [
              { category: { $regex: new RegExp(`^${cat.name}$`, 'i') } },
            ],
          }),
        ]);

        const itemCount = adminShopCount + agentShopCount;

        // Return in format expected by Category interface
        return {
          id: cat._id.toString(), // Map _id to id
          _id: cat._id.toString(), // Keep _id for backward compatibility
          slug: cat.slug,
          displayName: cat.name, // Map name to displayName
          name: cat.name, // Keep name for backward compatibility
          description: cat.description,
          iconUrl: cat.imageUrl, // Map imageUrl to iconUrl
          imageUrl: cat.imageUrl, // Keep imageUrl for backward compatibility
          itemCount: itemCount, // Add shop count
          sponsored: false, // Default to false, can be enhanced later
        };
      })
    );

    return NextResponse.json({
      success: true,
      categories: categoriesWithCounts,
      count: categoriesWithCounts.length,
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    console.error('Error stack:', error.stack);
    
    // Return empty categories array to prevent frontend errors
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        details: error.message || 'Unknown error',
        categories: [], // Return empty array
        count: 0
      },
      { status: 500 }
    );
  }
}
