import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentOperatorRequest from '@/lib/models/AgentOperatorRequest';
import Agent from '@/lib/models/Agent';
import { requireAdmin } from '@/lib/auth';
import { authenticateRequest } from '@/lib/auth';
import mongoose from 'mongoose';

export const POST = requireAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await connectDB();

    const { id } = await params;
    const { user, error: authError } = authenticateRequest(request);
    
    if (!user || authError) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find the request
    const requestDoc = await AgentOperatorRequest.findById(id)
      .populate('agentId')
      .populate('operatorId');

    if (!requestDoc) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    if (requestDoc.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Request is already ${requestDoc.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Update agent's operatorId
    const agent = await Agent.findById(requestDoc.agentId);
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Assign agent to operator
    agent.operatorId = requestDoc.operatorId;
    await agent.save();

    // Update request status
    requestDoc.status = 'APPROVED';
    requestDoc.approvedBy = user?.userId ? new mongoose.Types.ObjectId(user.userId) : undefined;
    await requestDoc.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Request approved successfully',
        request: {
          id: requestDoc._id.toString(),
          status: requestDoc.status,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Approve request error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

