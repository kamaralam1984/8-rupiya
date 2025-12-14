import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop';
import { verifyOperatorTokenAndGetOperator } from '@/lib/utils/operatorAuth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

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

    // Find the shop
    const shop = await AgentShop.findById(id).lean();
    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Transform shop
    const transformedShop = {
      _id: shop._id.toString(),
      shopName: shop.shopName,
      ownerName: shop.ownerName,
      mobile: shop.mobile,
      email: shop.email,
      category: shop.category,
      pincode: shop.pincode,
      address: shop.address,
      photoUrl: shop.photoUrl,
      paymentStatus: shop.paymentStatus,
      googleBusinessAccount: shop.googleBusinessAccount || {
        status: 'NOT_CREATED',
      },
      createdAt: shop.createdAt,
    };

    return NextResponse.json({
      success: true,
      shop: transformedShop,
    });
  } catch (error: any) {
    console.error('Error fetching operator shop:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shop', details: error.message },
      { status: 500 }
    );
  }
}

