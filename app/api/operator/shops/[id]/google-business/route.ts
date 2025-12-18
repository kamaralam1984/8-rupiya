import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop';
import { verifyOperatorTokenAndGetOperator } from '@/lib/utils/operatorAuth';

/**
 * POST /api/operator/shops/[id]/google-business
 * This endpoint is disabled - Google Business management removed from operator panel
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { 
      success: false, 
      error: 'Google Business management has been removed from operator panel.',
      redirect: '/operator/dashboard'
    },
    { status: 410 } // 410 Gone
  );
}

/**
 * GET /api/operator/shops/[id]/google-business
 * This endpoint is disabled - Google Business management removed from operator panel
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { 
      success: false, 
      error: 'Google Business management has been removed from operator panel.',
      redirect: '/operator/dashboard'
    },
    { status: 410 } // 410 Gone
  );
}

