import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Agent from '@/lib/models/Agent';
import { generateAgentToken } from '@/lib/utils/agentAuth';

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
    
    // Find agent by email or phone
    const agent = await Agent.findOne({
      $or: [
        { email: normalizedIdentifier },
        { phone: identifier.trim() },
      ],
    }).select('+passwordHash'); // Include password hash

    if (!agent) {
      console.error('Agent not found for identifier:', identifier);
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
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

