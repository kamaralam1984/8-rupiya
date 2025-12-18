import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop';
import { verifyOperatorTokenAndGetOperator } from '@/lib/utils/operatorAuth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // This endpoint is disabled - operators should use /api/operator/agents/[agentId]/shops instead
  return NextResponse.json(
    { 
      success: false, 
      error: 'This endpoint has been removed. Please use agent shops endpoint instead.',
      redirect: '/operator/agents'
    },
    { status: 410 } // 410 Gone - indicates resource is no longer available
  );
}

