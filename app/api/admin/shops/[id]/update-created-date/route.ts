import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminShop from '@/lib/models/Shop';
import Shop from '@/models/Shop'; // Old Shop model
import AgentShop from '@/lib/models/AgentShop';
import { requireAdmin } from '@/lib/auth';

/**
 * PUT /api/admin/shops/[id]/update-created-date
 * Admin can update the created date of a shop
 */
export const PUT = requireAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await connectDB();

    const { id } = await params;
    const shopId = id;
    const body = await request.json();
    const { createdAt } = body;

    if (!createdAt) {
      return NextResponse.json(
        { error: 'Created date is required' },
        { status: 400 }
      );
    }

    const newCreatedDate = new Date(createdAt);
    if (isNaN(newCreatedDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    console.log('Updating created date for shop ID:', shopId, 'to:', newCreatedDate);

    // Try to find shop in new AdminShop collection first
    let shop: any = await AdminShop.findById(shopId).lean();
    let isOldModel = false;
    
    // If not found, try old Shop model
    if (!shop) {
      console.log('Shop not found in AdminShop, trying old Shop model...');
      shop = await Shop.findById(shopId).lean();
      isOldModel = true;
    }
    
    if (!shop) {
      console.error('Shop not found in any collection. ID:', shopId);
      return NextResponse.json(
        { error: 'Shop not found', shopId },
        { status: 404 }
      );
    }

    // Update shop created date and recalculate payment expiry
    const newExpiryDate = new Date(newCreatedDate);
    newExpiryDate.setDate(newExpiryDate.getDate() + 365); // 365 days from new created date

    if (!isOldModel) {
      await AdminShop.findByIdAndUpdate(shopId, {
        $set: {
          createdAt: newCreatedDate,
          paymentExpiryDate: newExpiryDate, // Recalculate expiry based on new created date
        }
      });
      console.log('Updated AdminShop created date and expiry');
    } else {
      try {
        await Shop.findByIdAndUpdate(shopId, {
          $set: {
            createdAt: newCreatedDate,
            paymentExpiryDate: newExpiryDate, // Recalculate expiry based on new created date
          }
        });
        console.log('Updated old Shop model created date and expiry');
      } catch (updateError) {
        console.error('Error updating old shop model:', updateError);
        return NextResponse.json(
          { error: 'Failed to update created date', details: updateError },
          { status: 500 }
        );
      }
    }

    // Get shop details for AgentShop update
    const shopName = shop.shopName || shop.name || 'Unknown';
    const ownerName = shop.ownerName || 'N/A';
    const shopMobile = shop.mobile;

    // Update corresponding AgentShop if exists
    try {
      let agentShop = null;
      
      // Strategy 1: Match by shop name, owner name, and mobile (exact match)
      if (shopMobile && shopMobile !== 'N/A') {
        agentShop = await AgentShop.findOne({
          shopName: shopName,
          ownerName: ownerName,
          mobile: shopMobile,
        });
      }
      
      // Strategy 2: Match by shop name and owner name (if mobile doesn't match)
      if (!agentShop) {
        agentShop = await AgentShop.findOne({
          shopName: shopName,
          ownerName: ownerName,
        });
      }
      
      // Strategy 3: Match by shop name only (loose match)
      if (!agentShop) {
        agentShop = await AgentShop.findOne({
          shopName: shopName,
        });
      }

      if (agentShop) {
        agentShop.createdAt = newCreatedDate;
        // Recalculate payment expiry based on new created date
        const newExpiryDate = new Date(newCreatedDate);
        newExpiryDate.setDate(newExpiryDate.getDate() + 365);
        agentShop.paymentExpiryDate = newExpiryDate;
        await agentShop.save();
        console.log('Updated AgentShop created date and expiry');
      } else {
        console.log('No matching AgentShop found to update');
      }
    } catch (agentShopError) {
      console.error('Error updating agent shop:', agentShopError);
      // Continue even if agent shop update fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Created date updated successfully',
        shop: {
          _id: shop._id?.toString(),
          createdAt: newCreatedDate.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update created date error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

