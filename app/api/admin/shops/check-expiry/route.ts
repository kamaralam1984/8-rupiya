import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminShop from '@/lib/models/Shop';
import RenewShop from '@/lib/models/RenewShop';
import AgentShop from '@/lib/models/AgentShop';
import { requireAdmin } from '@/lib/auth';

/**
 * POST /api/admin/shops/check-expiry
 * Check for expired shops and move them to renew collection
 * This should be called periodically (cron job) or manually
 */
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const now = new Date();

    // Find all expired shops
    // Check shops where paymentExpiryDate has passed OR where createdAt + 365 days has passed
    const expiredShops = await AdminShop.find({
      $or: [
        { paymentExpiryDate: { $lt: now } },
        {
          $expr: {
            $lt: [
              { $add: ['$createdAt', 365 * 24 * 60 * 60 * 1000] }, // createdAt + 365 days in milliseconds
              now
            ]
          }
        }
      ]
    }).lean();

    let movedCount = 0;
    const errors: string[] = [];

    for (const shop of expiredShops) {
      try {
        // Check if already in renew collection
        const existingRenew = await RenewShop.findOne({
          originalShopId: shop._id,
        });

        if (existingRenew) {
          continue; // Already moved
        }

        // Find corresponding AgentShop if exists
        let agentShopId = null;
        try {
          const agentShop = await AgentShop.findOne({
            shopName: shop.shopName,
            ownerName: shop.ownerName,
            mobile: shop.mobile || undefined,
          });
          if (agentShop) {
            agentShopId = agentShop._id;
          }
        } catch (agentShopError) {
          console.error('Error finding agent shop:', agentShopError);
        }

        // Calculate expiry date (use paymentExpiryDate if exists, otherwise createdAt + 365 days)
        const expiryDate = shop.paymentExpiryDate 
          ? new Date(shop.paymentExpiryDate)
          : new Date(new Date(shop.createdAt).getTime() + 365 * 24 * 60 * 60 * 1000);

        // Create renew shop entry
        await RenewShop.create({
          shopName: shop.shopName,
          ownerName: shop.ownerName,
          mobile: shop.mobile || 'N/A',
          category: shop.category,
          pincode: shop.pincode || '',
          address: shop.fullAddress,
          photoUrl: shop.photoUrl,
          latitude: shop.latitude,
          longitude: shop.longitude,
          originalShopId: shop._id,
          originalAgentShopId: agentShopId,
          expiredDate: expiryDate,
          createdAt: shop.createdAt,
          lastPaymentDate: shop.lastPaymentDate || shop.createdAt,
        });

        // Delete from main shops collection
        await AdminShop.findByIdAndDelete(shop._id);

        movedCount++;
      } catch (error: any) {
        errors.push(`Error moving shop ${shop._id}: ${error.message}`);
        console.error(`Error moving shop ${shop._id}:`, error);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Moved ${movedCount} expired shops to renew collection`,
        movedCount,
        totalExpired: expiredShops.length,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Check expiry error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

/**
 * GET /api/admin/shops/check-expiry
 * Get count of expired shops without moving them
 */
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const now = new Date();

    const expiredCount = await AdminShop.countDocuments({
      paymentExpiryDate: { $lt: now },
    });

    const renewCount = await RenewShop.countDocuments();

    return NextResponse.json(
      {
        success: true,
        expiredCount,
        renewCount,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get expiry stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

