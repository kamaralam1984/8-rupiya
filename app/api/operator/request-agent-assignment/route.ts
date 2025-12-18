import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Agent from '@/lib/models/Agent';
import Operator from '@/lib/models/Operator';
import AgentOperatorRequest from '@/lib/models/AgentOperatorRequest';
import { verifyOperatorTokenAndGetOperator } from '@/lib/utils/operatorAuth';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { agentId, operatorCode } = body;

    if (!agentId || !operatorCode) {
      return NextResponse.json(
        { error: 'Agent ID and operator code are required' },
        { status: 400 }
      );
    }

    // Verify operator code matches
    if (operator.operatorCode.toUpperCase() !== operatorCode.toUpperCase()) {
      return NextResponse.json(
        { error: 'Operator code does not match your account' },
        { status: 403 }
      );
    }

    // Find agent
    const agent = await Agent.findById(agentId);
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Check if agent is already assigned to this operator
    if (agent.operatorId && agent.operatorId.toString() === operator._id.toString()) {
      return NextResponse.json(
        { error: 'Agent is already assigned to you' },
        { status: 400 }
      );
    }

    // Check if there's already a pending request for this agent-operator combination
    const existingRequest = await AgentOperatorRequest.findOne({
      agentId: agent._id,
      operatorId: operator._id,
      status: 'PENDING',
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Request already pending for this agent. Please wait for admin approval.' },
        { status: 400 }
      );
    }

    // Create pending request (admin approval required)
    const newRequest = await AgentOperatorRequest.create({
      agentId: agent._id,
      operatorId: operator._id,
      status: 'PENDING',
      requestedBy: operator._id,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Request sent successfully. Admin will review and approve it.',
        requestId: newRequest._id.toString(),
        agent: {
          id: agent._id.toString(),
          name: agent.name,
          agentCode: agent.agentCode,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Request assignment error:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Request already pending for this agent' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

