import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HeroBannerImage from '@/models/HeroBannerImage';

// GET - Fetch hero banner images (public endpoint)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const pageUrl = searchParams.get('pageUrl') || '/';
    const category = searchParams.get('category');
    const locationId = searchParams.get('locationId');

    const now = new Date();

    // Build query
    const query: any = {
      isActive: true,
      $and: [
        {
          $or: [
            { startDate: { $exists: false } },
            { startDate: { $lte: now } },
          ],
        },
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: { $gte: now } },
          ],
        },
      ],
    };

    // Page-specific or default - match any of these conditions
    const pageConditions: any[] = [];
    
    // Always allow banners with no pageUrl specified (default banners)
    pageConditions.push({ pageUrl: { $exists: false } });
    pageConditions.push({ pageUrl: '' });
    pageConditions.push({ pageUrl: '/' });
    
    // Match specific page
    if (pageUrl && pageUrl !== '/') {
      pageConditions.push({ pageUrl: pageUrl });
    }

    // Match category if provided
    if (category) {
      pageConditions.push({ category: category });
    }

    // Match location if provided
    if (locationId) {
      pageConditions.push({ locationId: locationId });
    }

    // Use $or for page matching - banner should match at least one condition
    if (pageConditions.length > 0) {
      query.$or = pageConditions;
    }

    const heroBanners = await HeroBannerImage.find(query)
      .sort({ order: 1, createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({ success: true, heroBanners }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching hero banners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hero banners', details: error.message },
      { status: 500 }
    );
  }
}

