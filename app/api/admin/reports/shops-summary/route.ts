import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop';
import AdminShop from '@/lib/models/Shop';
import { requireAdmin } from '@/lib/auth';

export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    // Fetch all shops from both collections
    const [agentShops, adminShops] = await Promise.all([
      AgentShop.find({}).lean(),
      AdminShop.find({}).lean(),
    ]);

    const allShops = [...agentShops, ...adminShops];
    const today = new Date();

    // Calculate summary
    const summary = {
      totalShops: allShops.length,
      paidShops: allShops.filter((shop: any) => shop.paymentStatus === 'PAID').length,
      pendingShops: allShops.filter((shop: any) => shop.paymentStatus === 'PENDING').length,
      expiredShops: allShops.filter((shop: any) => {
        if (!shop.expiryDate) return false;
        return new Date(shop.expiryDate) < today;
      }).length,
      activeShops: allShops.filter((shop: any) => {
        if (shop.paymentStatus !== 'PAID') return false;
        if (!shop.expiryDate) return true;
        return new Date(shop.expiryDate) >= today;
      }).length,
    };

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error('Error fetching shops summary:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shops summary', details: error.message },
      { status: 500 }
    );
  }
});

