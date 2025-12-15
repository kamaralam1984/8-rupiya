import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import AdminShop from '@/lib/models/Shop';
import Shop from '@/models/Shop'; // Old Shop model
import AgentShop from '@/lib/models/AgentShop';

// Type for unified shop data
interface UnifiedShop {
  _id: any;
  model: 'admin' | 'old' | 'agent';
  name: string;
  visitorCount: number;
  createdAt?: Date;
}

/**
 * GET /api/admin/shops/visitor-stats
 * Get visitor count statistics for debugging (Admin only)
 */
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    // Get all shops from all collections
    const [adminShops, oldShops, agentShops] = await Promise.all([
      AdminShop.find({}).select('shopName visitorCount createdAt').lean(),
      Shop.find({}).select('name createdAt').lean(), // Old Shop model doesn't have visitorCount
      AgentShop.find({}).select('shopName visitorCount createdAt').lean(),
    ]);

    // Calculate statistics - ensure all shops have visitorCount
    const allShops: UnifiedShop[] = [
      ...adminShops.map(s => ({ 
        _id: s._id, 
        model: 'admin' as const, 
        name: s.shopName, 
        visitorCount: s.visitorCount || 0,
        createdAt: s.createdAt 
      })),
      ...oldShops.map(s => ({ 
        _id: s._id, 
        model: 'old' as const, 
        name: s.name, 
        visitorCount: 0, // Old Shop model doesn't have visitorCount
        createdAt: s.createdAt 
      })),
      ...agentShops.map(s => ({ 
        _id: s._id, 
        model: 'agent' as const, 
        name: s.shopName, 
        visitorCount: s.visitorCount || 0,
        createdAt: s.createdAt 
      })),
    ];

    const shopsWithVisitors = allShops.filter(s => s.visitorCount > 0);
    const shopsWithoutVisitors = allShops.filter(s => s.visitorCount === 0);

    const totalVisitors = allShops.reduce((sum, s) => sum + s.visitorCount, 0);
    const avgVisitors = allShops.length > 0 ? Math.round(totalVisitors / allShops.length) : 0;
    const maxVisitors = Math.max(...allShops.map(s => s.visitorCount), 0);
    const minVisitors = Math.min(...allShops.map(s => s.visitorCount), 0);

    // Top shops by visitor count
    const topShops = [...allShops]
      .sort((a, b) => b.visitorCount - a.visitorCount)
      .slice(0, 10)
      .map(s => ({
        id: s._id.toString(),
        name: s.name || 'Unknown',
        model: s.model,
        visitorCount: s.visitorCount,
      }));

    // Statistics by model
    const statsByModel = {
      admin: {
        total: adminShops.length,
        withVisitors: adminShops.filter(s => (s.visitorCount || 0) > 0).length,
        totalVisitors: adminShops.reduce((sum, s) => sum + (s.visitorCount || 0), 0),
        avgVisitors: adminShops.length > 0 
          ? Math.round(adminShops.reduce((sum, s) => sum + (s.visitorCount || 0), 0) / adminShops.length)
          : 0,
      },
      old: {
        total: oldShops.length,
        withVisitors: 0, // Old Shop model doesn't have visitorCount
        totalVisitors: 0, // Old Shop model doesn't have visitorCount
        avgVisitors: 0, // Old Shop model doesn't have visitorCount
      },
      agent: {
        total: agentShops.length,
        withVisitors: agentShops.filter(s => (s.visitorCount || 0) > 0).length,
        totalVisitors: agentShops.reduce((sum, s) => sum + (s.visitorCount || 0), 0),
        avgVisitors: agentShops.length > 0
          ? Math.round(agentShops.reduce((sum, s) => sum + (s.visitorCount || 0), 0) / agentShops.length)
          : 0,
      },
    };

    return NextResponse.json({
      success: true,
      statistics: {
        totalShops: allShops.length,
        shopsWithVisitors: shopsWithVisitors.length,
        shopsWithoutVisitors: shopsWithoutVisitors.length,
        totalVisitors,
        avgVisitors,
        maxVisitors,
        minVisitors,
      },
      statsByModel,
      topShops,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[VISITOR STATS] ❌ Error fetching visitor statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch visitor statistics', details: error.message },
      { status: 500 }
    );
  }
});

