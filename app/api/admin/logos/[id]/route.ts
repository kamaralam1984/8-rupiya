import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Logo from '@/lib/models/Logo';
import { authenticateRequest } from '@/lib/auth';
import mongoose from 'mongoose';

/**
 * PUT /api/admin/logos/[id]
 * Update a logo
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = authenticateRequest(request);
    if (!authResult.user || authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (!['admin', 'editor'].includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin or Editor access required' },
        { status: 403 }
      );
    }
    
    await connectDB();
    const { id } = await params;

    const body = await request.json();
    const logo = await Logo.findOneAndUpdate(
      { _id: id, createdBy: new mongoose.Types.ObjectId(authResult.user.userId) },
      body,
      { new: true }
    );

    if (!logo) {
      return NextResponse.json(
        { success: false, error: 'Logo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      logo,
    });
  } catch (error: any) {
    console.error('Error updating logo:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update logo' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/logos/[id]
 * Delete a logo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = authenticateRequest(request);
    if (!authResult.user || authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (!['admin', 'editor'].includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin or Editor access required' },
        { status: 403 }
      );
    }
    
    await connectDB();
    const { id } = await params;

    const logo = await Logo.findOneAndDelete({
      _id: id,
      createdBy: new mongoose.Types.ObjectId(authResult.user.userId),
    });

    if (!logo) {
      return NextResponse.json(
        { success: false, error: 'Logo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Logo deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting logo:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete logo' },
      { status: 500 }
    );
  }
}

