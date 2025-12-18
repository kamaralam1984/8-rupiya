import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Shopper from '@/lib/models/Shopper';
import { requireAdminOnly } from '@/lib/auth';

export const POST = requireAdminOnly(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await connectDB();

    const { id } = await params;
    const shopper = await Shopper.findById(id);

    if (!shopper) {
      return NextResponse.json(
        { error: 'Shopper not found' },
        { status: 404 }
      );
    }

    // Approve shopper
    shopper.isVerified = true;
    shopper.isActive = true;
    await shopper.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Shopper approved successfully',
        shopper: {
          id: shopper._id.toString(),
          name: shopper.name,
          email: shopper.email,
          phone: shopper.phone,
          shopperCode: shopper.shopperCode,
          isVerified: shopper.isVerified,
          isActive: shopper.isActive,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error approving shopper:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

