import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop';
import Agent from '@/lib/models/Agent';
import AdminShop from '@/lib/models/Shop'; // Admin shop model
import Category from '@/models/Category'; // Category model
import { verifyAgentToken, getAgentTokenFromRequest } from '@/lib/utils/agentAuth';
import { calculateAgentCommission, PRICING_PLANS, PlanType } from '@/app/utils/pricing';
import { generateShopUrl } from '@/lib/utils/slugGenerator';
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
      console.log('📥 Received shop creation request from agent:', payload.agentId);
      console.log('📦 Request body keys:', Object.keys(body));
      console.log('📦 Plan type:', body.planType);
      console.log('📦 Photo URL:', body.photoUrl ? '✅ Present' : '❌ Missing');
      console.log('📦 Location:', body.latitude, body.longitude);
      console.log('📦 Area value:', body.area);
      console.log('📦 Area type:', typeof body.area);
      console.log('📦 Area length:', body.area?.length);
      console.log('📦 Area trimmed:', body.area?.trim());
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
      email,
      category,
      pincode,
      area, // CRITICAL: Area field must be present
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

    // Area is optional - no need for extensive logging

    // Validation - trim and check for empty strings
    // Area is now optional - no validation required
    const trimmedShopName = (shopName || '').trim();
    const trimmedOwnerName = (ownerName || '').trim();
    const trimmedMobile = (mobile || '').trim();
    const trimmedEmail = (email || '').trim();
    const trimmedCategory = (category || '').trim();
    const trimmedPincode = (pincode || '').trim();
    const trimmedArea = area ? String(area).trim() : ''; // Area is optional - trim if present
    const trimmedAddress = (address || '').trim();
    const trimmedPhotoUrl = (photoUrl || '').trim();

    // Check each required field individually for better error messages
    if (!trimmedShopName) {
      return NextResponse.json(
        { error: 'Validation error', details: 'Shop name is required', field: 'shopName' },
        { status: 400 }
      );
    }
    if (!trimmedOwnerName) {
      return NextResponse.json(
        { error: 'Validation error', details: 'Owner name is required', field: 'ownerName' },
        { status: 400 }
      );
    }
    if (!trimmedMobile) {
      return NextResponse.json(
        { error: 'Validation error', details: 'Mobile number is required', field: 'mobile' },
        { status: 400 }
      );
    }
    if (!trimmedEmail) {
      return NextResponse.json(
        { error: 'Validation error', details: 'Email is required', field: 'email' },
        { status: 400 }
      );
    }
    if (!trimmedCategory) {
      return NextResponse.json(
        { error: 'Validation error', details: 'Category is required', field: 'category' },
        { status: 400 }
      );
    }
    if (!trimmedPincode) {
      return NextResponse.json(
        { error: 'Validation error', details: 'Pincode is required', field: 'pincode' },
        { status: 400 }
      );
    }
    // Area is optional - no validation needed
    if (!trimmedAddress) {
      return NextResponse.json(
        { error: 'Validation error', details: 'Address is required', field: 'address' },
        { status: 400 }
      );
    }
    if (!trimmedPhotoUrl) {
      return NextResponse.json(
        { error: 'Validation error', details: 'Photo URL is required', field: 'photoUrl' },
        { status: 400 }
      );
    }

    if (latitude === undefined || longitude === undefined) {
      console.error('❌ Missing location:', { latitude, longitude });
      return NextResponse.json(
        { error: 'Latitude and longitude are required', details: 'Location is required' },
        { status: 400 }
      );
    }
    
    console.log('✅ Basic validation passed');

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
        { error: `Invalid plan type: ${finalPlanType}. Valid types: BASIC, PREMIUM, FEATURED, LEFT_BAR, RIGHT_SIDE, BOTTOM_RAIL, BANNER, HERO` },
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
    const categoryName = trimmedCategory;
    
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
    if (planFeatures.maxPhotos === 1 && !trimmedPhotoUrl) {
      return NextResponse.json(
        { error: 'Photo is required for this plan' },
        { status: 400 }
      );
    }

    console.log(`✅ Creating shop with plan: ${finalPlanType}, Amount: ₹${finalAmount}, Commission: ₹${agentCommission}`);
    console.log('✅ Plan Features:', planFeatures);

    // Create shop in AgentShop collection
    let shop;
    try {
      console.log('📝 Creating AgentShop document...');
      // Generate unique temporary URL to avoid duplicate key errors
      // Use timestamp + random string for uniqueness
      const tempUrl = `/temp/${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      // First create with temp URL, then update with actual URL based on shop ID
      const tempShop = await AgentShop.create({
        shopName: trimmedShopName,
        ownerName: trimmedOwnerName,
        mobile: trimmedMobile,
        email: trimmedEmail || undefined,
        category: categoryName, // Keep category name for backward compatibility
        pincode: trimmedPincode,
        area: trimmedArea || undefined, // Area is optional - use undefined if empty
        address: trimmedAddress,
        photoUrl: trimmedPhotoUrl,
        shopUrl: tempUrl, // Unique temporary value, will be updated
        latitude: Number(latitude),
        longitude: Number(longitude),
        paymentStatus: 'PENDING', // Always PENDING - requires admin approval
        paymentMode: paymentMode || 'NONE',
        receiptNo: finalReceiptNo || '',
        amount: finalAmount,
        planType: finalPlanType,
        planAmount: finalAmount,
        agentCommission: agentCommission,
        paymentScreenshot: paymentScreenshot || undefined,
        sendSmsReceipt: sendSmsReceipt || false,
        agentId: new mongoose.Types.ObjectId(payload.agentId),
        lastPaymentDate: undefined, // No payment date until admin approves
        paymentExpiryDate: undefined, // Will be set when admin approves
        // Plan-based features automatically set ho jayenge
        visitorCount: 0,
      });

      // Generate unique shop URL based on shop name and ID
      const shopUrl = generateShopUrl(tempShop.shopName, tempShop._id.toString());
      tempShop.shopUrl = shopUrl;
      await tempShop.save();
      
      shop = tempShop;
      console.log(`✅ AgentShop created successfully: ${shop._id}`);
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
    // Sabhi details ke sath shop ko main shops database me save karo
    try {
      console.log('📝 Creating AdminShop document...');
      // Get agent info for admin shop creation
      const agent = await Agent.findById(payload.agentId);
      
      // Area is optional - use provided area or extract from address if not provided
      const addressParts = trimmedAddress.split(',');
      const extractedArea = trimmedArea || addressParts[0]?.trim() || undefined; // Optional - can be undefined
      const extractedCity = addressParts[addressParts.length - 1]?.trim() || undefined;
      // Try to extract district from address (usually second last part)
      const extractedDistrict = addressParts.length > 2 ? addressParts[addressParts.length - 2]?.trim() : undefined;
      
      // Create admin shop - use agent's ObjectId as createdByAdmin
      // This allows us to track which agent created the shop
      // Note: The schema expects a User ObjectId, but we'll use agentId for now
      // In production, you might want to create a system admin user or make this field optional
      const agentObjectId = new mongoose.Types.ObjectId(payload.agentId);
      
      // Prepare admin shop data with ALL details - exactly like admin panel me show hota hai
      // Use the same shop URL for consistency
      const adminShopData: any = {
        shopName: trimmedShopName,
        ownerName: trimmedOwnerName,
        category: categoryName, // Use category name
        categoryRef: categoryRef || undefined, // Link to Category model
        mobile: trimmedMobile || undefined,
        email: trimmedEmail || undefined, // Email ID for SEO and contact
        area: extractedArea || undefined,
        fullAddress: trimmedAddress,
        city: extractedCity || undefined,
        pincode: trimmedPincode || undefined,
        district: extractedDistrict || undefined, // District for revenue tracking
        latitude: Number(latitude),
        longitude: Number(longitude),
        photoUrl: trimmedPhotoUrl,
        iconUrl: trimmedPhotoUrl, // Same as photoUrl
        shopUrl: shop.shopUrl, // Use the same shop URL generated for AgentShop
        // Agent information - kaun agent ne shop add kiya
        createdByAgent: agent ? new mongoose.Types.ObjectId(payload.agentId) : undefined,
        agentName: agent?.name || undefined,
        agentCode: agent?.agentCode || undefined,
        // Payment details - sabhi payment fields add karo
        // IMPORTANT: Always PENDING - requires admin approval
        paymentStatus: 'PENDING',
        paymentExpiryDate: (() => {
          const defaultExpiry = new Date();
          defaultExpiry.setDate(defaultExpiry.getDate() + 365);
          return defaultExpiry;
        })(),
        lastPaymentDate: undefined, // No payment date until admin approves
        // Plan details - sabhi plan fields add karo
        planType: finalPlanType,
        planAmount: finalAmount,
        planStartDate: new Date(), // Will be updated when admin approves
        planEndDate: (() => {
          const defaultEnd = new Date();
          defaultEnd.setDate(defaultEnd.getDate() + 365);
          return defaultEnd;
        })(),
        // Plan-based features automatically set
        priorityRank: planFeatures.priorityRank,
        isHomePageBanner: planFeatures.canBeHomePageBanner,
        isTopSlider: planFeatures.canBeTopSlider,
        isLeftBar: planFeatures.canBeLeftBar,
        isRightBar: planFeatures.canBeRightBar,
        isHero: planFeatures.canBeHero,
        visitorCount: 0,
        // Premium/Featured features - plan ke hisab se set karo
        additionalPhotos: (planFeatures.maxPhotos > 1 && additionalPhotos && Array.isArray(additionalPhotos) && additionalPhotos.length > 0) 
          ? additionalPhotos.slice(0, planFeatures.maxPhotos - 1) // Max (maxPhotos - 1) additional photos
          : [],
        shopLogo: planFeatures.hasLogo ? undefined : undefined, // Logo upload later
        offers: planFeatures.hasOffers ? [] : [], // Offers section ke liye empty array
        whatsappNumber: planFeatures.hasWhatsApp ? trimmedMobile : undefined, // WhatsApp number set karo agar plan allow karta hai
        createdAt: new Date(), // Explicit creation date
      };
      
      // Create shop in main shops database
      const createdAdminShop = await AdminShop.create(adminShopData);
      
      console.log(`✅ AdminShop created successfully: ${createdAdminShop._id}`);
      console.log(`✅ Shop ${shop._id} successfully created in both databases`);
      console.log(`✅ All shop details saved: shopName=${shopName}, category=${categoryName}, planType=${finalPlanType}, paymentStatus=${paymentStatus}`);
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
        // Log validation errors for debugging
        if (adminShopError.errors) {
          Object.keys(adminShopError.errors).forEach((key) => {
            console.error(`Validation error for field ${key}:`, adminShopError.errors[key].message);
          });
        }
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

    // SEO entry will be created by the frontend after shop creation if user has provided SEO data
    // No auto-creation of SEO entry - only save when user explicitly adds SEO

    console.log(`🎉 Shop creation complete! Returning success response for shop: ${shop._id}`);
    
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
          shopUrl: shop.shopUrl, // Include shop URL in response
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
