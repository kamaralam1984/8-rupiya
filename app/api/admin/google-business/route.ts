import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GoogleBusinessProfile from '@/lib/models/GoogleBusinessProfile';
import AdminShop from '@/lib/models/Shop';
import AgentShop from '@/lib/models/AgentShop';
import { requireAdmin, authenticateRequest } from '@/lib/auth';

/**
 * GET /api/admin/google-business
 * Get all Google Business Profiles
 */
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const shopId = searchParams.get('shopId');

    const query: any = {};
    if (status) {
      query.verificationStatus = status.toUpperCase();
    }
    if (shopId) {
      query.shopId = shopId;
    }

    const profiles = await GoogleBusinessProfile.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      profiles,
      count: profiles.length,
    });
  } catch (error: any) {
    console.error('Error fetching Google Business Profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profiles', details: error.message },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/google-business
 * Create a new Google Business Profile for a shop
 */
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const body = await request.json();
    const { shopId, email, notes } = body;
    
    // Get user from authentication
    const { user } = authenticateRequest(request);
    if (!user || !user.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }

    // Find the shop - पहले Shop.ts (AdminShop) में check करें
    let shop: any = await AdminShop.findById(shopId).lean();
    let isAgentShop = false;
    
    // अगर Shop.ts में नहीं मिला, तो AgentShop में check करें
    if (!shop) {
      shop = await AgentShop.findById(shopId).lean();
      isAgentShop = true;
    }
    
    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found in Shop.ts or AgentShop database' },
        { status: 404 }
      );
    }

    // Check if profile already exists
    const existingProfile = await GoogleBusinessProfile.findOne({ shopId });
    if (existingProfile) {
      return NextResponse.json(
        { error: 'Google Business Profile already exists for this shop' },
        { status: 409 }
      );
    }

    // Data automatically fetch करें - AgentShop को priority (latest data)
    // अगर AgentShop में है तो उससे लें, नहीं तो Shop.ts से
    let finalShopData: any = {};
    
    if (isAgentShop) {
      // AgentShop से data (agent panel से)
      finalShopData = {
        shopName: shop.shopName || '',
        ownerName: shop.ownerName || '',
        mobile: shop.mobile || '',
        address: shop.address || '',
        area: '', // AgentShop में area field नहीं है, address से extract करें
        city: '', // AgentShop में city field नहीं है
        pincode: shop.pincode || '',
        latitude: shop.latitude || 0,
        longitude: shop.longitude || 0,
        category: shop.category || '',
        photoUrl: shop.photoUrl || '',
      };
      
      // Address से area और city extract करने की कोशिश करें
      if (shop.address) {
        const addressParts = shop.address.split(',').map((p: string) => p.trim());
        if (addressParts.length > 1) {
          finalShopData.area = addressParts[0] || '';
          finalShopData.city = addressParts[addressParts.length - 1] || '';
        } else {
          finalShopData.area = shop.address;
        }
      }
    } else {
      // Shop.ts से data (admin shops)
      finalShopData = {
        shopName: shop.shopName || '',
        ownerName: shop.ownerName || '',
        mobile: shop.mobile || '',
        address: shop.fullAddress || '',
        area: shop.area || '',
        city: shop.city || '',
        pincode: shop.pincode || '',
        latitude: shop.latitude || 0,
        longitude: shop.longitude || 0,
        category: shop.category || '',
        photoUrl: shop.photoUrl || shop.iconUrl || '',
      };
    }

    // अगर AgentShop में same shop name का shop है, तो उसका data भी merge करें
    // (क्योंकि agent shop latest हो सकता है)
    if (!isAgentShop) {
      const agentShop = await AgentShop.findOne({ 
        shopName: shop.shopName,
        ownerName: shop.ownerName 
      }).lean();
      
      if (agentShop) {
        // AgentShop का data priority (latest)
        finalShopData.mobile = agentShop.mobile || finalShopData.mobile;
        finalShopData.pincode = agentShop.pincode || finalShopData.pincode;
        finalShopData.address = agentShop.address || finalShopData.address;
        finalShopData.photoUrl = agentShop.photoUrl || finalShopData.photoUrl;
        finalShopData.latitude = agentShop.latitude || finalShopData.latitude;
        finalShopData.longitude = agentShop.longitude || finalShopData.longitude;
        
        // Address से area extract करें
        if (agentShop.address) {
          const addressParts = agentShop.address.split(',').map((p: string) => p.trim());
          if (addressParts.length > 1) {
            finalShopData.area = addressParts[0] || finalShopData.area;
            finalShopData.city = addressParts[addressParts.length - 1] || finalShopData.city;
          }
        }
      }
    }

    // Create Google Business Profile record with all fetched data
    const profile = await GoogleBusinessProfile.create({
      shopId: shop._id,
      shopName: finalShopData.shopName,
      ownerName: finalShopData.ownerName,
      mobile: finalShopData.mobile || undefined,
      email: email || undefined, // Email manually add करना होगा
      address: finalShopData.address,
      area: finalShopData.area || undefined,
      city: finalShopData.city || undefined,
      pincode: finalShopData.pincode || undefined,
      latitude: finalShopData.latitude,
      longitude: finalShopData.longitude,
      category: finalShopData.category,
      photoUrl: finalShopData.photoUrl || undefined,
      verificationStatus: 'NOT_CREATED',
      createdBy: user.userId,
      createdByRole: user.role as 'admin' | 'editor' | 'operator',
      notes: notes || undefined,
    });

    // TODO: Integrate with Google My Business API here
    // For now, we'll just create the record and mark it as PENDING
    // In production, you would:
    // 1. Call Google My Business API to create the profile
    // 2. Get the Google Business ID
    // 3. Update the profile with the ID and URL
    
    // Simulate API call (replace with actual Google My Business API integration)
    console.log('Creating Google Business Profile for shop:', finalShopData.shopName);
    console.log('Shop details (Auto-fetched from database):', {
      shopName: finalShopData.shopName,
      ownerName: finalShopData.ownerName,
      mobile: finalShopData.mobile,
      email: email,
      address: finalShopData.address,
      area: finalShopData.area,
      city: finalShopData.city,
      pincode: finalShopData.pincode,
      category: finalShopData.category,
      photoUrl: finalShopData.photoUrl,
      location: { lat: finalShopData.latitude, lng: finalShopData.longitude },
      source: isAgentShop ? 'AgentShop' : 'Shop.ts',
    });

    // Update status to PENDING (after API call would be made)
    profile.verificationStatus = 'PENDING';
    await profile.save();

    return NextResponse.json({
      success: true,
      message: 'Google Business Profile creation initiated',
      profile: {
        _id: profile._id,
        shopId: profile.shopId,
        shopName: profile.shopName,
        verificationStatus: profile.verificationStatus,
        createdAt: profile.createdAt,
      },
      instructions: [
        'Google Business Profile record created successfully',
        'Next steps:',
        '1. Verify the business details',
        '2. Complete Google My Business verification process',
        '3. Update the profile status once verified',
      ],
    });
  } catch (error: any) {
    console.error('Error creating Google Business Profile:', error);
    return NextResponse.json(
      { error: 'Failed to create profile', details: error.message },
      { status: 500 }
    );
  }
});

