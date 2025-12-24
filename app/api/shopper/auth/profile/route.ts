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
    const { name, email, phone } = body;

    // Find shopper
    const shopper = await Shopper.findById(payload.shopperId);
    if (!shopper) {
      return NextResponse.json(
        { success: false, error: 'Shopper not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it's already taken
    if (email && email.toLowerCase().trim() !== shopper.email) {
      const existingShopper = await Shopper.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: shopper._id },
      });

      if (existingShopper) {
        return NextResponse.json(
          { success: false, error: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    // Check if phone is being changed and if it's already taken
    if (phone && phone.trim() !== shopper.phone) {
      // Normalize phone number
      let normalizedPhone = phone.trim().replace(/^(\+91|91)/, '');
      
      if (normalizedPhone.length !== 10 || !/^[6-9]/.test(normalizedPhone)) {
        return NextResponse.json(
          { success: false, error: 'Please provide a valid 10-digit Indian phone number' },
          { status: 400 }
        );
      }

      const existingShopper = await Shopper.findOne({
        phone: normalizedPhone,
        _id: { $ne: shopper._id },
      });

      if (existingShopper) {
        return NextResponse.json(
          { success: false, error: 'Phone number already in use' },
          { status: 400 }
        );
      }

      shopper.phone = normalizedPhone;
    }

    // Update fields
    if (name) shopper.name = name.trim();
    if (email) shopper.email = email.toLowerCase().trim();

    await shopper.save();

    // Return updated shopper data
    const shopperData = {
      id: shopper._id.toString(),
      name: shopper.name,
      phone: shopper.phone,
      email: shopper.email,
      shopperCode: shopper.shopperCode,
      isActive: shopper.isActive,
      isVerified: shopper.isVerified,
      totalShops: shopper.totalShops,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully',
        shopper: shopperData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}


