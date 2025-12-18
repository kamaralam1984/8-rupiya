import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentOperatorRequest from '@/lib/models/AgentOperatorRequest';
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
    const body = await request.json();
    const { rejectionReason } = body;
    const { user, error: authError } = authenticateRequest(request);
    
    if (!user || authError) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find the request
    const requestDoc = await AgentOperatorRequest.findById(id);

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

    // Update request status
    requestDoc.status = 'REJECTED';
    requestDoc.rejectionReason = rejectionReason || 'Request rejected by admin';
    requestDoc.approvedBy = user?.userId ? new mongoose.Types.ObjectId(user.userId) : undefined;
    await requestDoc.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Request rejected successfully',
        request: {
          id: requestDoc._id.toString(),
          status: requestDoc.status,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Reject request error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

