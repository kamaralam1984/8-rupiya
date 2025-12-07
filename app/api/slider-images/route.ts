import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SliderImage from '@/models/SliderImage';

// GET - Fetch all active slider images (public endpoint)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const pageUrl = searchParams.get('pageUrl') || '/';
    const category = searchParams.get('category');

    // Build query
    const query: any = {
      isActive: true,
    };

    // Page-specific or default
    const pageConditions: any[] = [];
    pageConditions.push({ pageUrl: { $exists: false } });
    pageConditions.push({ pageUrl: '' });
    pageConditions.push({ pageUrl: '/' });
    
    if (pageUrl && pageUrl !== '/') {
      pageConditions.push({ pageUrl: pageUrl });
    }

    if (category) {
      pageConditions.push({ category: category });
    }

    if (pageConditions.length > 0) {
      query.$or = pageConditions;
    }

    const sliderImages = await SliderImage.find(query)
      .sort({ order: 1, createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ success: true, sliderImages }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching slider images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch slider images', details: error.message },
      { status: 500 }
    );
  }
}

