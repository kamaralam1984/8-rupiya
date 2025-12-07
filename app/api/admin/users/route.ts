import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAdminOnly } from '@/lib/auth';

/**
 * GET /api/admin/users
 * Get all users (only admin can access)
 */
export const GET = requireAdminOnly(async (request: NextRequest) => {
  try {
    await connectDB();

    const users = await User.find({}).select('-password').sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        users: users.map((user) => ({
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/users
 * Create a new user (only admin can access)
 */
export const POST = requireAdminOnly(async (request: NextRequest) => {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, phone, password, role } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (!['user', 'admin', 'editor', 'operator'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be user, admin, editor, or operator' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone ? phone.trim() : undefined;

    // Validate phone format if provided
    if (normalizedPhone && normalizedPhone !== '') {
      // Remove spaces and validate Indian phone format
      const cleanPhone = normalizedPhone.replace(/\s+/g, '');
      const phoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
      if (!phoneRegex.test(cleanPhone)) {
        return NextResponse.json(
          { error: 'Invalid phone number format. Please use Indian format: +91XXXXXXXXXX or 0XXXXXXXXXX' },
          { status: 400 }
        );
      }
    }

    // Check if user already exists
    const existingUserQuery: any = { email: normalizedEmail };
    if (normalizedPhone && normalizedPhone !== '') {
      existingUserQuery.$or = [
        { email: normalizedEmail },
        { phone: normalizedPhone }
      ];
    }
    
    const existingUser = await User.findOne(existingUserQuery);

    if (existingUser) {
      const conflictField = existingUser.email === normalizedEmail ? 'email' : 'phone';
      return NextResponse.json(
        { error: `User with this ${conflictField} already exists` },
        { status: 400 }
      );
    }

    // Create new user
    const user = new User({
      name,
      email: normalizedEmail,
      phone: normalizedPhone || undefined,
      password,
      role: role || 'user',
    });

    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating user:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
    });

    // Handle duplicate key error (MongoDB unique constraint)
    if (error.code === 11000) {
      const field = error.keyPattern?.email ? 'email' : 'phone';
      return NextResponse.json(
        { error: `User with this ${field} already exists` },
        { status: 400 }
      );
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors || {})[0] as any;
      return NextResponse.json(
        { error: firstError?.message || 'Validation error' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Failed to create user. Please try again.',
      },
      { status: 500 }
    );
  }
});
