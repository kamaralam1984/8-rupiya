import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Settings from '@/lib/models/Settings';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    
    const sectionVisibility = settings.sectionVisibility || {
      leftRail: true,
      rightRail: true,
      bottomRail: true,
      rightSide: true,
    };
    
    console.log('📋 Public Settings API - sectionVisibility:', sectionVisibility);
    
    return NextResponse.json({
      success: true,
      displayLimits: settings.displayLimits || {
        nearbyShops: 30,
        leftRail: 3,
        featuredShops: 10,
        topCategories: 20,
        latestOffers: 10,
        featuredBusinesses: 10,
      },
      iconSizes: settings.iconSizes || {
        bottomStrip: 66,
        leftRail: 100,
        featuredBusinesses: 200,
        latestOffers: 200,
        topCategories: 112,
      },
      sectionVisibility: sectionVisibility,
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    // Return default limits on error
    return NextResponse.json({
      success: true,
      displayLimits: {
        nearbyShops: 30,
        leftRail: 3,
        featuredShops: 10,
        topCategories: 20,
        latestOffers: 10,
        featuredBusinesses: 10,
      },
      iconSizes: {
        bottomStrip: 66,
        leftRail: 100,
        featuredBusinesses: 200,
        latestOffers: 200,
        topCategories: 112,
      },
      sectionVisibility: {
        leftRail: true,
        rightRail: true,
        bottomRail: true,
        rightSide: true,
      },
    });
  }
}

