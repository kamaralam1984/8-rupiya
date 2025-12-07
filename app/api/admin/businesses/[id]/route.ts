import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import Business from '@/models/Business';

// GET - Get single business
export const GET = requireAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();
    const { id } = await params;

    const business = await Business.findById(id)
      .populate('categoryId', 'name slug')
      .populate('specialOffers')
      .lean();

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, business }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching business:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business', details: error.message },
      { status: 500 }
    );
  }
});

// PUT - Update business
export const PUT = requireAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();
    const { id } = await params;

    const body = await request.json();
    const { name, slug, categoryId, address, pincode, area, imageUrl, latitude, longitude, isFeatured } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (address !== undefined) updateData.address = address;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (area !== undefined) updateData.area = area;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : undefined;
    if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : undefined;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

    const business = await Business.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('categoryId', 'name slug');

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, business },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating business:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Business with this slug already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update business', details: error.message },
      { status: 500 }
    );
  }
});

// DELETE - Delete business
export const DELETE = requireAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();
    const { id } = await params;

    const business = await Business.findByIdAndDelete(id);

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Business deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting business:', error);
    return NextResponse.json(
      { error: 'Failed to delete business', details: error.message },
      { status: 500 }
    );
  }
});

