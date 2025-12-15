import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import Offer from '@/models/Offer';

// GET - List all offers
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId');
    const isActive = searchParams.get('isActive');

    const query: any = {};
    if (businessId) query.businessId = businessId;
    if (isActive !== null) query.isActive = isActive === 'true';

    const offers = await Offer.find(query)
      .populate('businessId', 'name slug')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, offers }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching offers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offers', details: error.message },
      { status: 500 }
    );
  }
});

// POST - Create new offer
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const body = await request.json();
    const { 
      headline, 
      description, 
      shopId, 
      shopName, 
      shopLogo, 
      imageUrl, 
      discount, 
      cta, 
      sponsored, 
      businessId, 
      isActive, 
      startDate, 
      endDate, 
      expiresAt,
      linkUrl,
      position
    } = body;

    if (!headline) {
      return NextResponse.json(
        { error: 'Offer headline is required' },
        { status: 400 }
      );
    }

    if (!shopName) {
      return NextResponse.json(
        { error: 'Shop name is required' },
        { status: 400 }
      );
    }

    const offer = await Offer.create({
      headline,
      description,
      shopId,
      shopName,
      shopLogo,
      imageUrl,
      discount,
      cta: cta || 'View Offer',
      sponsored: sponsored || false,
      businessId: businessId || undefined,
      isActive: isActive !== undefined ? isActive : true,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      linkUrl,
      position: position || 0,
    });

    const populated = await Offer.findById(offer._id).populate('businessId', 'name slug').lean();

    return NextResponse.json(
      { success: true, offer: populated },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating offer:', error);
    return NextResponse.json(
      { error: 'Failed to create offer', details: error.message },
      { status: 500 }
    );
  }
});

