import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shopper from '@/lib/models/Shopper';
import { verifyShopperToken, getShopperTokenFromRequest } from '@/lib/utils/shopperAuth';

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const token = getShopperTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyShopperToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Find shopper with password hash
    const shopper = await Shopper.findById(payload.shopperId).select('+passwordHash');
    if (!shopper) {
      return NextResponse.json(
        { success: false, error: 'Shopper not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isPasswordValid = await shopper.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Update password (will be hashed by pre-save hook)
    shopper.passwordHash = newPassword;
    await shopper.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Password changed successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}


