import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import SliderImage from '@/models/SliderImage';

// GET - Fetch single slider image
export const GET = requireAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();
    const { id } = await params;

    const sliderImage = await SliderImage.findById(id).lean();

    if (!sliderImage) {
      return NextResponse.json(
        { error: 'Slider image not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, sliderImage }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching slider image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch slider image', details: error.message },
      { status: 500 }
    );
  }
});

// PUT - Update slider image
export const PUT = requireAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();
    const { id } = await params;

    const body = await request.json();
    const {
      imageUrl,
      alt,
      title,
      linkUrl,
      pageUrl,
      pageId,
      category,
      order,
      isActive,
      transitionEffect,
      duration,
    } = body;

    const updateData: any = {};
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (alt !== undefined) updateData.alt = alt;
    if (title !== undefined) updateData.title = title;
    if (linkUrl !== undefined) updateData.linkUrl = linkUrl;
    if (pageUrl !== undefined) updateData.pageUrl = pageUrl;
    if (pageId !== undefined) updateData.pageId = pageId;
    if (category !== undefined) updateData.category = category;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (transitionEffect !== undefined) updateData.transitionEffect = transitionEffect;
    if (duration !== undefined) updateData.duration = duration;

    const sliderImage = await SliderImage.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!sliderImage) {
      return NextResponse.json(
        { error: 'Slider image not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, sliderImage },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating slider image:', error);
    return NextResponse.json(
      { error: 'Failed to update slider image', details: error.message },
      { status: 500 }
    );
  }
});

// DELETE - Delete slider image
export const DELETE = requireAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();
    const { id } = await params;

    const sliderImage = await SliderImage.findByIdAndDelete(id);

    if (!sliderImage) {
      return NextResponse.json(
        { error: 'Slider image not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Slider image deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting slider image:', error);
    return NextResponse.json(
      { error: 'Failed to delete slider image', details: error.message },
      { status: 500 }
    );
  }
});

