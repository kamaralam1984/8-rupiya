import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OTP from '@/models/OTP';
import User from '@/models/User';
import { generateToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Parse request body
    const body = await request.json();
    const { email, otp, type = 'signup', name, password, phone } = body;

    // Validation
    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find OTP
    const otpDoc = await OTP.findOne({
      email: normalizedEmail,
      otp,
      type,
      verified: false,
    });

    if (!otpDoc) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (new Date() > otpDoc.expiresAt) {
      await OTP.findByIdAndDelete(otpDoc._id);
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Mark OTP as verified
    otpDoc.verified = true;
    await otpDoc.save();

    let user;

    if (type === 'signup') {
      // Validate signup data
      if (!name || !password) {
        return NextResponse.json(
          { error: 'Name and password are required for signup' },
          { status: 400 }
        );
      }

      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long' },
          { status: 400 }
        );
      }

      // Normalize phone number first
      let normalizedPhone = phone?.trim() || '';
      if (normalizedPhone && !normalizedPhone.startsWith('+91')) {
        normalizedPhone = normalizedPhone.replace(/^\+?91\s*/, '').replace(/^\+/, '');
        normalizedPhone = '+91' + normalizedPhone.replace(/\D/g, '');
      } else if (normalizedPhone) {
        normalizedPhone = normalizedPhone.replace(/\D/g, '');
        if (normalizedPhone.startsWith('91')) {
          normalizedPhone = '+' + normalizedPhone;
        } else {
          normalizedPhone = '+91' + normalizedPhone;
        }
      }

      // Check if user already exists by email (double check)
      const existingUserByEmail = await User.findOne({ email: normalizedEmail });
      if (existingUserByEmail) {
        return NextResponse.json(
          { error: 'User already exists. Please login instead.' },
          { status: 409 }
        );
      }

      // Check if user already exists by phone
      if (normalizedPhone) {
        const existingUserByPhone = await User.findOne({ phone: normalizedPhone });
        if (existingUserByPhone) {
          return NextResponse.json(
            { error: 'User with this phone number already exists. Please login instead.' },
            { status: 409 }
          );
        }
      }

      // Create new user
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        phone: normalizedPhone,
        isEmailVerified: true, // Mark as verified since OTP is verified
      });
    } else if (type === 'login') {
      // Find user
      user = await User.findOne({ email: normalizedEmail });
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Update email verification status if not already verified
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        await user.save();
      }
    } else if (type === 'email-verification') {
      // For email verification, just verify OTP and return success
      // No user creation needed, just verification
      // Delete used OTP
      await OTP.findByIdAndDelete(otpDoc._id);
      
      return NextResponse.json(
        {
          success: true,
          message: 'Email verified successfully',
        },
        { status: 200 }
      );
    } else {
      // For password reset, just verify OTP (password reset logic can be added later)
      return NextResponse.json(
        { error: 'Password reset not implemented yet' },
        { status: 501 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Delete used OTP
    await OTP.findByIdAndDelete(otpDoc._id);

    // Return user data (without password)
    return NextResponse.json(
      {
        success: true,
        message: type === 'signup' ? 'Account created and verified successfully' : 'Login successful',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
        },
        token,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Verify OTP error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      );
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

