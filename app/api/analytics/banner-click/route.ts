import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Analytics from '@/lib/models/Analytics';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { bannerId, section, position, shopName, shopId, sessionId } = body;

    // Get request headers for location
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     request.headers.get('cf-connecting-ip') ||
                     'unknown';

    // Get location from IP
    let locationData: { country?: string; region?: string; city?: string; district?: string } = {};
    if (ipAddress && ipAddress !== 'unknown') {
      try {
        const response = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
          headers: { 'User-Agent': '8rupiya-analytics' },
        });
        if (response.ok) {
          const data = await response.json();
          locationData = {
            country: data.country_name || data.country_code,
            region: data.region || data.region_code,
            city: data.city,
            district: data.district,
          };
        }
      } catch (error) {
        console.error('Error fetching location:', error);
      }
    }

    // Create analytics entry for shop click
    const analyticsEntry = await Analytics.create({
      page: `/shop/${bannerId}`,
      pageTitle: shopName || 'Shop Click',
      pageType: 'shop',
      source: 'direct',
      device: 'desktop', // Default, can be enhanced
      shopId: shopId || bannerId,
      shopName: shopName || undefined,
      country: locationData.country,
      region: locationData.region,
      city: locationData.city,
      district: locationData.district,
      sessionId: sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isNewSession: false,
      actions: [{
        type: 'shop_click',
        element: section,
        shopId: shopId || bannerId,
        shopName: shopName || undefined,
        timestamp: new Date(),
      }],
      visitedAt: new Date(),
    });

    return NextResponse.json({ 
      success: true,
      analyticsId: analyticsEntry._id,
    });
  } catch (error) {
    console.error('Error tracking banner click:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

