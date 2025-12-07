import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import Location from '@/models/Location';
import AdminShop from '@/lib/models/Shop';
import AgentShop from '@/lib/models/AgentShop';

/**
 * POST /api/admin/locations/bulk-update-coordinates
 * Bulk update missing coordinates for all locations based on pincode
 */
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    // Get all locations with missing coordinates
    const locationsWithoutCoords = await Location.find({
      $or: [
        { latitude: { $exists: false } },
        { longitude: { $exists: false } },
        { latitude: null },
        { longitude: null },
      ],
      pincode: { $exists: true, $ne: null },
    }).lean();

    if (locationsWithoutCoords.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All locations already have coordinates',
        updated: 0,
      });
    }

    let updated = 0;
    let failed = 0;
    const results = [];

    // Process each location
    for (const location of locationsWithoutCoords) {
      try {
        const pincode = location.pincode?.toString();
        if (!pincode || pincode.length !== 6) {
          failed++;
          results.push({
            id: location.id,
            status: 'failed',
            reason: 'Invalid pincode',
          });
          continue;
        }

        let latitude: number | null = null;
        let longitude: number | null = null;
        let source = '';

        // First, try to get from existing shops with same pincode
        const [adminShop, agentShop] = await Promise.all([
          AdminShop.findOne({ pincode: pincode }).lean(),
          AgentShop.findOne({ pincode: pincode }).lean(),
        ]);

        const shopWithPincode = adminShop || agentShop;

        if (shopWithPincode?.latitude && shopWithPincode?.longitude) {
          latitude = shopWithPincode.latitude;
          longitude = shopWithPincode.longitude;
          source = adminShop ? 'existing_admin_shop' : 'existing_agent_shop';
        } else {
          // Try geocoding using Nominatim
          // Add delay to respect rate limits (1 request per second)
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          try {
            const nominatimUrl = `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json&limit=1`;
            
            const response = await fetch(nominatimUrl, {
              headers: {
                'User-Agent': 'DigitalIndiaShopDirectory/1.0',
              },
            });

            if (response.ok) {
              const data = await response.json();
              if (data && data.length > 0) {
                latitude = parseFloat(data[0].lat);
                longitude = parseFloat(data[0].lon);
                source = 'nominatim';
              }
            }
          } catch (geocodeError) {
            console.error(`Geocoding error for pincode ${pincode}:`, geocodeError);
          }
        }

        // Update location if coordinates found
        if (latitude !== null && longitude !== null) {
          await Location.updateOne(
            { _id: location._id },
            {
              $set: {
                latitude,
                longitude,
              },
            }
          );
          updated++;
          results.push({
            id: location.id,
            status: 'success',
            latitude,
            longitude,
            source,
          });
        } else {
          failed++;
          results.push({
            id: location.id,
            status: 'failed',
            reason: 'Could not fetch coordinates',
          });
        }
      } catch (error: any) {
        console.error(`Error processing location ${location.id}:`, error);
        failed++;
        results.push({
          id: location.id,
          status: 'failed',
          reason: error.message || 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} locations, ${failed} failed`,
      updated,
      failed,
      total: locationsWithoutCoords.length,
      results,
    });
  } catch (error: any) {
    console.error('Bulk update coordinates error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

