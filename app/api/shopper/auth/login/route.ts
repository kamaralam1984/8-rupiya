import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shopper from '@/lib/models/Shopper';
import { generateShopperToken } from '@/lib/utils/shopperAuth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { identifier, password } = body; // identifier can be email or phone

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email/Phone and password are required' },
        { status: 400 }
      );
    }

    // Normalize identifier
    const normalizedIdentifier = identifier.toLowerCase().trim();
    
    // Find shopper by email or phone
    const shopper = await Shopper.findOne({
      $or: [
        { email: normalizedIdentifier },
        { phone: identifier.trim() },
      ],
    }).select('+passwordHash');

    if (!shopper) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!shopper.isActive) {
      return NextResponse.json(
        { error: 'Your account is inactive. Please contact support.' },
        { status: 403 }
      );
    }

    // Compare password
    const isPasswordValid = await shopper.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateShopperToken({
      shopperId: shopper._id.toString(),
      shopperCode: shopper.shopperCode,
      email: shopper.email,
    });

    // Return shopper data (without password)
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
        token,
        shopper: shopperData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Shopper login error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}



