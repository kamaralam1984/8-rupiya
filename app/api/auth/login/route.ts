import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Agent from '@/lib/models/Agent';
import { generateToken } from '@/lib/jwt';
import { generateAgentToken } from '@/lib/utils/agentAuth';
import { withSecurity } from '@/lib/security/api-security';
import { isValidEmail } from '@/lib/security/validation';

/**
 * Login endpoint - Direct login with email and password
 * Returns JWT token on successful authentication
 * Supports role-based login: user, admin, editor, operator, agent
 */
async function loginHandler(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Parse request body
    const body = await request.json();
    const { email, password, role = 'user' } = body;

    // Enhanced validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6 || password.length > 128) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Handle agent login separately
    if (role === 'agent') {
      // Find agent by email or phone
      const agent = await Agent.findOne({
        $or: [
          { email: normalizedEmail },
          { phone: email.trim() },
        ],
      }).select('+passwordHash');

      if (!agent) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Verify password
      const isPasswordValid = await agent.comparePassword(password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Generate agent token
      const token = generateAgentToken({
        agentId: agent._id.toString(),
        agentCode: agent.agentCode,
        email: agent.email,
      });

      // Return agent data
      return NextResponse.json(
        {
          success: true,
          message: 'Login successful',
          user: {
            id: agent._id.toString(),
            name: agent.name,
            email: agent.email,
            phone: agent.phone,
            role: 'agent',
            agentCode: agent.agentCode,
            agentPanelText: agent.agentPanelText,
            agentPanelTextColor: agent.agentPanelTextColor,
            totalShops: agent.totalShops,
            totalEarnings: agent.totalEarnings,
          },
          token,
          isAgent: true,
        },
        { status: 200 }
      );
    }

    // Block operators from using admin login - they must use operator login API
    if (role === 'operator') {
      return NextResponse.json(
        { error: 'Operators must use the Operators Panel login page', redirect: '/operator/login' },
        { status: 403 }
      );
    }

    // Handle user/admin/editor login (operators are NOT allowed)
    // Find user and include password field, filter by role if specified
    const userQuery: any = { 
      email: normalizedEmail
    };
    
    // Build role filter: exclude operators, and match specific role if provided
    if (role === 'user') {
      // For 'user' role, find any user that's not an operator
      userQuery.role = { $ne: 'operator' };
    } else {
      // For admin/editor, match exact role (which already excludes operators)
      userQuery.role = role;
    }

    const user = await User.findOne(userQuery).select('+password');

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify role matches (if role was specified and not 'user')
    // Also ensure user is not an operator
    if (user.role === 'operator') {
      return NextResponse.json(
        { error: 'Operators must use the Operators Panel login page', redirect: '/operator/login' },
        { status: 403 }
      );
    }

    if (role !== 'user' && user.role !== role) {
      return NextResponse.json(
        { error: `Invalid credentials for ${role} role` },
        { status: 403 }
      );
    }

    // Check if user has a password set
    if (!user.password) {
      console.error('User found but password field is missing:', user.email);
      return NextResponse.json(
        { error: 'Account setup incomplete. Please contact administrator.' },
        { status: 500 }
      );
    }

    // Verify password
    let isPasswordValid = false;
    try {
      isPasswordValid = await user.comparePassword(password);
    } catch (compareError: any) {
      console.error('Password comparison error:', compareError);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Return user data (without password) and token
    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
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
        isAgent: false,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);

    // Provide user-friendly error messages
    if (error.message?.includes('MongoDB Connection Failed') || error.name === 'MongooseServerSelectionError') {
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          message: 'Unable to connect to the database. Please check your connection settings.',
          details: error.message
        },
        { status: 503 } // Service Unavailable
      );
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Handle JWT errors
    if (error.message?.includes('JWT') || error.message?.includes('token')) {
      return NextResponse.json(
        { 
          error: 'Authentication error',
          message: 'Failed to generate authentication token. Please try again.'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Export with security wrapper - reasonable rate limiting for auth routes
export const POST = withSecurity(loginHandler, {
  rateLimit: {
    maxRequests: 10, // 10 login attempts per 15 minutes (more reasonable)
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  maxRequestSize: 1024, // 1KB max for login requests
});

