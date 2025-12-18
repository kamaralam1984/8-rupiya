import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Logo from '@/lib/models/Logo';
import { authenticateRequest } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * GET /api/admin/logos
 * Get all logos
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = authenticateRequest(request);
    if (!authResult.user || authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (!['admin', 'editor'].includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin or Editor access required' },
        { status: 403 }
      );
    }
    
    await connectDB();

    const logos = await Logo.find({ createdBy: new mongoose.Types.ObjectId(authResult.user.userId) })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      logos,
    });
  } catch (error: any) {
    console.error('Error fetching logos:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch logos' },
      { status: error.status || 500 }
    );
  }
}

/**
 * POST /api/admin/logos
 * Create a new logo
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = authenticateRequest(request);
    if (!authResult.user || authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (!['admin', 'editor'].includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin or Editor access required' },
        { status: 403 }
      );
    }
    
    const user = authResult.user;
    await connectDB();

    const body = await request.json();
    const {
      businessName,
      tagline,
      logoType,
      layout,
      colors,
      fonts,
      icon,
      iconPosition,
      textAlignment,
      spacing,
      borderRadius,
      borderWidth,
      borderColor,
      shadow,
      gradient,
      gradientColors,
    } = body;

    if (!businessName) {
      return NextResponse.json(
        { success: false, error: 'Business name is required' },
        { status: 400 }
      );
    }

    // Create logo document (images will be generated client-side and uploaded separately)
    const logo = await Logo.create({
      businessName,
      tagline,
      logoType: logoType || 'combination',
      layout: layout || 'horizontal',
      colors: colors || { primary: '#000000', background: '#FFFFFF' },
      fonts: fonts || { primary: 'Arial' },
      icon,
      iconUrl: body.iconUrl,
      imageUrl: body.imageUrl,
      iconPosition: iconPosition || 'left',
      style: body.style || 'modern',
      textAlignment: textAlignment || 'center',
      spacing: spacing || 10,
      borderRadius: borderRadius || 0,
      borderWidth: borderWidth || 0,
      borderColor,
      shadow: shadow || false,
      gradient: gradient || false,
      gradientColors,
      logoUrl: body.logoUrl,
      logoSvgUrl: body.logoSvgUrl,
      createdBy: new mongoose.Types.ObjectId(user.userId),
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      logo,
    });
  } catch (error: any) {
    console.error('Error creating logo:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create logo' },
      { status: 500 }
    );
  }
}


