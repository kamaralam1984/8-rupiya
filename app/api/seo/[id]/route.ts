import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SEO from '@/lib/models/SEO';
import mongoose from 'mongoose';

// PUT /api/seo/[id] - Update SEO entry (e.g., link shopId after shop creation)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { shopId, shopUrl, ranking } = body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid SEO entry ID' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {};
    if (shopId) {
      if (!mongoose.Types.ObjectId.isValid(shopId)) {
        return NextResponse.json(
          { error: 'Invalid shop ID' },
          { status: 400 }
        );
      }
      updateData.shopId = new mongoose.Types.ObjectId(shopId);
    }
    if (shopUrl) updateData.shopUrl = shopUrl.trim();
    if (ranking !== undefined) {
      if (ranking < 1) {
        return NextResponse.json(
          { error: 'Ranking must be at least 1' },
          { status: 400 }
        );
      }
      updateData.ranking = ranking;
    }

    // Update SEO entry
    const seoEntry = await SEO.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!seoEntry) {
      return NextResponse.json(
        { error: 'SEO entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        seo: {
          _id: seoEntry._id,
          shopName: seoEntry.shopName,
          area: seoEntry.area,
          category: seoEntry.category,
          pincode: seoEntry.pincode,
          emailId: seoEntry.emailId,
          ranking: seoEntry.ranking,
          shopId: seoEntry.shopId,
          shopUrl: seoEntry.shopUrl,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update SEO error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/seo/[id] - Get single SEO entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid SEO entry ID' },
        { status: 400 }
      );
    }

    const seoEntry = await SEO.findById(id).lean();

    if (!seoEntry) {
      return NextResponse.json(
        { error: 'SEO entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        seo: seoEntry,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get SEO error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

