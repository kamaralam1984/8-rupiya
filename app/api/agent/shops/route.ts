import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop';
import Agent from '@/lib/models/Agent';
import AdminShop from '@/lib/models/Shop'; // Admin shop model
import Category from '@/models/Category'; // Category model
import { verifyAgentToken, getAgentTokenFromRequest } from '@/lib/utils/agentAuth';
import { calculateAgentCommission, PRICING_PLANS, PlanType } from '@/app/utils/pricing';
import mongoose from 'mongoose';

// GET /api/agent/shops - List shops with filters
export async function GET(request: NextRequest) {
  try {
    const token = getAgentTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyAgentToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const dateFilter = searchParams.get('date') || 'all'; // today, week, month, all
    const paymentFilter = searchParams.get('payment') || 'all'; // all, paid, pending

    // Build date filter
    let dateQuery: any = {};
    if (dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateQuery.createdAt = { $gte: today };
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      dateQuery.createdAt = { $gte: weekAgo };
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      monthAgo.setHours(0, 0, 0, 0);
      dateQuery.createdAt = { $gte: monthAgo };
    }

    // Build payment filter
    let paymentQuery: any = {};
    if (paymentFilter === 'paid') {
      paymentQuery.paymentStatus = 'PAID';
    } else if (paymentFilter === 'pending') {
      paymentQuery.paymentStatus = 'PENDING';
    }

    // Combine queries
    const query: any = {
      agentId: new mongoose.Types.ObjectId(payload.agentId),
      ...dateQuery,
      ...paymentQuery,
    };

    const shops = await AgentShop.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        shops,
        count: shops.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get shops error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/agent/shops - Create new shop
export async function POST(request: NextRequest) {
  try {
    const token = getAgentTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyAgentToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    await connectDB();

    let body;
    try {
      body = await request.json();
    } catch (jsonError: any) {
      console.error('JSON parse error:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: jsonError.message },
        { status: 400 }
      );
    }
    const {
      shopName,
      ownerName,
      mobile,
      category,
      pincode,
      address,
      photoUrl,
      additionalPhotos, // Additional photos (optional, max 9)
      latitude,
      longitude,
      paymentStatus,
      paymentMode,
      receiptNo,
      amount,
      planType,
      paymentScreenshot,
      sendSmsReceipt,
    } = body;

    // Validation
    if (!shopName || !ownerName || !mobile || !category || !pincode || !address || !photoUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // Generate receipt number if not provided and payment is PAID
    let finalReceiptNo = receiptNo;
    if (paymentStatus === 'PAID' && !finalReceiptNo) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      finalReceiptNo = `REC${timestamp}${random}`.slice(0, 10);
    }

    // Determine plan type and amount
    const finalPlanType: PlanType = (planType || 'BASIC') as PlanType;
    
    // Validate plan type
    if (!PRICING_PLANS[finalPlanType]) {
      console.error('Invalid plan type:', finalPlanType);
      return NextResponse.json(
        { error: `Invalid plan type: ${finalPlanType}. Valid types: BASIC, PREMIUM, FEATURED, LEFT_BAR, RIGHT_BAR, BANNER, HERO` },
        { status: 400 }
      );
    }
    
    const planDetails = PRICING_PLANS[finalPlanType];
    const finalAmount = amount || planDetails.amount;
    const agentCommission = paymentStatus === 'PAID' 
      ? calculateAgentCommission(finalPlanType, finalAmount)
      : 0;

    // Calculate payment dates
    const paymentDate = paymentStatus === 'PAID' ? new Date() : new Date();
    const expiryDate = new Date(paymentDate);
    expiryDate.setDate(expiryDate.getDate() + 365); // 365 days validity

    // Link category to Category model if it exists
    let categoryRef = null;
    const categoryName = category.trim();
    
    // Try to find category by name or slug
    const foundCategory = await Category.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${categoryName}$`, 'i') } },
        { slug: { $regex: new RegExp(`^${categoryName.toLowerCase().replace(/\s+/g, '-')}$`, 'i') } }
      ],
      isActive: true
    });
    
    if (foundCategory) {
      categoryRef = foundCategory._id;
    }

    // Plan-based features automatically set karo
    // Plan ke hisab se features enable/disable ho jayenge
    const planFeatures = {
      priorityRank: planDetails.priorityRank || 0,
      maxPhotos: planDetails.maxPhotos || 1,
      hasOffers: planDetails.hasOffers || false,
      hasWhatsApp: planDetails.hasWhatsApp || false,
      hasLogo: planDetails.hasLogo || false,
      canBeHomePageBanner: planDetails.canBeHomePageBanner || false,
      canBeTopSlider: planDetails.canBeTopSlider || false,
      canBeLeftBar: planDetails.canBeLeftBar || false,
      canBeRightBar: planDetails.canBeRightBar || false,
      canBeHero: planDetails.canBeHero || false,
    };

    // Photo validation: BASIC plan mein sirf 1 photo allowed
    if (planFeatures.maxPhotos === 1 && !photoUrl) {
      return NextResponse.json(
        { error: 'Photo is required for this plan' },
        { status: 400 }
      );
    }

    console.log(`Creating shop with plan: ${finalPlanType}, Features:`, planFeatures);

    // Create shop in AgentShop collection
    let shop;
    try {
      shop = await AgentShop.create({
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        mobile: mobile.trim(),
        category: categoryName, // Keep category name for backward compatibility
        pincode: pincode.trim(),
        address: address.trim(),
        photoUrl: photoUrl.trim(),
        latitude: Number(latitude),
        longitude: Number(longitude),
        paymentStatus: paymentStatus || 'PENDING',
        paymentMode: paymentMode || 'NONE',
        receiptNo: finalReceiptNo || '',
        amount: finalAmount,
        planType: finalPlanType,
        planAmount: finalAmount,
        agentCommission: agentCommission,
        paymentScreenshot: paymentScreenshot || undefined,
        sendSmsReceipt: sendSmsReceipt || false,
        agentId: new mongoose.Types.ObjectId(payload.agentId),
        lastPaymentDate: paymentStatus === 'PAID' ? paymentDate : undefined,
        paymentExpiryDate: paymentStatus === 'PAID' ? expiryDate : undefined,
        // Plan-based features automatically set ho jayenge
        visitorCount: 0,
      });
    } catch (agentShopError: any) {
      console.error('AgentShop creation error:', agentShopError);
      console.error('AgentShop error details:', {
        message: agentShopError.message,
        name: agentShopError.name,
        errors: agentShopError.errors,
      });
      
      // Return specific validation error
      if (agentShopError.name === 'ValidationError') {
        const errorFields = Object.keys(agentShopError.errors || {});
        const validationErrors = Object.values(agentShopError.errors || {}).map((err: any) => err.message).join(', ');
        const firstError = errorFields.length > 0 ? agentShopError.errors[errorFields[0]] : null;
        
        return NextResponse.json(
          {
            error: 'Validation error',
            details: validationErrors || agentShopError.message || 'Please check all required fields',
            field: errorFields[0] || 'unknown',
            allErrors: errorFields.length > 1 ? validationErrors : undefined,
          },
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      // Re-throw to be caught by outer catch block
      throw agentShopError;
    }

    // Also create shop in Admin Shop database (for website display)
    try {
      // Get agent info for admin shop creation
      const agent = await Agent.findById(payload.agentId);
      
      // Extract area and city from address if possible
      const addressParts = address.split(',');
      const extractedArea = addressParts[0]?.trim() || '';
      const extractedCity = addressParts[addressParts.length - 1]?.trim() || '';
      
      // Create admin shop - use agent's ObjectId as createdByAdmin
      // This allows us to track which agent created the shop
      // Note: The schema expects a User ObjectId, but we'll use agentId for now
      // In production, you might want to create a system admin user or make this field optional
      const agentObjectId = new mongoose.Types.ObjectId(payload.agentId);
      
      // Prepare admin shop data with plan-based features (planFeatures already defined above)
      const adminShopData: any = {
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        category: categoryName, // Use category name
        categoryRef: categoryRef, // Link to Category model
        mobile: mobile?.trim() || undefined,
        area: extractedArea || undefined,
        fullAddress: address.trim(),
        city: extractedCity || undefined,
        pincode: pincode?.trim() || undefined,
        latitude: Number(latitude),
        longitude: Number(longitude),
        photoUrl: photoUrl.trim(),
        iconUrl: photoUrl.trim(), // Same as photoUrl
        // createdByAdmin is optional now - leave it undefined for agent-created shops
        planType: finalPlanType,
        planAmount: finalAmount,
        planStartDate: paymentStatus === 'PAID' ? paymentDate : new Date(),
        planEndDate: paymentStatus === 'PAID' ? expiryDate : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        // Plan-based features automatically set
        priorityRank: planFeatures.priorityRank,
        isHomePageBanner: planFeatures.canBeHomePageBanner,
        isTopSlider: planFeatures.canBeTopSlider,
        isLeftBar: planFeatures.canBeLeftBar,
        isRightBar: planFeatures.canBeRightBar,
        isHero: planFeatures.canBeHero,
        visitorCount: 0,
        // Premium/Featured features - plan ke hisab se set karo
        additionalPhotos: (planFeatures.maxPhotos === 10 && additionalPhotos && Array.isArray(additionalPhotos) && additionalPhotos.length > 0) 
          ? additionalPhotos.slice(0, 9) // Max 9 additional photos (total 10 with main photo)
          : undefined,
        shopLogo: planFeatures.hasLogo ? undefined : undefined, // Logo upload later
        offers: planFeatures.hasOffers ? [] : undefined, // Offers section ke liye empty array
        whatsappNumber: planFeatures.hasWhatsApp ? mobile?.trim() : undefined, // WhatsApp number set karo agar plan allow karta hai
      };
      
      // Only add payment dates if payment is PAID
      if (paymentStatus === 'PAID') {
        adminShopData.lastPaymentDate = paymentDate;
        adminShopData.paymentExpiryDate = expiryDate;
      }
      
      await AdminShop.create(adminShopData);
      
      console.log(`Shop ${shop._id} also created in admin Shop database`);
    } catch (adminShopError: any) {
      console.error('Error creating shop in admin database:', adminShopError);
      console.error('Admin shop error details:', {
        message: adminShopError.message,
        name: adminShopError.name,
        errors: adminShopError.errors,
        stack: adminShopError.stack,
      });
      // Don't fail the agent shop creation if admin shop creation fails
      // Log the error but continue
      // However, if it's a critical error, we might want to handle it differently
      if (adminShopError.name === 'ValidationError') {
        console.warn('AdminShop validation failed, but AgentShop was created successfully');
      }
    }

    // Update agent stats
    try {
      const agent = await Agent.findById(payload.agentId);
      if (agent) {
        agent.totalShops += 1;
        if (paymentStatus === 'PAID' && agentCommission > 0) {
          agent.totalEarnings += agentCommission;
        }
        await agent.save();
      }
    } catch (agentError: any) {
      console.error('Error updating agent stats:', agentError);
      // Don't fail the shop creation if agent update fails
    }

    return NextResponse.json(
      {
        success: true,
        shop: {
          _id: shop._id,
          shopName: shop.shopName,
          ownerName: shop.ownerName,
          category: shop.category,
          planType: shop.planType,
          paymentStatus: shop.paymentStatus,
        },
      },
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Create shop error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    
    // Ensure we always return JSON, even if there's an error
    try {
      const errorMessage = error.message || 'Failed to create shop';
      const isValidationError = error.name === 'ValidationError' || error.message?.includes('validation');
      const isMongoError = error.name === 'MongoError' || error.code === 11000;
      
      let errorResponse: any = {
        error: isValidationError ? 'Validation error: ' + errorMessage : 'Internal server error',
        details: errorMessage,
      };
      
      if (isMongoError) {
        errorResponse.error = 'Database error';
        errorResponse.details = 'A shop with similar details already exists or database operation failed';
      }
      
      if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = error.stack;
        errorResponse.errorName = error.name;
        errorResponse.errorCode = error.code;
      }
      
      return NextResponse.json(
        errorResponse,
        { 
          status: isValidationError ? 400 : isMongoError ? 409 : 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (responseError: any) {
      // If even JSON response fails, return a simple text response
      console.error('Failed to create JSON error response:', responseError);
      return new NextResponse(
        JSON.stringify({ error: 'Internal server error', details: 'Failed to process error response' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }
}
