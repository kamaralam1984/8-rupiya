import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop';
import { verifyOperatorTokenAndGetOperator } from '@/lib/utils/operatorAuth';

/**
 * POST /api/operator/shops/[id]/google-business
 * Create Google Business Profile account for a shop
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Verify operator authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const operator = await verifyOperatorTokenAndGetOperator(token);
    if (!operator) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Find the shop
    const shop = await AgentShop.findById(id);
    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Check if shop is paid
    if (shop.paymentStatus !== 'PAID') {
      return NextResponse.json(
        { success: false, error: 'Only paid shops can have Google Business accounts' },
        { status: 400 }
      );
    }

    // Check if Google Business account already exists
    if (shop.googleBusinessAccount?.status === 'CREATED' || shop.googleBusinessAccount?.status === 'VERIFIED') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Google Business account already created',
          googleBusinessAccount: shop.googleBusinessAccount
        },
        { status: 400 }
      );
    }

    // Update status to PENDING
    shop.googleBusinessAccount = {
      status: 'PENDING',
      createdAt: new Date(),
      lastUpdated: new Date(),
    };
    await shop.save();

    // TODO: Integrate with Google Business Profile API
    // For now, we'll simulate the creation process
    // In production, you would:
    // 1. Authenticate with Google OAuth
    // 2. Create a new location using Google Business Profile API
    // 3. Store the location ID and account ID
    // 4. Handle verification process

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock successful creation (replace with actual API call)
    const mockLocationId = `LOC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mockAccountId = `ACC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Update shop with Google Business account details
    shop.googleBusinessAccount = {
      accountId: mockAccountId,
      locationId: mockLocationId,
      status: 'CREATED',
      createdAt: new Date(),
      lastUpdated: new Date(),
      verificationUrl: `https://business.google.com/locations/${mockLocationId}/verify`,
    };
    await shop.save();

    return NextResponse.json({
      success: true,
      message: 'Google Business account created successfully',
      googleBusinessAccount: shop.googleBusinessAccount,
      nextSteps: [
        'Verify your business location using the verification URL',
        'Complete your business profile information',
        'Add business hours and photos',
      ],
    });
  } catch (error: any) {
    console.error('Error creating Google Business account:', error);
    
    // Update shop status to FAILED
    try {
      const { id } = await params;
      const shop = await AgentShop.findById(id);
      if (shop) {
        shop.googleBusinessAccount = {
          ...shop.googleBusinessAccount,
          status: 'FAILED',
          error: error.message || 'Failed to create Google Business account',
          lastUpdated: new Date(),
        };
        await shop.save();
      }
    } catch (updateError) {
      console.error('Error updating shop status:', updateError);
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create Google Business account',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/operator/shops/[id]/google-business
 * Get Google Business account status for a shop
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Verify operator authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const operator = await verifyOperatorTokenAndGetOperator(token);
    if (!operator) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Find the shop
    const shop = await AgentShop.findById(id).select('googleBusinessAccount');
    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      googleBusinessAccount: shop.googleBusinessAccount || {
        status: 'NOT_CREATED',
      },
    });
  } catch (error: any) {
    console.error('Error fetching Google Business account:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch Google Business account',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

