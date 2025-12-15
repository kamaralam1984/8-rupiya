import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import Offer from '@/models/Offer';

// GET, PUT, DELETE for single offer
export const GET = requireAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();
    const { id } = await params;
    const offer = await Offer.findById(id).populate('businessId', 'name slug').lean();
    if (!offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    return NextResponse.json({ success: true, offer }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch offer', details: error.message }, { status: 500 });
  }
});

export const PUT = requireAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { 
      headline, 
      description, 
      shopId, 
      shopName, 
      shopLogo, 
      imageUrl, 
      discount, 
      cta, 
      sponsored, 
      businessId, 
      isActive, 
      startDate, 
      endDate, 
      expiresAt,
      linkUrl,
      position
    } = body;

    const updateData: any = {};
    if (headline !== undefined) updateData.headline = headline;
    if (description !== undefined) updateData.description = description;
    if (shopId !== undefined) updateData.shopId = shopId;
    if (shopName !== undefined) updateData.shopName = shopName;
    if (shopLogo !== undefined) updateData.shopLogo = shopLogo;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (discount !== undefined) updateData.discount = discount;
    if (cta !== undefined) updateData.cta = cta;
    if (sponsored !== undefined) updateData.sponsored = sponsored;
    if (businessId !== undefined) updateData.businessId = businessId || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (linkUrl !== undefined) updateData.linkUrl = linkUrl;
    if (position !== undefined) updateData.position = position;

    const offer = await Offer.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('businessId', 'name slug');

    if (!offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    return NextResponse.json({ success: true, offer }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update offer', details: error.message }, { status: 500 });
  }
});

export const DELETE = requireAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();
    const { id } = await params;
    const offer = await Offer.findByIdAndDelete(id);
    if (!offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Offer deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete offer', details: error.message }, { status: 500 });
  }
});

