import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentLocation from '@/lib/models/AgentLocation';
import { verifyAgentToken, getAgentTokenFromRequest } from '@/lib/utils/agentAuth';

/**
 * POST /api/agent/location
 * Update agent's current location
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = getAgentTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyAgentToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    let { latitude, longitude, address, city, area, pincode } = body;

    // Validate required fields
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // Server-side reverse geocoding if address data is missing or incomplete
    // Try multiple zoom levels for better accuracy
    if (!address || !city || !area || !pincode) {
      try {
        // Try with higher zoom level first (more detailed)
        let geocodeResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&extratags=1`,
          {
            headers: {
              'User-Agent': '8Rupiya-Server/1.0',
              'Accept-Language': 'en',
            },
          }
        );

        let geocodeData: any = null;
        if (geocodeResponse.ok) {
          geocodeData = await geocodeResponse.json();
        }

        // If first attempt didn't get good results, try with different zoom
        if (!geocodeData || !geocodeData.address?.postcode) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
          geocodeResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
            {
              headers: {
                'User-Agent': '8Rupiya-Server/1.0',
                'Accept-Language': 'en',
              },
            }
          );
          if (geocodeResponse.ok) {
            const altData = await geocodeResponse.json();
            // Use alternative data if it has better pincode
            if (altData.address?.postcode && (!geocodeData?.address?.postcode || 
                geocodeData.address.postcode === '800001')) {
              geocodeData = altData;
            } else if (!geocodeData) {
              geocodeData = altData;
            }
          }
        }

        if (geocodeData) {
          const addr = geocodeData.address || {};
          
          // Extract address components with better Indian address handling
          if (!address) {
            address = geocodeData.display_name || undefined;
          }
          if (!city) {
            city = addr.city || addr.town || addr.village || addr.county || addr.state_district || undefined;
          }
          if (!area) {
            area = addr.suburb || 
                   addr.neighbourhood || 
                   addr.locality || 
                   addr.city_district || 
                   addr.quarter || 
                   addr.road || 
                   undefined;
          }
          
          // Better pincode extraction - validate and prefer more specific results
          if (!pincode || pincode === '800001') {
            // Try to get more accurate pincode
            const extractedPincode = addr.postcode || 
                                    addr.postal_code || 
                                    (geocodeData.extratags?.postal_code) ||
                                    undefined;
            
            // Validate Indian pincode format (6 digits)
            if (extractedPincode && /^\d{6}$/.test(String(extractedPincode).trim())) {
              pincode = String(extractedPincode).trim();
            } else if (pincode && /^\d{6}$/.test(String(pincode).trim())) {
              // Keep existing if valid
            } else {
              pincode = undefined;
            }
          }
        }
      } catch (geocodeError) {
        // If reverse geocoding fails, continue with just coordinates
        if (process.env.NODE_ENV === 'development') {
          console.warn('Server-side reverse geocoding failed:', geocodeError);
        }
      }
    }

    // Get device info
    const userAgent = request.headers.get('user-agent') || '';
    const deviceInfo = {
      userAgent,
      platform: userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
    };

    // Update or create location record
    const location = await AgentLocation.findOneAndUpdate(
      { agentId: payload.agentId },
      {
        agentId: payload.agentId,
        latitude,
        longitude,
        address: address || undefined,
        city: city || undefined,
        area: area || undefined,
        pincode: pincode || undefined,
        isOnline: true,
        lastSeen: new Date(),
        deviceInfo,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Location updated successfully',
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        city: location.city,
        area: location.area,
        pincode: location.pincode,
        isOnline: location.isOnline,
        lastSeen: location.lastSeen,
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Agent location update error:', error);
    }
    return NextResponse.json(
      {
        error: 'Failed to update location',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent/location
 * Get agent's current location
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = getAgentTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyAgentToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const location = await AgentLocation.findOne({ agentId: payload.agentId });

    if (!location) {
      return NextResponse.json({
        success: true,
        location: null,
        message: 'No location data found',
      });
    }

    return NextResponse.json({
      success: true,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        city: location.city,
        area: location.area,
        pincode: location.pincode,
        isOnline: location.isOnline,
        lastSeen: location.lastSeen,
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Get agent location error:', error);
    }
    return NextResponse.json(
      {
        error: 'Failed to get location',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

