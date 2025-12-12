import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin, authenticateRequest } from '@/lib/auth';
import Shop from '@/models/Shop'; // Old model (for backward compatibility)
import NewShop from '@/lib/models/Shop'; // New model for image-based shop creation
import Category from '@/models/Category'; // Category model
import { reverseGeocode, reverseGeocodeGoogle } from '@/lib/extractMeta';
import { generateShopUrl } from '@/lib/utils/slugGenerator';

/**
 * POST /api/admin/shops
 * 
 * Creates a new shop from image with GPS data.
 * Supports the new shop model format (shopName, ownerName, etc.)
 * 
 * Steps:
 * 1. Connect to MongoDB
 * 2. Validate required fields
 * 3. If area, city, or pincode is missing, use reverse geocoding API
 * 4. Get admin user ID from request
 * 5. Create and save Shop document with new model
 * 6. Return success response with saved shop
 */
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    // Step 1: Connect to MongoDB
    await connectDB();

    // Get admin user ID from token
    const { user } = authenticateRequest(request);
    
    if (!user || !user.userId) {
      return NextResponse.json(
        { success: false, error: 'Admin user ID is required' },
        { status: 401 }
      );
    }

    const adminUserId = user.userId;

    const body = await request.json();
    const {
      shopName,
      ownerName,
      category,
      mobile,
      area,
      fullAddress,
      city,
      pincode,
      latitude,
      longitude,
      photoUrl,
    } = body;

    // Step 2: Validate required fields
    if (!shopName || !ownerName || !category) {
      return NextResponse.json(
        { success: false, error: 'Shop name, owner name, and category are required' },
        { status: 400 }
      );
    }

    if (!latitude || !longitude) {
      return NextResponse.json(
        { success: false, error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    if (!photoUrl) {
      return NextResponse.json(
        { success: false, error: 'Photo URL is required' },
        { status: 400 }
      );
    }

    // Parse latitude and longitude as numbers
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json(
        { success: false, error: 'Invalid latitude or longitude values' },
        { status: 400 }
      );
    }

    // Step 3: If area, city, or pincode is missing, use reverse geocoding
    let finalArea = area;
    let finalCity = city;
    let finalPincode = pincode;
    let finalFullAddress = fullAddress;

    if (!finalArea || !finalCity || !finalPincode || !finalFullAddress) {
      // Use Google Maps API if available, otherwise OpenStreetMap
      const geocodeResult = process.env.GOOGLE_MAPS_API_KEY
        ? await reverseGeocodeGoogle(lat, lon)
        : await reverseGeocode(lat, lon);
      
      if (!finalArea && geocodeResult.area) finalArea = geocodeResult.area;
      if (!finalCity && geocodeResult.city) finalCity = geocodeResult.city;
      if (!finalPincode && geocodeResult.pincode) finalPincode = geocodeResult.pincode;
      if (!finalFullAddress) finalFullAddress = geocodeResult.fullAddress;
    }

    // Ensure fullAddress is set (required field)
    if (!finalFullAddress) {
      finalFullAddress = `${lat}, ${lon}`;
    }

    // Step 4: Link category to Category model if it exists
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

    // Step 5: Create and save Shop document with new model
    // First create a temporary shop to get the ID, then update with the URL
    const tempShop = await NewShop.create({
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      category: categoryName, // Keep category name for backward compatibility
      categoryRef: categoryRef, // Link to Category model
      mobile: mobile?.trim() || undefined,
      area: finalArea?.trim() || undefined,
      fullAddress: finalFullAddress.trim(),
      city: finalCity?.trim() || undefined,
      pincode: finalPincode?.trim() || undefined,
      latitude: lat,
      longitude: lon,
      photoUrl: photoUrl.trim(),
      iconUrl: photoUrl.trim(), // Same as photoUrl for now
      shopUrl: 'temp', // Temporary value, will be updated
      createdByAdmin: adminUserId,
      paymentStatus: 'PENDING', // Set as pending by default
    });

    // Generate unique shop URL based on shop name and ID
    const shopUrl = generateShopUrl(tempShop.shopName, tempShop._id.toString());
    tempShop.shopUrl = shopUrl;
    await tempShop.save();
    
    const shop = tempShop;

    // Convert shop document to plain object for response
    const shopResponse = {
      _id: shop._id.toString(),
      shopName: shop.shopName,
      ownerName: shop.ownerName,
      category: shop.category,
      mobile: shop.mobile,
      area: shop.area,
      fullAddress: shop.fullAddress,
      city: shop.city,
      pincode: shop.pincode,
      latitude: shop.latitude,
      longitude: shop.longitude,
      photoUrl: shop.photoUrl,
      iconUrl: shop.iconUrl,
      shopUrl: shop.shopUrl, // Include shop URL in response
      createdAt: shop.createdAt,
    };

    return NextResponse.json(
      { success: true, shop: shopResponse },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating shop:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create shop' },
      { status: 500 }
    );
  }
});

/**
 * GET /api/admin/shops
 * 
 * Retrieves all shops (for admin listing)
 * Fetches from both old and new shop models for backward compatibility
 */
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();
    
    // Ensure we're returning JSON
    const headers = {
      'Content-Type': 'application/json',
    };

    // Fetch from both old and new models, populate categoryRef if exists
    // Exclude PENDING shops from regular shops list (only show PAID shops)
    const [oldShops, newShops] = await Promise.all([
      Shop.find({})
        .select('-imageData -iconData') // Exclude Buffer fields from response
        .sort({ createdAt: -1 })
        .lean(),
      NewShop.find({ 
        $or: [
          { paymentStatus: { $exists: false } }, // Old shops without paymentStatus
          { paymentStatus: 'PAID' } // Only PAID shops
        ]
      })
        .populate('categoryRef', 'name slug') // Populate category reference
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // Transform old shops to match new format for consistency
    const transformedOldShops = oldShops.map((shop: any) => ({
      _id: shop._id?.toString() || shop._id,
      shopName: shop.name,
      ownerName: 'N/A', // Old model doesn't have owner
      category: shop.category,
      imageUrl: shop.imageUrl,
      iconUrl: shop.iconUrl,
      photoUrl: shop.imageUrl, // Map to photoUrl for consistency
      latitude: shop.latitude,
      longitude: shop.longitude,
      area: shop.area,
      fullAddress: shop.address,
      address: shop.address, // Keep for backward compatibility
      city: undefined,
      pincode: undefined,
      planType: shop.planType || 'BASIC', // Default to BASIC if not set
      planAmount: shop.planAmount || 100,
      paymentExpiryDate: shop.paymentExpiryDate ? new Date(shop.paymentExpiryDate).toISOString() : undefined,
      lastPaymentDate: shop.lastPaymentDate ? new Date(shop.lastPaymentDate).toISOString() : undefined,
      isVisible: true, // Old shops default to visible
      createdAt: shop.createdAt ? new Date(shop.createdAt).toISOString() : new Date().toISOString(),
    }));

    // Transform new shops - createdByAdmin is ObjectId, we'll keep it as is
    const transformedNewShops = newShops.map((shop: any) => {
      // Use category name from populated categoryRef if available, otherwise use category string
      const categoryName = (shop.categoryRef && typeof shop.categoryRef === 'object' && shop.categoryRef.name) 
        ? shop.categoryRef.name 
        : shop.category;
      
      // Convert ObjectId to string and serialize dates
      const transformed: any = {
        _id: shop._id?.toString() || shop._id,
        shopName: shop.shopName,
        ownerName: shop.ownerName,
        category: categoryName, // Use populated category name or fallback to string
        categoryRef: shop.categoryRef?._id?.toString() || shop.categoryRef?.toString() || shop.categoryRef,
        mobile: shop.mobile,
        area: shop.area,
        fullAddress: shop.fullAddress,
        city: shop.city,
        pincode: shop.pincode,
        latitude: shop.latitude,
        longitude: shop.longitude,
        photoUrl: shop.photoUrl,
        iconUrl: shop.iconUrl,
        planType: shop.planType || 'BASIC', // Ensure planType is always present
        planAmount: shop.planAmount || 100, // Ensure planAmount is always present
        createdByAdmin: shop.createdByAdmin?.toString() || shop.createdByAdmin,
      paymentExpiryDate: shop.paymentExpiryDate ? new Date(shop.paymentExpiryDate).toISOString() : undefined,
      lastPaymentDate: shop.lastPaymentDate ? new Date(shop.lastPaymentDate).toISOString() : undefined,
      visitorCount: shop.visitorCount || 0,
      isVisible: shop.isVisible !== undefined ? shop.isVisible : true, // Default to true if not set
      createdAt: shop.createdAt ? new Date(shop.createdAt).toISOString() : new Date().toISOString(),
      };
      return transformed;
    });

    // Combine both arrays
    const allShops = [...transformedOldShops, ...transformedNewShops];

    // Sort by creation date (newest first)
    allShops.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    return NextResponse.json(
      { success: true, shops: allShops },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching shops:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch shops',
        shops: [], // Return empty array on error
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
