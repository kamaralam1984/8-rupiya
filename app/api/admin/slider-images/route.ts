import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import SliderImage from '@/models/SliderImage';

// GET - Fetch all slider images (admin)
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const sliderImages = await SliderImage.find()
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, sliderImages }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching slider images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch slider images', details: error.message },
      { status: 500 }
    );
  }
});

// POST - Create new slider image
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

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

    // Validation
    if (!imageUrl || !alt) {
      return NextResponse.json(
        { error: 'Image URL and alt text are required' },
        { status: 400 }
      );
    }

    // Get max order if order not provided
    let sliderOrder = order;
    if (sliderOrder === undefined || sliderOrder === null) {
      const maxOrderSlider = await SliderImage.findOne()
        .sort({ order: -1 })
        .select('order')
        .lean();
      sliderOrder = maxOrderSlider ? (maxOrderSlider.order || 0) + 1 : 0;
    }

    const sliderImage = await SliderImage.create({
      imageUrl,
      alt,
      title,
      linkUrl: linkUrl || '#',
      pageUrl,
      pageId,
      category,
      order: sliderOrder,
      isActive: isActive !== undefined ? isActive : true,
      transitionEffect: transitionEffect || 'fade',
      duration: duration || 5000,
    });

    return NextResponse.json(
      { success: true, sliderImage },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating slider image:', error);
    return NextResponse.json(
      { error: 'Failed to create slider image', details: error.message },
      { status: 500 }
    );
  }
});

