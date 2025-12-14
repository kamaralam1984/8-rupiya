import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import Location from '@/models/Location';

// GET - Fetch all locations
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city');
    const isActive = searchParams.get('isActive');

    const query: any = {};
    if (city) query.city = new RegExp(city, 'i');
    if (isActive !== null) query.isActive = isActive === 'true';

    const locations = await Location.find(query)
      .sort({ city: 1, displayName: 1 })
      .lean();

    return NextResponse.json({ success: true, locations }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations', details: error.message },
      { status: 500 }
    );
  }
});

// POST - Create new location
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const body = await request.json();
    const {
      id,
      city,
      state,
      country,
      displayName,
      pincode,
      district,
      area,
      latitude,
      longitude,
      isActive,
    } = body;

    // Validation
    if (!id || !city || !displayName) {
      return NextResponse.json(
        { error: 'ID, city, and displayName are required' },
        { status: 400 }
      );
    }

    // Check if location with same ID exists
    const existing = await Location.findOne({ id });
    if (existing) {
      return NextResponse.json(
        { error: 'Location with this ID already exists' },
        { status: 409 }
      );
    }

    const location = await Location.create({
      id,
      city,
      state,
      country: country || 'India',
      displayName,
      pincode: pincode ? parseInt(pincode) : undefined,
      district,
      area,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json(
      { success: true, location },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { error: 'Failed to create location', details: error.message },
      { status: 500 }
    );
  }
});

