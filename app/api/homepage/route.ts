import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HomepageSettings from '@/models/HomepageSettings';

// GET - Get active homepage settings (public route)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Check if connection is ready
    const mongoose = (await import('mongoose')).default;
    if (mongoose.connection.readyState !== 1) {
      // Connection not ready, try to reconnect
      await connectDB();
    }

    const settings = await HomepageSettings.findOne({ isActive: true }).lean();

    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({
        success: true,
        settings: {
          sections: {
            hero: true,
            categories: true,
            offers: true,
            featuredBusinesses: true,
            topRated: true,
            newBusinesses: true,
          },
          layout: {
            theme: 'light',
            primaryColor: '#3b82f6',
            secondaryColor: '#8b5cf6',
            containerWidth: '98%',
            sectionSpacing: '40px',
          },
        },
      }, { status: 200 });
    }

    return NextResponse.json({ success: true, settings }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching homepage settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homepage settings', details: error.message },
      { status: 500 }
    );
  }
}

