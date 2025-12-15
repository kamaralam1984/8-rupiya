import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Offer from '@/models/Offer';
import type { Offer as OfferType } from '@/app/types';

// Revalidate every 5 minutes (aggressive caching)
export const revalidate = 300;

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const loc = searchParams.get('loc');
    const cat = searchParams.get('cat');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // Default 20, max 50

    // Build query - only active offers
    const query: any = { isActive: true };

    // Filter expired offers
    query.$or = [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gte: new Date() } },
    ];

    // Get offers from database, sorted by position and sponsored status
    // Use indexes for better performance
    const offers = await Offer.find(query)
      .select('_id shopId shopName shopLogo imageUrl headline description discount expiresAt cta sponsored')
      .sort({ position: 1, sponsored: -1, createdAt: -1 })
      .limit(limit)
      .lean()
      .hint({ isActive: 1, position: 1 }); // Use index

    // Transform to frontend format
    const transformedOffers: OfferType[] = offers.map((offer: any) => ({
      id: offer._id.toString(),
      shopId: offer.shopId,
      shopName: offer.shopName,
      shopLogo: offer.shopLogo,
      imageUrl: offer.imageUrl,
      headline: offer.headline,
      description: offer.description,
      discount: offer.discount,
      expiresAt: offer.expiresAt ? new Date(offer.expiresAt).toISOString() : undefined,
      cta: offer.cta || 'View Offer',
      sponsored: offer.sponsored || false,
    }));

    return NextResponse.json({ offers: transformedOffers }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (error: any) {
    console.error('Error fetching offers:', error);
    // Return empty array on error to prevent frontend breaking
    return NextResponse.json({ offers: [] }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  }
}

