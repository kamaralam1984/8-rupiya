import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import AdminShop from '@/lib/models/Shop';
import AgentShop from '@/lib/models/AgentShop';
import connectDB from '@/lib/mongodb';

/**
 * GET /api/admin/locations/geocode-pincode?pincode=123456
 * Get latitude and longitude for a given pincode
 */
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get('pincode');

    if (!pincode || pincode.length !== 6) {
      return NextResponse.json(
        { error: 'Valid 6-digit pincode is required' },
        { status: 400 }
      );
    }

    await connectDB();
    
    // First, try to get coordinates from existing shops with same pincode
    // Check both AdminShop and AgentShop collections
    const [adminShop, agentShop] = await Promise.all([
      AdminShop.findOne({ pincode: pincode }).lean(),
      AgentShop.findOne({ pincode: pincode }).lean(),
    ]);
    
    const shopWithPincode = adminShop || agentShop;
    
    if (shopWithPincode && shopWithPincode.latitude && shopWithPincode.longitude) {
      return NextResponse.json({
        success: true,
        latitude: shopWithPincode.latitude,
        longitude: shopWithPincode.longitude,
        source: adminShop ? 'existing_admin_shop' : 'existing_agent_shop',
      });
    }

    // If not found in shops, try to geocode using Nominatim (OpenStreetMap)
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json&limit=1`;
      
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'DigitalIndiaShopDirectory/1.0', // Required by Nominatim
        },
      });

      if (!response.ok) {
        throw new Error('Geocoding API request failed');
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        return NextResponse.json({
          success: true,
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          source: 'nominatim',
          displayName: result.display_name,
        });
      }
    } catch (geocodeError: any) {
      console.error('Geocoding error:', geocodeError);
      // Continue to return error
    }

    // If geocoding also fails, return error
    return NextResponse.json(
      {
        success: false,
        error: 'Could not find coordinates for this pincode. Please enter manually.',
      },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Pincode geocoding error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

