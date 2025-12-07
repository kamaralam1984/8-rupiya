import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAdminOnly } from '@/lib/auth';
import mongoose from 'mongoose';

/**
 * GET /api/admin/users/[id]
 * Get a specific user by ID (only admin can access)
 */
export const GET = requireAdminOnly(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const user = await User.findById(id).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/admin/users/[id]
 * Update a user (only admin can access)
 */
export const PUT = requireAdminOnly(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, email, phone, password, role } = body;

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validation
    if (role && !['user', 'admin', 'editor', 'operator'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be user, admin, editor, or operator' },
        { status: 400 }
      );
    }

    if (password && password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Update fields
    if (name) user.name = name;
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      // Check if email is already taken by another user
      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: id },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email is already taken by another user' },
          { status: 400 }
        );
      }
      user.email = normalizedEmail;
    }
    if (phone !== undefined) {
      if (phone && phone.trim() !== '') {
        const normalizedPhone = phone.trim();
        // Validate phone format
        const cleanPhone = normalizedPhone.replace(/\s+/g, '');
        const phoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
        if (!phoneRegex.test(cleanPhone)) {
          return NextResponse.json(
            { error: 'Invalid phone number format. Please use Indian format: +91XXXXXXXXXX or 0XXXXXXXXXX' },
            { status: 400 }
          );
        }
        
        // Check if phone is already taken by another user
        const existingUser = await User.findOne({
          phone: normalizedPhone,
          _id: { $ne: id },
        });
        if (existingUser) {
          return NextResponse.json(
            { error: 'Phone is already taken by another user' },
            { status: 400 }
          );
        }
        user.phone = normalizedPhone;
      } else {
        user.phone = undefined;
      }
    }
    if (role) user.role = role;
    if (password) {
      // Password will be hashed automatically by the pre-save hook
      user.password = password;
    }

    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: 'User updated successfully',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating user:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Email or phone is already taken by another user' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/admin/users/[id]
 * Delete a user (only admin can access)
 */
export const DELETE = requireAdminOnly(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: 'User deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});
