import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GoogleBusinessProfile from '@/lib/models/GoogleBusinessProfile';
import { requireAdmin } from '@/lib/auth';

/**
 * GET /api/admin/google-business/[id]
 * Get a single Google Business Profile
 */
export const GET = requireAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await connectDB();

    const { id } = await params;
    const profile = await GoogleBusinessProfile.findById(id).lean();

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error('Error fetching Google Business Profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: error.message },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/admin/google-business/[id]
 * Update Google Business Profile
 */
export const PUT = requireAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const {
      googleBusinessId,
      googleBusinessUrl,
      verificationStatus,
      verificationMethod,
      notes,
    } = body;

    const updateData: any = {};
    if (googleBusinessId !== undefined) updateData.googleBusinessId = googleBusinessId;
    if (googleBusinessUrl !== undefined) updateData.googleBusinessUrl = googleBusinessUrl;
    if (verificationStatus !== undefined) updateData.verificationStatus = verificationStatus;
    if (verificationMethod !== undefined) updateData.verificationMethod = verificationMethod;
    if (notes !== undefined) updateData.notes = notes;

    const profile = await GoogleBusinessProfile.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error('Error updating Google Business Profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', details: error.message },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/admin/google-business/[id]
 * Delete Google Business Profile
 */
export const DELETE = requireAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await connectDB();

    const { id } = await params;
    const profile = await GoogleBusinessProfile.findByIdAndDelete(id);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting Google Business Profile:', error);
    return NextResponse.json(
      { error: 'Failed to delete profile', details: error.message },
      { status: 500 }
    );
  }
});


