import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop';
import AdminShop from '@/lib/models/Shop';

/**
 * GET /api/shops/[id]
 * Get shop details by ID (public endpoint for shopkeepers)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    // Try to find in AgentShop first
    let agentShop = await AgentShop.findById(id).lean();

    if (agentShop) {
      // Return shop data (public, no sensitive info)
      return NextResponse.json(
        {
          success: true,
          shop: {
            _id: agentShop._id,
            shopName: agentShop.shopName,
            ownerName: agentShop.ownerName,
            mobile: agentShop.mobile,
            email: agentShop.email,
            category: agentShop.category,
            pincode: agentShop.pincode,
            address: agentShop.address,
            photoUrl: agentShop.photoUrl,
            planType: agentShop.planType || 'BASIC',
            paymentStatus: agentShop.paymentStatus,
            shopUrl: (agentShop as any).shopUrl,
          },
        },
        { status: 200 }
      );
    }

    // Try AdminShop
    const adminShop = await AdminShop.findById(id).lean();

    if (!adminShop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Return shop data (public, no sensitive info)
    const adminShopData = adminShop as any;
    return NextResponse.json(
      {
        success: true,
        shop: {
          _id: adminShop._id,
          shopName: adminShopData.shopName || adminShopData.name,
          ownerName: adminShopData.ownerName,
          mobile: adminShopData.mobile || adminShopData.phone,
          email: adminShopData.email,
          category: adminShopData.category,
          pincode: adminShopData.pincode,
          address: adminShopData.address || adminShopData.fullAddress,
          photoUrl: adminShopData.photoUrl || adminShopData.imageUrl,
          planType: adminShopData.planType || 'BASIC',
          paymentStatus: adminShopData.paymentStatus || 'PAID',
          shopUrl: adminShopData.shopUrl,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get shop error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch shop',
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
