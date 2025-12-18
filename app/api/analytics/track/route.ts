import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Analytics from '@/lib/models/Analytics';
import { headers } from 'next/headers';

/**
 * POST /api/analytics/track
 * Track page visit and user behavior
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      page,
      pageTitle,
      pageType,
      shopId,
      shopName,
      category,
      area,
      pincode,
      district,
      state,
      country,
      city,
      timeOnPage,
      scrollDepth,
      sessionDuration,
      sessionStartTime,
      sessionEndTime,
      actions,
    } = body;

    // Get request headers
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     request.headers.get('cf-connecting-ip') ||
                     'unknown';

    // Parse user agent to get device, browser, OS
    const deviceInfo = parseUserAgent(userAgent);
    
    // Determine traffic source
    const sourceInfo = determineTrafficSource(referer, request.url);

    // Generate or get session ID
    const sessionId = body.sessionId || generateSessionId();

    // Get location from IP (if not provided in body)
    let locationData: { country?: string; region?: string; city?: string; district?: string } = {};
    if (country || state || district || city) {
      // Use provided location data
      locationData = {
        country: country,
        region: state,
        city: city,
        district: district,
      };
    } else if (ipAddress && ipAddress !== 'unknown') {
      // Try to get location from IP (basic implementation)
      // In production, use a proper geolocation service like ipapi.co, ip-api.com, etc.
      locationData = await getLocationFromIP(ipAddress);
    }

    // Create analytics entry
    const analyticsEntry = await Analytics.create({
      page,
      pageTitle,
      pageType: pageType || determinePageType(page),
      referrer: referer || undefined,
      source: sourceInfo.source,
      medium: sourceInfo.medium,
      campaign: sourceInfo.campaign,
      ipAddress: hashIP(ipAddress), // Hash IP for privacy
      userAgent,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      country: locationData.country || country || undefined,
      region: locationData.region || state || undefined,
      city: locationData.city || city || undefined,
      district: locationData.district || district || undefined,
      area: area || undefined,
      pincode: pincode || undefined,
      shopId: shopId || undefined,
      shopName: shopName || undefined,
      category: category || undefined,
      sessionId,
      isNewSession: body.isNewSession !== false,
      sessionDuration: sessionDuration || undefined,
      sessionStartTime: sessionStartTime ? new Date(sessionStartTime) : undefined,
      sessionEndTime: sessionEndTime ? new Date(sessionEndTime) : undefined,
      timeOnPage,
      scrollDepth,
      actions: actions || [],
      visitedAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        sessionId,
        analyticsId: analyticsEntry._id,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Analytics tracking error:', error);
    // Don't fail the request if analytics fails
    return NextResponse.json(
      { success: false, error: 'Analytics tracking failed' },
      { status: 500 }
    );
  }
}

/**
 * Parse user agent to extract device, browser, OS info
 */
function parseUserAgent(userAgent: string): {
  device: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
} {
  const ua = userAgent.toLowerCase();
  
  // Determine device
  let device: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    device = 'tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
    device = 'mobile';
  }

  // Determine browser
  let browser = 'unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
  } else if (ua.includes('edg')) {
    browser = 'Edge';
  } else if (ua.includes('opera') || ua.includes('opr')) {
    browser = 'Opera';
  }

  // Determine OS
  let os = 'unknown';
  if (ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('mac')) {
    os = 'macOS';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
  }

  return { device, browser, os };
}

/**
 * Determine traffic source from referrer
 */
function determineTrafficSource(
  referrer: string,
  currentUrl: string
): {
  source: 'direct' | 'google' | 'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'youtube' | 'other';
  medium?: string;
  campaign?: string;
} {
  if (!referrer || referrer === '') {
    return { source: 'direct' };
  }

  const ref = referrer.toLowerCase();
  const url = new URL(currentUrl);
  const utmSource = url.searchParams.get('utm_source');
  const utmMedium = url.searchParams.get('utm_medium');
  const utmCampaign = url.searchParams.get('utm_campaign');

  // Check UTM parameters first
  if (utmSource) {
    const sourceMap: Record<string, 'google' | 'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'youtube' | 'other'> = {
      'google': 'google',
      'facebook': 'facebook',
      'fb': 'facebook',
      'twitter': 'twitter',
      'linkedin': 'linkedin',
      'instagram': 'instagram',
      'youtube': 'youtube',
    };
    
    return {
      source: sourceMap[utmSource.toLowerCase()] || 'other',
      medium: utmMedium || undefined,
      campaign: utmCampaign || undefined,
    };
  }

  // Check referrer domain
  try {
    const referrerUrl = new URL(referrer);
    const domain = referrerUrl.hostname.toLowerCase();

    if (domain.includes('google')) {
      return { source: 'google', medium: 'organic' };
    } else if (domain.includes('facebook') || domain.includes('fb.com')) {
      return { source: 'facebook', medium: 'social' };
    } else if (domain.includes('twitter') || domain.includes('x.com')) {
      return { source: 'twitter', medium: 'social' };
    } else if (domain.includes('linkedin')) {
      return { source: 'linkedin', medium: 'social' };
    } else if (domain.includes('instagram')) {
      return { source: 'instagram', medium: 'social' };
    } else if (domain.includes('youtube')) {
      return { source: 'youtube', medium: 'social' };
    } else {
      return { source: 'other', medium: 'referral' };
    }
  } catch {
    return { source: 'other' };
  }
}

/**
 * Determine page type from URL
 */
function determinePageType(page: string): 'shop' | 'category' | 'home' | 'search' | 'other' {
  if (page.includes('/shop/')) {
    return 'shop';
  } else if (page.includes('/contact/')) {
    return 'shop';
  } else if (page === '/' || page === '') {
    return 'home';
  } else if (page.includes('/search') || page.includes('search')) {
    return 'search';
  } else {
    // Check if it's a category page (single segment after /)
    const segments = page.split('/').filter(Boolean);
    if (segments.length === 1 && !segments[0].includes('.')) {
      return 'category';
    }
    return 'other';
  }
}

/**
 * Hash IP address for privacy
 */
function hashIP(ip: string): string {
  // Simple hash function (in production, use crypto)
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `hashed_${Math.abs(hash)}`;
}

/**
 * Generate session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get location from IP address
 * Note: This is a basic implementation. In production, use a proper geolocation service.
 */
async function getLocationFromIP(ip: string): Promise<{ country?: string; region?: string; city?: string; district?: string }> {
  try {
    // Skip localhost/private IPs
    if (ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return {};
    }

    // Use ipapi.co free tier (1000 requests/day)
    // You can also use ip-api.com, ipgeolocation.io, etc.
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        'User-Agent': '8rupiya-analytics',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        country: data.country_name || data.country_code || undefined,
        region: data.region || data.region_code || undefined,
        city: data.city || undefined,
        district: data.district || undefined,
      };
    }
  } catch (error) {
    console.error('Error fetching location from IP:', error);
  }

  return {};
}

