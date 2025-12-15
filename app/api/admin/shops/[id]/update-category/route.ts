import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import AdminShop from '@/lib/models/Shop';
import Shop from '@/models/Shop'; // Old Shop model
import AgentShop from '@/lib/models/AgentShop';
import Category from '@/models/Category';

/**
 * PATCH /api/admin/shops/[id]/update-category
 * 
 * Updates a shop's category and links it to Category model
 */
export const PATCH = requireAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { category } = body;

    if (!category || !category.trim()) {
      return NextResponse.json(
        { success: false, error: 'Category is required' },
        { status: 400 }
      );
    }

    // Try to find shop in new AdminShop collection first
    let shop: any = await AdminShop.findById(id);
    let isOldModel = false;
    
    // If not found, try old Shop model
    if (!shop) {
      shop = await Shop.findById(id);
      isOldModel = true;
    }
    
    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Try to find category by name or slug
    const categoryName = category.trim();
    const foundCategory = await Category.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${categoryName}$`, 'i') } },
        { slug: { $regex: new RegExp(`^${categoryName.toLowerCase().replace(/\s+/g, '-')}$`, 'i') } }
      ],
      isActive: true
    });

    // Update shop category based on model type
    if (!isOldModel) {
      shop.category = categoryName;
      shop.categoryRef = foundCategory ? foundCategory._id : undefined;
      await shop.save();
    } else {
      // For old model, update category only
      shop.category = categoryName;
      await shop.save();
    }
    
    // Update corresponding AgentShop if exists
    try {
      const agentShop = await AgentShop.findOne({
        shopName: shop.shopName || shop.name,
        ownerName: shop.ownerName || 'N/A',
      });

      if (agentShop) {
        agentShop.category = categoryName;
        await agentShop.save();
      }
    } catch (agentShopError) {
      console.error('Error updating agent shop category:', agentShopError);
      // Continue even if agent shop update fails
    }

    return NextResponse.json(
      {
        success: true,
        shop: {
          _id: shop._id.toString(),
          category: shop.category,
          categoryRef: shop.categoryRef?.toString() || null,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating shop category:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update category' },
      { status: 500 }
    );
  }
});

