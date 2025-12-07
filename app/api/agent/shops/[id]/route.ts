import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop';
import { verifyAgentToken, getAgentTokenFromRequest } from '@/lib/utils/agentAuth';
import mongoose from 'mongoose';

// GET /api/agent/shops/[id] - Get single shop
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getAgentTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyAgentToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    await connectDB();

    // Next.js 15+ mein params ek Promise hai
    const { id } = await params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid shop ID format' },
        { status: 400 }
      );
    }

    const shop = await AgentShop.findOne({
      _id: new mongoose.Types.ObjectId(id),
      agentId: new mongoose.Types.ObjectId(payload.agentId),
    });

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        shop,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get shop error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/agent/shops/[id] - Update shop
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getAgentTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyAgentToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    await connectDB();

    // Next.js 15+ mein params ek Promise hai
    const { id } = await params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid shop ID format' },
        { status: 400 }
      );
    }

    const shop = await AgentShop.findOne({
      _id: new mongoose.Types.ObjectId(id),
      agentId: new mongoose.Types.ObjectId(payload.agentId),
    });

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const allowedFields = [
      'shopName',
      'ownerName',
      'mobile',
      'category',
      'pincode',
      'address',
      'photoUrl',
      'additionalPhotos', // Additional photos (optional)
      'latitude',
      'longitude',
      'paymentStatus',
      'paymentMode',
      'receiptNo',
      'amount',
      'sendSmsReceipt',
    ];

    // Update allowed fields
    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        (shop as any)[field] = body[field];
      }
    });

    await shop.save();

    return NextResponse.json(
      {
        success: true,
        shop,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update shop error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
