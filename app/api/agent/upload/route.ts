import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { verifyAgentToken, getAgentTokenFromRequest } from '@/lib/utils/agentAuth';

/**
 * Configure Cloudinary
 * Requires env variables:
 * - CLOUDINARY_CLOUD_NAME
 * - CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    // Verify agent authentication
    const token = getAgentTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyAgentToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
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

    // Validate file size (max 5MB for original upload, will be compressed)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert buffer to base64 data URI for Cloudinary
    const base64Data = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64Data}`;

    // Upload to Cloudinary with specific transformations:
    // - Resize to exactly 1200x800px (fill mode with crop)
    // - Convert to WebP format
    // - Compress to max 200KB
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: 'shops',
      resource_type: 'image',
      format: 'webp', // Force WebP format
      transformation: [
        { 
          width: 1200, 
          height: 800, 
          crop: 'fill', // Fill and crop to exact dimensions
          gravity: 'center', // Center the crop
        },
        { 
          quality: 'auto:low', // Lower quality to ensure file size under 200KB
          fetch_format: 'webp', // Ensure WebP format
        },
      ],
    });

    // Get the transformed URL (Cloudinary applies transformations automatically)
    const finalUrl = uploadResult.secure_url;

    return NextResponse.json(
      {
        success: true,
        photoUrl: finalUrl,
        format: 'webp',
        width: 1200,
        height: 800,
        sizeKB: uploadResult.bytes ? Math.round(uploadResult.bytes / 1024) : null,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Upload failed', details: error.message },
      { status: 500 }
    );
  }
}


