import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop';
import { authenticateRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = authenticateRequest(request);
    if (!auth.user || auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is an agent
    if (auth.user.role !== 'agent') {
      return NextResponse.json(
        { success: false, message: 'Agent access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;
    const shop = await AgentShop.findOne({
      _id: id,
      agentId: (auth.user as any).agentId || auth.user.userId,
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, message: 'Shop not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      shop,
    });
  } catch (error: any) {
    console.error('Get shop error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
