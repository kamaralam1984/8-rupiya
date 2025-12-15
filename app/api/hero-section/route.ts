import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HeroSectionSettings from '@/models/HeroSectionSettings';

/**
 * GET /api/hero-section
 * Get hero section settings (public endpoint - no auth required)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get settings
    let settings = await HeroSectionSettings.findOne();
    
    if (!settings) {
      // Create default settings if none exist
      settings = await HeroSectionSettings.create({});
    }

    return NextResponse.json({
      success: true,
      settings: settings.toObject(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200', // Cache for 10 minutes
      },
    });
  } catch (error: any) {
    // Don't log SSL/TLS errors - they're usually transient network issues
    const isSSLError = error?.message?.includes('SSL') || 
                       error?.message?.includes('TLS') || 
                       error?.message?.includes('ssl3_read_bytes') ||
                       error?.message?.includes('tlsv1 alert');
    
    if (!isSSLError) {
      console.error('Error fetching hero section settings:', error?.message || error);
    }
    
    // Return default settings on error (including SSL errors)
    return NextResponse.json({
      success: true,
      settings: {
        sections: {
          slider: true,
          leftRail: true,
          hero: true,
          rightRail: true,
          bottomStrip: true,
        },
        slider: {
          enabled: true,
          height: 'h-32',
          backgroundColor: '#ffffff',
          autoPlay: true,
          transitionDuration: 5000,
          shopIds: [],
        },
        leftRail: {
          enabled: true,
          count: 3,
          height: 'h-[391px]',
          backgroundColor: '#ffffff',
          borderColor: '#e5e7eb',
          shopIds: [],
        },
        hero: {
          enabled: true,
          height: 'h-[391px]',
          backgroundColor: '#ffffff',
          borderColor: '#e5e7eb',
          borderRadius: 'rounded-lg',
          shopId: '',
        },
        rightRail: {
          enabled: true,
          count: 3,
          height: 'h-[391px]',
          backgroundColor: '#ffffff',
          borderColor: '#e5e7eb',
          shopIds: [],
        },
        bottomStrip: {
          enabled: true,
          count: 10,
          height: 'h-20',
          backgroundColor: '#ffffff',
          borderColor: '#e5e7eb',
          shopIds: [],
        },
        global: {
          containerWidth: '98%',
          sectionSpacing: '40px',
          backgroundColor: '#f9fafb',
          borderRadius: 'rounded-xl',
          padding: 'p-2',
        },
      },
    });
  }
}


