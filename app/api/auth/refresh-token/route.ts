import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken, verifyToken, extractTokenFromHeader } from '@/lib/jwt';

/**
 * Token refresh endpoint - Refreshes JWT token with updated user data from database
 * This is useful when user's role or other data changes in database
 */
export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const oldToken = extractTokenFromHeader(authHeader);

    if (!oldToken) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    // Verify old token
    let oldPayload;
    try {
      oldPayload = verifyToken(oldToken);
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get latest user data from database
    const user = await User.findById(oldPayload.userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate new token with updated user data
    const newToken = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role, // This will have the updated role from database
    });

    // Return updated user data and new token
    return NextResponse.json(
      {
        success: true,
        message: 'Token refreshed successfully',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
        },
        token: newToken,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to refresh token. Please logout and login again.',
      },
      { status: 500 }
    );
  }
}








