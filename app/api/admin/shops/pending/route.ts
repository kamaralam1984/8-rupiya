import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import AdminShop from '@/lib/models/Shop';
import Shop from '@/models/Shop'; // Old Shop model

/**
 * GET /api/admin/shops/pending
 * Get all pending shops (shops with paymentStatus = PENDING)
 */
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    // Get pending shops from new AdminShop model
    const pendingShops = await AdminShop.find({ paymentStatus: 'PENDING' })
      .sort({ createdAt: -1 })
      .lean();

    // Format shops for response
    const formattedShops = pendingShops.map((shop: any) => ({
      _id: shop._id.toString(),
      shopName: shop.shopName,
      ownerName: shop.ownerName,
      category: shop.category,
      mobile: shop.mobile,
      area: shop.area,
      fullAddress: shop.fullAddress,
      city: shop.city,
      pincode: shop.pincode,
      district: shop.district,
      latitude: shop.latitude,
      longitude: shop.longitude,
      photoUrl: shop.photoUrl,
      iconUrl: shop.iconUrl,
      paymentStatus: shop.paymentStatus,
      planType: shop.planType,
      planAmount: shop.planAmount,
      createdAt: shop.createdAt,
    }));

    return NextResponse.json(
      {
        success: true,
        shops: formattedShops,
        count: formattedShops.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching pending shops:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending shops', details: error.message },
      { status: 500 }
    );
  }
});








