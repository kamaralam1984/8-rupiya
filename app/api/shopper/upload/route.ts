import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { verifyShopperToken, getShopperTokenFromRequest } from '@/lib/utils/shopperAuth';

/**
 * Configure Cloudinary
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * POST /api/shopper/upload
 * 
 * Handles shop image upload for shoppers
 */
export async function POST(request: NextRequest) {
  try {
    // Verify shopper authentication
    const token = getShopperTokenFromRequest(request);
    
    if (!token || token.trim() === '') {
      console.error('❌ No token provided in request headers');
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please login again.' },
        { status: 401 }
      );
    }

    const payload = verifyShopperToken(token);
    if (!payload) {
      console.error('❌ Token verification failed');
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token. Please login again.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB for upload, will be compressed to 1MB)
    const maxUploadSize = 10 * 1024 * 1024; // 10MB max upload
    if (file.size > maxUploadSize) {
      return NextResponse.json(
        { success: false, error: 'File size too large. Maximum size is 10MB (will be compressed to 1MB).' },
        { status: 400 }
      );
    }

    // Read file into ArrayBuffer for processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert buffer to base64 data URI for Cloudinary
    const base64Data = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64Data}`;

    // Upload to Cloudinary with compression to max 1MB:
    // - Resize to max 1920x1920px (maintain aspect ratio)
    // - Convert to WebP format for better compression
    // - Compress to max 1MB
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: 'shops',
      resource_type: 'image',
      format: 'webp', // Force WebP format for better compression
      transformation: [
        { 
          width: 1920, 
          height: 1920, 
          crop: 'limit', // Limit max dimensions, maintain aspect ratio
        },
        { 
          quality: 'auto:good', // Auto quality optimization (targets ~1MB)
          fetch_format: 'webp', // Ensure WebP format
        },
      ],
    });

    const imageUrl = uploadResult.secure_url;

    return NextResponse.json({
      success: true,
      url: imageUrl,
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}

