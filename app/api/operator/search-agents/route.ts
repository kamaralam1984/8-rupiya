import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Agent from '@/lib/models/Agent';
import Operator from '@/lib/models/Operator';
import AgentOperatorRequest from '@/lib/models/AgentOperatorRequest';
import { verifyOperatorTokenAndGetOperator } from '@/lib/utils/operatorAuth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verify operator authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const operator = await verifyOperatorTokenAndGetOperator(token);

    if (!operator) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const operatorCode = searchParams.get('operatorCode');

    if (!operatorCode) {
      return NextResponse.json(
        { error: 'Operator code is required' },
        { status: 400 }
      );
    }

    // Verify operator code matches logged-in operator
    if (operator.operatorCode.toUpperCase() !== operatorCode.toUpperCase()) {
      return NextResponse.json(
        { error: 'Operator code does not match your account' },
        { status: 403 }
      );
    }

    // Find all agents that are either:
    // 1. Not assigned to any operator
    // 2. Already assigned to this operator
    const agents = await Agent.find({
      $or: [
        { operatorId: { $exists: false } },
        { operatorId: null },
        { operatorId: operator._id },
      ],
    })
      .select('-passwordHash')
      .populate('operatorId', 'name operatorCode')
      .sort({ createdAt: -1 })
      .lean();

    // Get pending requests for these agents
    const agentIds = agents.map((a: any) => a._id);
    const pendingRequests = await AgentOperatorRequest.find({
      agentId: { $in: agentIds },
      operatorId: operator._id,
      status: 'PENDING',
    }).lean();

    const requestMap = new Map();
    pendingRequests.forEach((req: any) => {
      requestMap.set(req.agentId.toString(), 'PENDING');
    });

    // Transform agents
    const transformedAgents = agents.map((agent: any) => ({
      ...agent,
      id: agent._id.toString(),
      _id: agent._id.toString(),
      operatorId: agent.operatorId?._id?.toString() || agent.operatorId?.toString(),
      operatorName: agent.operatorId?.name || null,
      requestStatus: requestMap.get(agent._id.toString()) || null,
    }));

    return NextResponse.json(
      {
        success: true,
        agents: transformedAgents,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Search agents error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

