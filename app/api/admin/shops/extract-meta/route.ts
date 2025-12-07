import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { extractGPSFromImage, reverseGeocode, reverseGeocodeGoogle } from '@/lib/extractMeta';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with validation
const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
  console.error('⚠️ Cloudinary credentials missing! Please check .env.local');
  console.error('Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
}

cloudinary.config({
  cloud_name: cloudinaryCloudName,
  api_key: cloudinaryApiKey,
  api_secret: cloudinaryApiSecret,
});

/**
 * POST /api/admin/shops/extract-meta
 * 
 * Extracts GPS coordinates from uploaded image EXIF data and performs reverse geocoding
 * to get address details. Also uploads the image to Cloudinary.
 * 
 * Steps:
 * 1. Parse multipart form to get the image file
 * 2. Use exifr to read EXIF GPS (lat, long)
 * 3. If GPS is missing, return an error
 * 4. If GPS exists, call reverse geocoding API
 * 5. Upload image to Cloudinary
 * 6. Return JSON with location data and photoUrl
 */
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Step 1: Extract GPS coordinates from EXIF
    console.log('🔍 Attempting to extract GPS data from image...');
    console.log('📦 Image buffer size:', imageBuffer.length, 'bytes');
    console.log('📄 File type:', file.type);
    console.log('📝 File name:', file.name);
    
    const gpsData = await extractGPSFromImage(imageBuffer);

    if (!gpsData) {
      console.log('⚠️ GPS extraction failed - allowing manual entry');
      // Still upload image to Cloudinary so user can proceed with manual entry
      let photoUrl: string;
      let imagePublicId: string;

      try {
        // Validate Cloudinary config before upload
        if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
          throw new Error('Cloudinary credentials are not configured. Please check your .env.local file.');
        }

        const base64Image = imageBuffer.toString('base64');
        const dataUri = `data:${file.type};base64,${base64Image}`;

        console.log('📤 Uploading to Cloudinary...');
        const uploadResult = await cloudinary.uploader.upload(dataUri, {
          folder: 'shops',
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto' },
          ],
        });

        photoUrl = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;
        console.log('✅ Image uploaded successfully:', photoUrl);
      } catch (cloudinaryError: any) {
        console.error('❌ Cloudinary upload error:', cloudinaryError);
        console.error('Error details:', {
          message: cloudinaryError.message,
          http_code: cloudinaryError?.http_code,
          name: cloudinaryError?.name,
        });
        
        let errorMessage = 'Failed to upload image to Cloudinary';
        if (cloudinaryError.message) {
          errorMessage += `: ${cloudinaryError.message}`;
        } else if (cloudinaryError.http_code) {
          errorMessage += ` (HTTP ${cloudinaryError.http_code})`;
        }
        
        // Check if it's a configuration error
        if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
          errorMessage = 'Cloudinary credentials are missing. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env.local file.';
        }

        return NextResponse.json(
          {
            success: false,
            error: errorMessage,
            details: cloudinaryError.message || 'Unknown error',
            allowManualEntry: true, // Allow user to try again
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'GPS data not found in image EXIF metadata. Please enter location manually using the coordinates visible in the image overlay.',
          gpsFound: false,
          photoUrl, // Return photoUrl so user can proceed
          imagePublicId,
          allowManualEntry: true, // Flag to indicate manual entry is allowed
        },
        { status: 200 } // Return 200 so UI can still proceed
      );
    }

    // Step 2: Reverse geocode to get address details
    // Try Google Maps API first if key is available, otherwise use OpenStreetMap
    const geocodeResult = process.env.GOOGLE_MAPS_API_KEY
      ? await reverseGeocodeGoogle(gpsData.latitude, gpsData.longitude)
      : await reverseGeocode(gpsData.latitude, gpsData.longitude);

    // Step 3: Upload image to Cloudinary
    let photoUrl: string;
    let imagePublicId: string;

    try {
      // Validate Cloudinary config before upload
      if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
        throw new Error('Cloudinary credentials are not configured. Please check your .env.local file.');
      }

      // Convert buffer to base64 for Cloudinary
      const base64Image = imageBuffer.toString('base64');
      const dataUri = `data:${file.type};base64,${base64Image}`;

      console.log('📤 Uploading to Cloudinary...');
      const uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder: 'shops',
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' }, // Limit size
          { quality: 'auto' }, // Auto quality
        ],
      });

      photoUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
      console.log('✅ Image uploaded successfully:', photoUrl);
    } catch (cloudinaryError: any) {
      console.error('❌ Cloudinary upload error:', cloudinaryError);
      console.error('Error details:', {
        message: cloudinaryError.message,
        http_code: cloudinaryError?.http_code,
        name: cloudinaryError?.name,
      });
      
      let errorMessage = 'Failed to upload image to Cloudinary';
      if (cloudinaryError.message) {
        errorMessage += `: ${cloudinaryError.message}`;
      } else if (cloudinaryError.http_code) {
        errorMessage += ` (HTTP ${cloudinaryError.http_code})`;
      }
      
      // Check if it's a configuration error
      if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
        errorMessage = 'Cloudinary credentials are missing. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env.local file.';
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: cloudinaryError.message || 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Step 4: Return success response with all extracted data
    return NextResponse.json(
      {
        success: true,
        latitude: gpsData.latitude,
        longitude: gpsData.longitude,
        fullAddress: geocodeResult.fullAddress,
        area: geocodeResult.area || '',
        city: geocodeResult.city || '',
        pincode: geocodeResult.pincode || '',
        photoUrl,
        imagePublicId, // Include public ID for potential future updates/deletes
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error extracting metadata from image:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to extract metadata from image',
      },
      { status: 500 }
    );
  }
});

