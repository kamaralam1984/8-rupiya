import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SEO from '@/lib/models/SEO';

// POST /api/seo - Create SEO entry
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { shopName, area, category, pincode, emailId, ranking, shopId, shopUrl } = body;

    // Validation
    if (!shopName || !area || !category || !pincode || !emailId) {
      return NextResponse.json(
        { error: 'Missing required fields', details: 'Shop name, area, category, pincode, and email ID are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(emailId)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate pincode format
    if (!/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { error: 'Pincode must be 6 digits' },
        { status: 400 }
      );
    }

    // Default ranking to 1 if not provided
    const finalRanking = ranking || 1;
    if (finalRanking < 1) {
      return NextResponse.json(
        { error: 'Ranking must be at least 1' },
        { status: 400 }
      );
    }

    // Create SEO entry
    const seoEntry = await SEO.create({
      shopName: shopName.trim(),
      area: area.trim(),
      category: category.trim(),
      pincode: pincode.trim(),
      emailId: emailId.trim().toLowerCase(),
      ranking: finalRanking,
      shopId: shopId || undefined,
      shopUrl: shopUrl || undefined,
    });

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
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create SEO error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/seo - Get SEO entries with filters
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const area = searchParams.get('area');
    const pincode = searchParams.get('pincode');
    const ranking = searchParams.get('ranking');

    // Build query
    const query: any = {};
    if (category) query.category = category;
    if (area) query.area = area;
    if (pincode) query.pincode = pincode;
    if (ranking) query.ranking = parseInt(ranking);

    const seoEntries = await SEO.find(query)
      .sort({ ranking: 1, createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        seo: seoEntries,
        count: seoEntries.length,
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

