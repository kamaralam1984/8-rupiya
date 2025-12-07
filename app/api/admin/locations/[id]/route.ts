import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import Location from '@/models/Location';

// GET - Fetch single location
export const GET = requireAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();
    const { id } = await params;

    const location = await Location.findById(id).lean();

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, location }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location', details: error.message },
      { status: 500 }
    );
  }
});

// PUT - Update location
export const PUT = requireAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();
    const { id } = await params;

    const body = await request.json();
    const {
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

    const updateData: any = {};
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (country !== undefined) updateData.country = country;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (pincode !== undefined) updateData.pincode = pincode ? parseInt(pincode) : undefined;
    if (district !== undefined) updateData.district = district;
    if (area !== undefined) updateData.area = area;
    if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : undefined;
    if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : undefined;
    if (isActive !== undefined) updateData.isActive = isActive;

    const location = await Location.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, location },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { error: 'Failed to update location', details: error.message },
      { status: 500 }
    );
  }
});

// DELETE - Delete location
export const DELETE = requireAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();
    const { id } = await params;

    const location = await Location.findByIdAndDelete(id);

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Location deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { error: 'Failed to delete location', details: error.message },
      { status: 500 }
    );
  }
});

