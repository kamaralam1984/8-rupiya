import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Agent from '@/lib/models/Agent';
import { verifyAgentToken, getAgentTokenFromRequest } from '@/lib/utils/agentAuth';

export async function GET(request: NextRequest) {
  try {
    const token = getAgentTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyAgentToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    await connectDB();
    const agent = await Agent.findById(payload.agentId);

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    const agentData = {
      id: agent._id.toString(),
      name: agent.name,
      phone: agent.phone,
      email: agent.email,
      agentCode: agent.agentCode,
      totalShops: agent.totalShops,
      totalEarnings: agent.totalEarnings,
      createdAt: agent.createdAt,
    };

    return NextResponse.json(
      {
        success: true,
        agent: agentData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}


