import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SEO from '@/lib/models/SEO';

// POST /api/seo - Create SEO entry
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { 
      shopName, area, category, pincode, emailId, ranking, shopId, shopUrl,
      metaTitle, metaDescription, metaKeywords, ogImage, ogTitle, ogDescription,
      facebookUrl, instagramUrl, twitterUrl, linkedinUrl, youtubeUrl, whatsappNumber,
      googleBusinessId, googleMapsUrl,
      enableSocialSharing, socialSharingMessage, enableWhatsAppSharing, enableFacebookSharing,
      enableTwitterSharing, enableLinkedInSharing,
      googleAnalyticsId, facebookPixelId
    } = body;

    // Validation - pincode is optional
    if (!shopName || !area || !category || !emailId) {
      return NextResponse.json(
        { error: 'Missing required fields', details: 'Shop name, area, category, and email ID are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(emailId)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Normalize and validate pincode format
    // Extract only digits from pincode
    let normalizedPincode: string | undefined = undefined;
    
    if (pincode && typeof pincode === 'string' && pincode.trim()) {
      normalizedPincode = pincode.trim().replace(/\D/g, '');
      
      // If pincode is provided and not empty after normalization, it should be 6 digits
      if (normalizedPincode && normalizedPincode.length !== 6) {
        return NextResponse.json(
          { error: 'Pincode must be 6 digits if provided' },
          { status: 400 }
        );
      }
      
      // If after normalization it's empty, treat as undefined
      if (!normalizedPincode) {
        normalizedPincode = undefined;
      }
    }

    // Default ranking to 1 if not provided
    const finalRanking = ranking || 1;
    if (finalRanking < 1) {
      return NextResponse.json(
        { error: 'Ranking must be at least 1' },
        { status: 400 }
      );
    }

    // Create SEO entry
    const seoEntry = await SEO.create({
      shopName: shopName.trim(),
      area: area.trim(),
      category: category.trim(),
      pincode: normalizedPincode || undefined,
      emailId: emailId.trim().toLowerCase(),
      ranking: finalRanking,
      shopId: shopId || undefined,
      shopUrl: shopUrl || undefined,
      // Enhanced SEO Fields
      metaTitle: metaTitle?.trim(),
      metaDescription: metaDescription?.trim(),
      metaKeywords: Array.isArray(metaKeywords) ? metaKeywords.map(k => k.trim()).filter(Boolean) : undefined,
      ogImage: ogImage?.trim(),
      ogTitle: ogTitle?.trim(),
      ogDescription: ogDescription?.trim(),
      // Social Media Links
      facebookUrl: facebookUrl?.trim(),
      instagramUrl: instagramUrl?.trim(),
      twitterUrl: twitterUrl?.trim(),
      linkedinUrl: linkedinUrl?.trim(),
      youtubeUrl: youtubeUrl?.trim(),
      whatsappNumber: whatsappNumber?.trim(),
      // Google Business
      googleBusinessId: googleBusinessId?.trim(),
      googleMapsUrl: googleMapsUrl?.trim(),
      // Social Sharing Settings
      enableSocialSharing: enableSocialSharing !== undefined ? enableSocialSharing : true,
      socialSharingMessage: socialSharingMessage?.trim(),
      enableWhatsAppSharing: enableWhatsAppSharing !== undefined ? enableWhatsAppSharing : true,
      enableFacebookSharing: enableFacebookSharing !== undefined ? enableFacebookSharing : true,
      enableTwitterSharing: enableTwitterSharing !== undefined ? enableTwitterSharing : true,
      enableLinkedInSharing: enableLinkedInSharing !== undefined ? enableLinkedInSharing : true,
      // Analytics
      googleAnalyticsId: googleAnalyticsId?.trim(),
      facebookPixelId: facebookPixelId?.trim(),
    });

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
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create SEO error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors || {}).map((err: any) => err.message);
      return NextResponse.json(
        { 
          error: validationErrors[0] || 'Validation error',
          details: validationErrors.join(', '),
          validationErrors 
        },
        { status: 400 }
      );
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'SEO entry already exists for this shop' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/seo - Get SEO entries with filters
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const area = searchParams.get('area');
    const pincode = searchParams.get('pincode');
    const ranking = searchParams.get('ranking');

    // Build query
    const query: any = {};
    if (category) query.category = category;
    if (area) query.area = area;
    if (pincode) query.pincode = pincode;
    if (ranking) query.ranking = parseInt(ranking);

    // Fetch all SEO entries with all fields
    const seoEntries = await SEO.find(query)
      .sort({ ranking: 1, createdAt: -1 })
      .lean()
      .exec();
    
    // Ensure all fields are included in response
    const enrichedEntries = seoEntries.map((entry: any) => ({
      ...entry,
      _id: entry._id?.toString(),
      shopId: entry.shopId?.toString(),
    }));

    return NextResponse.json(
      {
        success: true,
        seo: enrichedEntries,
        count: enrichedEntries.length,
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

