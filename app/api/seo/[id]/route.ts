import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SEO from '@/lib/models/SEO';
import mongoose from 'mongoose';

// PUT /api/seo/[id] - Update SEO entry (e.g., link shopId after shop creation)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { 
      shopId, shopUrl, ranking,
      metaTitle, metaDescription, metaKeywords, ogImage, ogTitle, ogDescription,
      facebookUrl, instagramUrl, twitterUrl, linkedinUrl, youtubeUrl, whatsappNumber,
      googleBusinessId, googleMapsUrl,
      enableSocialSharing, socialSharingMessage, enableWhatsAppSharing, enableFacebookSharing,
      enableTwitterSharing, enableLinkedInSharing,
      googleAnalyticsId, facebookPixelId
    } = body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid SEO entry ID' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {};
    if (shopId !== undefined) {
      if (shopId && !mongoose.Types.ObjectId.isValid(shopId)) {
        return NextResponse.json(
          { error: 'Invalid shop ID' },
          { status: 400 }
        );
      }
      updateData.shopId = shopId ? new mongoose.Types.ObjectId(shopId) : null;
    }
    if (shopUrl !== undefined) updateData.shopUrl = shopUrl?.trim() || null;
    if (ranking !== undefined) {
      if (ranking < 1) {
        return NextResponse.json(
          { error: 'Ranking must be at least 1' },
          { status: 400 }
        );
      }
      updateData.ranking = ranking;
    }
    // Enhanced SEO Fields
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle?.trim() || null;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription?.trim() || null;
    if (metaKeywords !== undefined) updateData.metaKeywords = Array.isArray(metaKeywords) ? metaKeywords.map(k => k.trim()).filter(Boolean) : [];
    if (ogImage !== undefined) updateData.ogImage = ogImage?.trim() || null;
    if (ogTitle !== undefined) updateData.ogTitle = ogTitle?.trim() || null;
    if (ogDescription !== undefined) updateData.ogDescription = ogDescription?.trim() || null;
    // Social Media Links
    if (facebookUrl !== undefined) updateData.facebookUrl = facebookUrl?.trim() || null;
    if (instagramUrl !== undefined) updateData.instagramUrl = instagramUrl?.trim() || null;
    if (twitterUrl !== undefined) updateData.twitterUrl = twitterUrl?.trim() || null;
    if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl?.trim() || null;
    if (youtubeUrl !== undefined) updateData.youtubeUrl = youtubeUrl?.trim() || null;
    if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber?.trim() || null;
    // Google Business
    if (googleBusinessId !== undefined) updateData.googleBusinessId = googleBusinessId?.trim() || null;
    if (googleMapsUrl !== undefined) updateData.googleMapsUrl = googleMapsUrl?.trim() || null;
    // Social Sharing Settings
    if (enableSocialSharing !== undefined) updateData.enableSocialSharing = enableSocialSharing;
    if (socialSharingMessage !== undefined) updateData.socialSharingMessage = socialSharingMessage?.trim() || null;
    if (enableWhatsAppSharing !== undefined) updateData.enableWhatsAppSharing = enableWhatsAppSharing;
    if (enableFacebookSharing !== undefined) updateData.enableFacebookSharing = enableFacebookSharing;
    if (enableTwitterSharing !== undefined) updateData.enableTwitterSharing = enableTwitterSharing;
    if (enableLinkedInSharing !== undefined) updateData.enableLinkedInSharing = enableLinkedInSharing;
    // Analytics
    if (googleAnalyticsId !== undefined) updateData.googleAnalyticsId = googleAnalyticsId?.trim() || null;
    if (facebookPixelId !== undefined) updateData.facebookPixelId = facebookPixelId?.trim() || null;

    // Update SEO entry
    const seoEntry = await SEO.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!seoEntry) {
      return NextResponse.json(
        { error: 'SEO entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        seo: {
          _id: seoEntry._id,
          shopName: seoEntry.shopName,
          area: seoEntry.area,
          category: seoEntry.category,
          pincode: seoEntry.pincode,
          emailId: seoEntry.emailId,
          ranking: seoEntry.ranking,
          shopId: seoEntry.shopId,
          shopUrl: seoEntry.shopUrl,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update SEO error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/seo/[id] - Get single SEO entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid SEO entry ID' },
        { status: 400 }
      );
    }

    const seoEntry = await SEO.findById(id).lean();

    if (!seoEntry) {
      return NextResponse.json(
        { error: 'SEO entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        seo: seoEntry,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get SEO error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/seo/[id] - Delete SEO entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid SEO entry ID' },
        { status: 400 }
      );
    }

    const seoEntry = await SEO.findByIdAndDelete(id);

    if (!seoEntry) {
      return NextResponse.json(
        { error: 'SEO entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'SEO entry deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete SEO error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

