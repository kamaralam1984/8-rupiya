import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import HeroBannerImage from '@/models/HeroBannerImage';

// GET - Fetch all hero banner images (admin)
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const heroBanners = await HeroBannerImage.find()
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, heroBanners }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching hero banners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hero banners', details: error.message },
      { status: 500 }
    );
  }
});

// POST - Create new hero banner image
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
      locationId,
      area,
      pincode,
      order,
      isActive,
      textEffect,
      animation,
      animationDuration,
      animationDelay,
      showTitle,
      showSubtitle,
      subtitle,
      titleColor,
      subtitleColor,
      backgroundEffect,
      overlayColor,
      overlayOpacity,
      startDate,
      endDate,
    } = body;

    // Validation
    if (!imageUrl || !alt) {
      return NextResponse.json(
        { error: 'Image URL and alt text are required' },
        { status: 400 }
      );
    }

    // Get max order if order not provided
    let bannerOrder = order;
    if (bannerOrder === undefined || bannerOrder === null) {
      const maxOrderBanner = await HeroBannerImage.findOne()
        .sort({ order: -1 })
        .select('order')
        .lean();
      bannerOrder = maxOrderBanner ? (maxOrderBanner.order || 0) + 1 : 0;
    }

    const heroBanner = await HeroBannerImage.create({
      imageUrl,
      alt,
      title,
      linkUrl: linkUrl || '#',
      pageUrl,
      pageId,
      category,
      locationId,
      area,
      pincode,
      order: bannerOrder,
      isActive: isActive !== undefined ? isActive : true,
      textEffect: textEffect || 'none',
      animation: animation || 'none',
      animationDuration: animationDuration || 2,
      animationDelay: animationDelay || 0,
      showTitle: showTitle || false,
      showSubtitle: showSubtitle || false,
      subtitle,
      titleColor: titleColor || '#ffffff',
      subtitleColor: subtitleColor || '#ffffff',
      backgroundEffect: backgroundEffect || 'none',
      overlayColor: overlayColor || '#000000',
      overlayOpacity: overlayOpacity || 0.3,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return NextResponse.json(
      { success: true, heroBanner },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating hero banner:', error);
    return NextResponse.json(
      { error: 'Failed to create hero banner', details: error.message },
      { status: 500 }
    );
  }
});




