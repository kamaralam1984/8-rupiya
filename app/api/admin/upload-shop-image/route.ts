import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';
import exifr from 'exifr';
import { reverseGeocode as reverseGeocodeUtil } from '@/lib/extractMeta';

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


/**
 * POST /api/admin/upload-shop-image
 * 
 * Handles shop image upload with the following steps:
 * 1. Parse multipart form data and get the image file
 * 2. Upload image to Cloudinary, get imageUrl and public_id
 * 3. Read EXIF metadata using exifr to extract GPS (latitude, longitude)
 * 4. Read the image file into a Buffer for database storage
 * 5. If GPS exists, extract lat/long and call reverse geocoding API
 * 6. Return JSON response with image data and location info (if found)
 */
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
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

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Step 1: Read file into ArrayBuffer for processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Step 2: Upload to Cloudinary
    // Convert buffer to base64 data URI for Cloudinary
    const base64Data = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64Data}`;

    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: 'shops',
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 800, crop: 'limit' }, // Limit max dimensions
        { quality: 'auto' }, // Auto quality optimization
      ],
    });

    const imageUrl = uploadResult.secure_url;
    const imagePublicId = uploadResult.public_id;

    // Step 3: Read EXIF metadata to extract GPS coordinates
    let latitude: number | null = null;
    let longitude: number | null = null;
    let area: string | null = null;
    let address: string | null = null;

    try {
      // exifr can read from Buffer
      const exifData = await exifr.parse(buffer, {
        gps: true, // Only extract GPS data
        pick: ['latitude', 'longitude'], // Only get lat/long
      });

      if (exifData && exifData.latitude && exifData.longitude) {
        latitude = exifData.latitude;
        longitude = exifData.longitude;

        // Step 5: Call reverse geocoding API to get area and address
        const geocodeResult = await reverseGeocodeUtil(exifData.latitude, exifData.longitude);
        area = geocodeResult.area || 'Unknown Area';
        address = geocodeResult.fullAddress || `${exifData.latitude}, ${exifData.longitude}`;
      }
    } catch (exifError: any) {
      // EXIF extraction failed - this is okay, GPS might not be present
      console.log('EXIF GPS extraction failed (image may not have GPS data):', exifError.message);
    }

    // Step 4: Convert buffer to base64 for database storage
    const imageBufferBase64 = buffer.toString('base64');

    // Step 6: Return response
    if (latitude !== null && longitude !== null) {
      // GPS found
      return NextResponse.json({
        success: true,
        gpsFound: true,
        imageUrl,
        imagePublicId,
        imageBufferBase64,
        latitude,
        longitude,
        area,
        address,
      });
    } else {
      // GPS not found
      return NextResponse.json({
        success: true,
        gpsFound: false,
        imageUrl,
        imagePublicId,
        imageBufferBase64,
      });
    }
  } catch (error: any) {
    console.error('Error uploading shop image:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
});


