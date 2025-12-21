import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/lib/models/Payment';
import { requireAdmin } from '@/lib/auth';

/**
 * GET /api/admin/payments
 * Get all payments with filters (Admin only)
 */
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // PENDING, SUCCESS, FAILED, etc.
    const planType = searchParams.get('planType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (status) {
      query.status = status.toUpperCase();
    }
    if (planType) {
      query.planType = planType.toUpperCase();
    }

    // Get payments
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('shopId', 'shopName ownerName mobile')
      .populate('agentId', 'name email mobile')
      .lean();

    // Get total count
    const total = await Payment.countDocuments(query);

    return NextResponse.json(
      {
        success: true,
        payments,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Admin payments fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
});
