import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shopper from '@/lib/models/Shopper';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, phone, email, password } = body;

    // Validation
    if (!name || !phone || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Normalize phone number (remove +91, 91 prefix if present)
    let normalizedPhone = phone.trim().replace(/^(\+91|91)/, '');
    
    // Validate phone number
    if (normalizedPhone.length !== 10 || !/^[6-9]/.test(normalizedPhone)) {
      return NextResponse.json(
        { error: 'Please provide a valid 10-digit Indian phone number starting with 6-9' },
        { status: 400 }
      );
    }
    
    // Check if shopper already exists
    const existingShopper = await Shopper.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { phone: normalizedPhone },
      ],
    });

    if (existingShopper) {
      return NextResponse.json(
        { error: 'Shopper with this email or phone already exists' },
        { status: 400 }
      );
    }

    // Generate unique shopper code
    let shopperCode = '';
    let counter = 1;
    let codeExists = true;
    
    while (codeExists && counter < 1000) {
      shopperCode = `SH${String(counter).padStart(4, '0')}`;
      const existing = await Shopper.findOne({ shopperCode });
      if (!existing) {
        codeExists = false;
      } else {
        counter++;
      }
    }

    if (counter >= 1000) {
      return NextResponse.json(
        { error: 'Failed to generate unique shopper code. Please try again.' },
        { status: 500 }
      );
    }

    // Create shopper
    const shopper = await Shopper.create({
      name: name.trim(),
      phone: normalizedPhone,
      email: email.toLowerCase().trim(),
      passwordHash: password, // Will be hashed by pre-save hook
      shopperCode: shopperCode, // Set code explicitly
      isActive: true,
      isVerified: false,
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
        message: 'Signup successful! Please login to continue.',
        shopper: shopperData,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Shopper signup error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
    });
    
    if (error.code === 11000) {
      // MongoDB duplicate key error
      const field = error.keyPattern?.email ? 'email' : error.keyPattern?.phone ? 'phone' : 'unknown';
      return NextResponse.json(
        { error: `Shopper with this ${field} already exists` },
        { status: 400 }
      );
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors || {}).map((err: any) => err.message);
      return NextResponse.json(
        { error: validationErrors.join(', ') || 'Validation error' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message || 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

