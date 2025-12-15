import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';
import { JWTPayload } from '@/lib/jwt';

// Ensure User model is imported correctly
if (!User) {
  console.error('User model is not imported correctly');
}

async function handler(request: NextRequest, user: JWTPayload) {
  try {
    // Validate userId first
    if (!user || !user.userId) {
      console.error('Invalid user payload:', user);
      return NextResponse.json(
        { error: 'Invalid user ID in token', details: 'User payload is missing or invalid' },
        { status: 400 }
      );
    }

    // Connect to database
    try {
      await connectDB();
    } catch (dbError: any) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          message: 'Unable to connect to the database. Please check your connection settings.',
          details: dbError?.message || 'Unknown database error'
        },
        { status: 503 }
      );
    }

    // Check if User model is available
    if (!User) {
      console.error('User model is not available');
      return NextResponse.json(
        { error: 'User model not available', details: 'Model import failed' },
        { status: 500 }
      );
    }

    // Find user by ID
    let userDoc;
    try {
      userDoc = await User.findById(user.userId).lean();
    } catch (queryError: any) {
      console.error('User query error:', queryError);
      console.error('Querying user ID:', user.userId);
      
      if (queryError.name === 'CastError' || queryError.message?.includes('Cast to ObjectId')) {
        return NextResponse.json(
          { 
            error: 'Invalid user ID format',
            details: queryError.message,
            userId: user.userId
          },
          { status: 400 }
        );
      }
      
      throw queryError; // Re-throw to be caught by outer catch
    }

    if (!userDoc) {
      console.warn('User not found for ID:', user.userId);
      return NextResponse.json(
        { error: 'User not found', userId: user.userId },
        { status: 404 }
      );
    }

    // Return user data (without password)
    return NextResponse.json(
      {
        success: true,
        user: {
          id: userDoc._id?.toString() || user.userId,
          name: userDoc.name || '',
          email: userDoc.email || '',
          phone: userDoc.phone || '',
          role: userDoc.role || 'user',
          isEmailVerified: userDoc.isEmailVerified || false,
          createdAt: userDoc.createdAt || new Date(),
          updatedAt: userDoc.updatedAt || new Date(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get user error:', error);
    console.error('Error type:', typeof error);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    console.error('User ID from token:', user?.userId);

    // Provide more specific error messages
    if (error?.message?.includes('MongoDB Connection Failed') || 
        error?.message?.includes('MongooseServerSelectionError') ||
        error?.message?.includes('MongoNetworkError') ||
        error?.name === 'MongooseServerSelectionError') {
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          message: 'Unable to connect to the database. Please check your connection settings.',
          details: error?.message || 'Database connection error'
        },
        { status: 503 }
      );
    }

    // Handle validation errors
    if (error?.name === 'CastError' || error?.message?.includes('Cast to ObjectId')) {
      return NextResponse.json(
        { 
          error: 'Invalid user ID format',
          details: error?.message || 'Invalid ID format',
          userId: user?.userId
        },
        { status: 400 }
      );
    }

    // Handle any other errors
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error?.message || 'Unknown error occurred',
        errorName: error?.name || 'Unknown',
        errorType: typeof error,
      },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(handler);


