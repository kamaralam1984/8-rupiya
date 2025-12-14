import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import Location from '@/models/Location';
import fs from 'fs';
import path from 'path';

// POST - Import locations from JSON file
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    // Read the JSON file
    const filePath = path.join(process.cwd(), 'app', 'patna_full_locations.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const locationsData = JSON.parse(fileContent);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    // Process each location
    for (const loc of locationsData) {
      try {
        const locationName = loc.Location || loc.location || '';
        const pincode = loc.Pincode || loc.pincode;
        const state = loc.State || loc.state || 'Bihar';
        const district = loc.District || loc.district || 'Patna';

        if (!locationName || !pincode) {
          skipped++;
          continue;
        }

        // Generate unique ID
        const locationId = locationName
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_.]+/g, '-')
          .replace(/^-+|-+$/g, '') + `-${pincode}`;

        // Check if location already exists
        const existing = await Location.findOne({ id: locationId });
        if (existing) {
          skipped++;
          continue;
        }

        // Create location
        await Location.create({
          id: locationId,
          city: 'Patna',
          state: state,
          country: 'India',
          displayName: locationName,
          pincode: parseInt(pincode),
          district: district,
          area: locationName,
          isActive: true,
        });

        imported++;
      } catch (error: any) {
        console.error(`Error importing location: ${loc.Location}`, error.message);
        errors++;
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Locations imported successfully',
        stats: {
          imported,
          skipped,
          errors,
          total: locationsData.length,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error importing locations:', error);
    return NextResponse.json(
      { error: 'Failed to import locations', details: error.message },
      { status: 500 }
    );
  }
});

