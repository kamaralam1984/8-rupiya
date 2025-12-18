import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shopper from '@/lib/models/Shopper';
import { requireAdminOnly } from '@/lib/auth';

// GET /api/admin/shoppers - List all shoppers
export const GET = requireAdminOnly(async (request: NextRequest) => {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const filterStatus = searchParams.get('status'); // 'all', 'pending', 'verified', 'active', 'inactive'

    let query: any = {};

    if (filterStatus === 'pending') {
      query.isVerified = false;
    } else if (filterStatus === 'verified') {
      query.isVerified = true;
    } else if (filterStatus === 'active') {
      query.isActive = true;
    } else if (filterStatus === 'inactive') {
      query.isActive = false;
    }

    const shoppers = await Shopper.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        shoppers: shoppers.map((shopper) => ({
          id: shopper._id.toString(),
          name: shopper.name,
          phone: shopper.phone,
          email: shopper.email,
          shopperCode: shopper.shopperCode,
          isActive: shopper.isActive,
          isVerified: shopper.isVerified,
          totalShops: shopper.totalShops || 0,
          createdAt: shopper.createdAt,
          updatedAt: shopper.updatedAt,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching shoppers:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

