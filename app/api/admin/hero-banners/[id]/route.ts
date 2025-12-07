import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import HeroBannerImage from '@/models/HeroBannerImage';

// GET - Fetch single hero banner
export const GET = requireAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();
    const { id } = await params;

    const heroBanner = await HeroBannerImage.findById(id).lean();

    if (!heroBanner) {
      return NextResponse.json(
        { error: 'Hero banner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, heroBanner }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching hero banner:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hero banner', details: error.message },
      { status: 500 }
    );
  }
});

// PUT - Update hero banner
export const PUT = requireAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();
    const { id } = await params;

    const body = await request.json();
    const updateData: any = {};

    // Add all fields that can be updated
    const fields = [
      'imageUrl', 'alt', 'title', 'linkUrl', 'pageUrl', 'pageId', 'category',
      'locationId', 'area', 'pincode', 'order', 'isActive',
      'textEffect', 'animation', 'animationDuration', 'animationDelay',
      'showTitle', 'showSubtitle', 'subtitle', 'titleColor', 'subtitleColor',
      'backgroundEffect', 'overlayColor', 'overlayOpacity', 'startDate', 'endDate'
    ];

    fields.forEach(field => {
      if (body[field] !== undefined) {
        if (field === 'startDate' || field === 'endDate') {
          updateData[field] = body[field] ? new Date(body[field]) : undefined;
        } else {
          updateData[field] = body[field];
        }
      }
    });

    const heroBanner = await HeroBannerImage.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!heroBanner) {
      return NextResponse.json(
        { error: 'Hero banner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, heroBanner },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating hero banner:', error);
    return NextResponse.json(
      { error: 'Failed to update hero banner', details: error.message },
      { status: 500 }
    );
  }
});

// DELETE - Delete hero banner
export const DELETE = requireAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();
    const { id } = await params;

    const heroBanner = await HeroBannerImage.findByIdAndDelete(id);

    if (!heroBanner) {
      return NextResponse.json(
        { error: 'Hero banner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Hero banner deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting hero banner:', error);
    return NextResponse.json(
      { error: 'Failed to delete hero banner', details: error.message },
      { status: 500 }
    );
  }
});




