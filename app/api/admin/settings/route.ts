import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Settings from '@/lib/models/Settings';

export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    
    return NextResponse.json({
      success: true,
      settings: {
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
        sectionVisibility: settings.sectionVisibility || {
          leftRail: true,
          rightRail: true,
          bottomRail: true,
          rightSide: true,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
});

export const PUT = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();
    const body = await request.json();
    const { displayLimits, iconSizes, sectionVisibility } = body;

    if (!displayLimits && !iconSizes && !sectionVisibility) {
      return NextResponse.json(
        { success: false, error: 'displayLimits, iconSizes, or sectionVisibility is required' },
        { status: 400 }
      );
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    // Ensure sectionVisibility exists in settings
    if (!settings.sectionVisibility) {
      settings.sectionVisibility = {
        leftRail: true,
        rightRail: true,
        bottomRail: true,
        rightSide: true,
      };
    }

    // Validate and update limits if provided
    if (displayLimits) {
      settings.displayLimits = {
        nearbyShops: Math.max(1, Math.min(100, displayLimits.nearbyShops || 30)),
        leftRail: Math.max(1, Math.min(10, displayLimits.leftRail || 3)),
        featuredShops: Math.max(1, Math.min(50, displayLimits.featuredShops || 10)),
        topCategories: Math.max(1, Math.min(50, displayLimits.topCategories || 20)),
        latestOffers: Math.max(1, Math.min(50, displayLimits.latestOffers || 10)),
        featuredBusinesses: Math.max(1, Math.min(50, displayLimits.featuredBusinesses || 10)),
      };
    }

    // Validate and update icon sizes if provided
    if (iconSizes) {
      settings.iconSizes = {
        bottomStrip: Math.max(30, Math.min(200, iconSizes.bottomStrip || 66)),
        leftRail: Math.max(50, Math.min(300, iconSizes.leftRail || 100)),
        featuredBusinesses: Math.max(100, Math.min(500, iconSizes.featuredBusinesses || 200)),
        latestOffers: Math.max(100, Math.min(500, iconSizes.latestOffers || 200)),
        topCategories: Math.max(50, Math.min(200, iconSizes.topCategories || 112)),
      };
    }

    // Validate and update section visibility if provided
    if (sectionVisibility) {
      // Preserve existing values if not provided
      const currentVisibility = settings.sectionVisibility || {
        leftRail: true,
        rightRail: true,
        bottomRail: true,
        rightSide: true,
      };
      
      settings.sectionVisibility = {
        leftRail: sectionVisibility.leftRail !== undefined ? Boolean(sectionVisibility.leftRail) : currentVisibility.leftRail,
        rightRail: sectionVisibility.rightRail !== undefined ? Boolean(sectionVisibility.rightRail) : currentVisibility.rightRail,
        bottomRail: sectionVisibility.bottomRail !== undefined ? Boolean(sectionVisibility.bottomRail) : currentVisibility.bottomRail,
        rightSide: sectionVisibility.rightSide !== undefined ? Boolean(sectionVisibility.rightSide) : currentVisibility.rightSide,
      };
      
      console.log('💾 Updating sectionVisibility:', {
        received: sectionVisibility,
        current: currentVisibility,
        new: settings.sectionVisibility,
      });
    } else {
      // Ensure sectionVisibility exists even if not provided
      if (!settings.sectionVisibility) {
        settings.sectionVisibility = {
          leftRail: true,
          rightRail: true,
          bottomRail: true,
          rightSide: true,
        };
      }
    }

    await settings.save();

    console.log('💾 Saved settings:', {
      displayLimits: settings.displayLimits,
      iconSizes: settings.iconSizes,
      sectionVisibility: settings.sectionVisibility,
    });

    return NextResponse.json({
      success: true,
      settings: {
        displayLimits: settings.displayLimits,
        iconSizes: settings.iconSizes,
        sectionVisibility: settings.sectionVisibility || {
          leftRail: true,
          rightRail: true,
          bottomRail: true,
          rightSide: true,
        },
      },
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
});

