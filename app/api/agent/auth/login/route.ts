import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Agent from '@/lib/models/Agent';
import { generateAgentToken } from '@/lib/utils/agentAuth';
import { withSecurity } from '@/lib/security/api-security';
import { isValidEmail, isValidPhone } from '@/lib/security/validation';

async function agentLoginHandler(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { identifier, password } = body; // identifier can be email or phone

    // Enhanced validation
    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email/Phone and password are required' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6 || password.length > 128) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Normalize identifier
    const normalizedIdentifier = identifier.toLowerCase().trim();
    
    // Check if identifier looks like an email (has @) and validate format
    const isEmailLike = normalizedIdentifier.includes('@');
    if (isEmailLike && !isValidEmail(normalizedIdentifier)) {
      // Don't reveal if it's an invalid email format for security
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Check if identifier looks like a phone and validate format
    const isPhoneLike = /^[\d\s\+\-()]+$/.test(identifier.trim());
    if (isPhoneLike && !isValidPhone(identifier.trim())) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Find agent by email or phone
    const agent = await Agent.findOne({
      $or: [
        { email: normalizedIdentifier },
        { phone: identifier.trim() },
      ],
    }).select('+passwordHash'); // Include password hash

    if (!agent) {
      // Don't log the identifier for security
      console.error('Agent not found');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Compare password
    const isPasswordValid = await agent.comparePassword(password);
    if (!isPasswordValid) {
      console.error('Password mismatch for agent:', agent.email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateAgentToken({
      agentId: agent._id.toString(),
      agentCode: agent.agentCode,
      email: agent.email,
    });

    // Return agent data (without password)
    const agentData = {
      id: agent._id.toString(),
      name: agent.name,
      phone: agent.phone,
      email: agent.email,
      agentCode: agent.agentCode,
      agentPanelText: agent.agentPanelText,
      agentPanelTextColor: agent.agentPanelTextColor,
      totalShops: agent.totalShops,
      totalEarnings: agent.totalEarnings,
    };

    return NextResponse.json(
      {
        success: true,
        token,
        agent: agentData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Agent login error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

// Export with security wrapper - reasonable rate limiting for auth routes
export const POST = withSecurity(agentLoginHandler, {
  rateLimit: {
    maxRequests: 10, // 10 login attempts per 15 minutes (more reasonable)
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  maxRequestSize: 1024, // 1KB max for login requests
});

