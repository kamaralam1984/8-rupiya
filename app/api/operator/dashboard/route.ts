import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop';
import { verifyOperatorTokenAndGetOperator } from '@/lib/utils/operatorAuth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verify operator authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const operator = await verifyOperatorTokenAndGetOperator(token);
    if (!operator) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get all shops
    const allShops = await AgentShop.find({ paymentStatus: 'PAID' }).lean();

    // Calculate stats
    const totalShops = allShops.length;
    const shopsWithGoogleBusiness = allShops.filter(
      (shop) =>
        shop.googleBusinessAccount?.status === 'CREATED' ||
        shop.googleBusinessAccount?.status === 'VERIFIED'
    ).length;
    const shopsPendingGoogleBusiness = allShops.filter(
      (shop) => shop.googleBusinessAccount?.status === 'PENDING'
    ).length;
    const shopsWithoutGoogleBusiness = allShops.filter(
      (shop) =>
        !shop.googleBusinessAccount ||
        shop.googleBusinessAccount.status === 'NOT_CREATED' ||
        shop.googleBusinessAccount.status === 'FAILED'
    ).length;

    return NextResponse.json({
      success: true,
      stats: {
        totalShops,
        shopsWithGoogleBusiness,
        shopsPendingGoogleBusiness,
        shopsWithoutGoogleBusiness,
      },
    });
  } catch (error: any) {
    console.error('Error fetching operator dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard stats', details: error.message },
      { status: 500 }
    );
  }
}

