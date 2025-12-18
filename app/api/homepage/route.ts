import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HomepageSettings from '@/models/HomepageSettings';

// Default homepage settings to return on error
const defaultSettings = {
  sections: {
    hero: true,
    categories: true,
    offers: true,
    featuredBusinesses: true,
    topRated: true,
    newBusinesses: true,
    searchFilter: true,
  },
  heroSections: {
    leftRail: true,
    rightRail: true,
    bottomRail: true,
    bottomStrip: true,
  },
  layout: {
    theme: 'light',
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    containerWidth: '98%',
    sectionSpacing: '40px',
  },
};

// GET - Get active homepage settings (public route)
// Cache for 5 minutes to reduce database load
export const revalidate = 300;

export async function GET(request: NextRequest) {
  try {
    // Try to connect to MongoDB with timeout (reduced to 2 seconds for faster response)
    const connectPromise = connectDB();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 2000)
    );

    try {
      await Promise.race([connectPromise, timeoutPromise]);
    } catch (connectError: any) {
      // If connection fails (SSL error, timeout, etc.), return default settings immediately
      return NextResponse.json({
        success: true,
        settings: defaultSettings,
      }, { 
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    // Check if connection is ready
    const mongoose = (await import('mongoose')).default;
    if (mongoose.connection.readyState !== 1) {
      // Connection not ready, return default settings
      console.warn('⚠️ MongoDB connection not ready, using default settings');
      return NextResponse.json({
        success: true,
        settings: defaultSettings,
      }, { status: 200 });
    }

    // Try to fetch settings with timeout (reduced to 1.5 seconds)
    const findPromise = HomepageSettings.findOne({ isActive: true }).lean();
    const findTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), 1500)
    );

    let settings;
    try {
      settings = await Promise.race([findPromise, findTimeoutPromise]);
    } catch (queryError: any) {
      // If query fails, return default settings immediately
      return NextResponse.json({
        success: true,
        settings: defaultSettings,
      }, { 
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({
        success: true,
        settings: defaultSettings,
      }, { 
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    // Ensure heroSections exists for backward compatibility
    const settingsWithDefaults = {
      ...settings,
      heroSections: (settings as any).heroSections || {
        leftRail: true,
        rightRail: true,
        bottomRail: true,
        bottomStrip: true,
      },
    };

    return NextResponse.json(
      { success: true, settings: settingsWithDefaults }, 
      { 
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error: any) {
    // Catch any other errors and return default settings immediately
    return NextResponse.json({
      success: true,
      settings: defaultSettings,
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  }
}

