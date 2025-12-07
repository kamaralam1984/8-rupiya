import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import Business from '@/models/Business';

// PATCH - Toggle featured status
export const PATCH = requireAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();
    const { id } = await params;

    const business = await Business.findById(id);

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    business.isFeatured = !business.isFeatured;
    await business.save();

    return NextResponse.json(
      { success: true, business, message: `Business ${business.isFeatured ? 'featured' : 'unfeatured'}` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error toggling featured status:', error);
    return NextResponse.json(
      { error: 'Failed to toggle featured status', details: error.message },
      { status: 500 }
    );
  }
});

