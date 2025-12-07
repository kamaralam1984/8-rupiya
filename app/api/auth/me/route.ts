import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';
import { JWTPayload } from '@/lib/jwt';

async function handler(request: NextRequest, user: JWTPayload) {
  try {
    // Connect to database
    await connectDB();

    // Find user by ID
    const userDoc = await User.findById(user.userId);

    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user data (without password)
    return NextResponse.json(
      {
        success: true,
        user: {
          id: userDoc._id.toString(),
          name: userDoc.name,
          email: userDoc.email,
          phone: userDoc.phone,
          role: userDoc.role,
          isEmailVerified: userDoc.isEmailVerified,
          createdAt: userDoc.createdAt,
          updatedAt: userDoc.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get user error:', error);

    // Provide more specific error messages
    if (error.message?.includes('MongoDB Connection Failed') || error.message?.includes('MongooseServerSelectionError')) {
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          message: 'Unable to connect to the database. Please check your connection settings.',
          details: error.message 
        },
        { status: 503 } // Service Unavailable
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(handler);


