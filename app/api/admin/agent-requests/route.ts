import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentOperatorRequest from '@/lib/models/AgentOperatorRequest';
import Agent from '@/lib/models/Agent';
import Operator from '@/lib/models/Operator';
import { requireAdmin } from '@/lib/auth';

// GET /api/admin/agent-requests - Get all pending requests
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';

    // Get requests with populated agent and operator data
    const requests = await AgentOperatorRequest.find({ status })
      .populate('agentId', 'name email phone agentCode operatorId')
      .populate('operatorId', 'name operatorCode email phone')
      .populate('requestedBy', 'name operatorCode')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Transform requests
    const transformedRequests = requests.map((req: any) => ({
      id: req._id.toString(),
      agent: {
        id: req.agentId._id.toString(),
        name: req.agentId.name,
        email: req.agentId.email,
        phone: req.agentId.phone,
        agentCode: req.agentId.agentCode,
        currentOperatorId: req.agentId.operatorId?.toString() || null,
      },
      operator: {
        id: req.operatorId._id.toString(),
        name: req.operatorId.name,
        operatorCode: req.operatorId.operatorCode,
        email: req.operatorId.email,
        phone: req.operatorId.phone,
      },
      requestedBy: {
        id: req.requestedBy._id.toString(),
        name: req.requestedBy.name,
        operatorCode: req.requestedBy.operatorCode,
      },
      approvedBy: req.approvedBy ? {
        id: req.approvedBy._id.toString(),
        name: req.approvedBy.name,
        email: req.approvedBy.email,
      } : null,
      status: req.status,
      rejectionReason: req.rejectionReason,
      createdAt: req.createdAt,
      updatedAt: req.updatedAt,
    }));

    return NextResponse.json(
      {
        success: true,
        requests: transformedRequests,
        count: transformedRequests.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get agent requests error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});







