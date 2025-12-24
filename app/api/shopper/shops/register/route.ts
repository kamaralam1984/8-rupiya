import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop';
import Shopper from '@/lib/models/Shopper';
import { verifyShopperToken, getShopperTokenFromRequest } from '@/lib/utils/shopperAuth';
import { PRICING_PLANS, PlanType } from '@/app/utils/pricing';
import { generateShopUrl } from '@/lib/utils/slugGenerator';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = getShopperTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyShopperToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const shopper = await Shopper.findById(payload.shopperId);
    if (!shopper || !shopper.isActive) {
      return NextResponse.json(
        { error: 'Shopper not found or inactive' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('📦 Received shop registration data:', {
      shopName: body.shopName,
      ownerName: body.ownerName,
      mobile: body.mobile,
      category: body.category,
      paymentStatus: body.paymentStatus,
      planType: body.planType,
      hasPhotoUrl: !!body.photoUrl,
      hasLatitude: body.latitude !== null && body.latitude !== undefined,
      hasLongitude: body.longitude !== null && body.longitude !== undefined,
    });

    const {
      shopName,
      ownerName,
      mobile,
      countryCode,
      address,
      area,
      city,
      pincode,
      latitude,
      longitude,
      photoUrl,
      planType,
      category,
      paymentStatus,
    } = body;

    // Validation with detailed error messages
    const missingFields = [];
    if (!shopName || !shopName.trim()) missingFields.push('Shop Name');
    if (!ownerName || !ownerName.trim()) missingFields.push('Owner Name');
    if (!mobile || !mobile.trim()) missingFields.push('Mobile Number');
    if (!address || !address.trim()) missingFields.push('Address');
    if (!pincode || !pincode.trim()) missingFields.push('Pincode');
    if (!photoUrl || !photoUrl.trim()) missingFields.push('Shop Image');
    if (latitude === null || latitude === undefined || typeof latitude !== 'number') missingFields.push('Latitude');
    if (longitude === null || longitude === undefined || typeof longitude !== 'number') missingFields.push('Longitude');
    if (!category || !category.trim()) missingFields.push('Category');

    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Allow both PAID and PENDING for demo payment
    if (paymentStatus !== 'PAID' && paymentStatus !== 'PENDING') {
      console.error('❌ Invalid payment status:', paymentStatus);
      return NextResponse.json(
        { error: 'Payment status must be PAID or PENDING' },
        { status: 400 }
      );
    }

    const planDetails = PRICING_PLANS[planType as PlanType];
    if (!planDetails) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    // Normalize mobile number (remove country code if present in mobile field)
    let normalizedMobile = mobile.trim().replace(/^(\+91|91)/, '');
    if (normalizedMobile.length !== 10 || !/^[6-9]/.test(normalizedMobile)) {
      return NextResponse.json(
        { error: 'Please provide a valid 10-digit mobile number starting with 6-9' },
        { status: 400 }
      );
    }
    
    // Use provided country code or default to +91
    const finalCountryCode = (countryCode || '+91').trim();

    // Create shop (similar to agent shop, but without agent commission)
    const tempUrl = `/temp/${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      const shop = await AgentShop.create({
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        mobile: normalizedMobile,
        countryCode: finalCountryCode,
        category: category.trim(),
        pincode: pincode.trim(),
        area: area?.trim() || undefined,
        city: city?.trim() || undefined,
        address: address.trim(),
        photoUrl: photoUrl.trim(),
        shopUrl: tempUrl,
        latitude: Number(latitude),
        longitude: Number(longitude),
        paymentStatus: paymentStatus === 'PAID' ? 'PAID' : 'PENDING', // Use provided status
        paymentMode: paymentStatus === 'PAID' ? 'UPI' : 'NONE', // Use UPI for Razorpay payments
        receiptNo: '', // Empty receipt number for now
        sendSmsReceipt: false,
        amount: planDetails.amount,
        planType: planType as PlanType,
        planAmount: planDetails.amount,
        agentCommission: 0, // No agent commission for direct shopper registration
        operatorCommission: 0,
        visitorCount: 0,
        // Store shopper ID for reference
        shopperId: shopper._id,
      });

      // Generate unique shop URL
      const shopUrl = generateShopUrl(shop.shopName, shop._id.toString());
      shop.shopUrl = shopUrl;
      await shop.save();

      // Update shopper's total shops count
      shopper.totalShops = (shopper.totalShops || 0) + 1;
      await shopper.save();

      console.log('✅ Shop registered successfully:', shop._id.toString());

      return NextResponse.json(
        {
          success: true,
          message: 'Shop registered successfully! Awaiting admin verification.',
          shop: {
            id: shop._id.toString(),
            shopName: shop.shopName,
            shopUrl: shop.shopUrl,
          },
        },
        { status: 201 }
      );
    } catch (dbError: any) {
      console.error('❌ Database error creating shop:', dbError);
      
      // Handle duplicate key error
      if (dbError.code === 11000) {
        return NextResponse.json(
          { error: 'A shop with this URL already exists. Please try a different shop name.' },
          { status: 400 }
        );
      }
      
      // Handle validation errors
      if (dbError.name === 'ValidationError') {
        const validationErrors = Object.values(dbError.errors || {}).map((err: any) => err.message);
        return NextResponse.json(
          { error: `Validation error: ${validationErrors.join(', ')}` },
          { status: 400 }
        );
      }
      
      // Re-throw to be caught by outer catch
      throw dbError;
    }
  } catch (error: any) {
    console.error('Shopper shop registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

