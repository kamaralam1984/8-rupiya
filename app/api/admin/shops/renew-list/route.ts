import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import RenewShop from '@/lib/models/RenewShop';
import { requireAdmin } from '@/lib/auth';

/**
 * GET /api/admin/shops/renew-list
 * Get list of all shops that need renewal
 */
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const shops = await RenewShop.find()
      .sort({ expiredDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await RenewShop.countDocuments();

    return NextResponse.json(
      {
        success: true,
        shops,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get renew shops error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

