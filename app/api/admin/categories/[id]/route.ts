import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import Category from '@/models/Category';
import AdminShop from '@/lib/models/Shop';
import AgentShop from '@/lib/models/AgentShop';

// GET - Get single category
export const GET = requireAdmin(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();
    const { id } = await context.params;
    const category = await Category.findById(id).lean();

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, category }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category', details: error.message },
      { status: 500 }
    );
  }
});

// PUT - Update category
export const PUT = requireAdmin(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();
    const { id } = await context.params;

    const body = await request.json();
    const { name, slug, description, imageUrl, latitude, longitude, isActive } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const category = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, category },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating category:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Category with this slug already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update category', details: error.message },
      { status: 500 }
    );
  }
});

// DELETE - Delete category
export const DELETE = requireAdmin(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();
    const { id } = await context.params;
    
    // First, find the category to get its name
    const category = await Category.findById(id);
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category is being used by any shops
    const categoryName = category.name;
    const [adminShopCount, agentShopCount] = await Promise.all([
      AdminShop.countDocuments({
        $or: [
          { category: categoryName },
          { categoryRef: id }
        ]
      }),
      AgentShop.countDocuments({
        category: categoryName
      })
    ]);

    const totalShopCount = adminShopCount + agentShopCount;

    if (totalShopCount > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete category. It is being used by ${totalShopCount} shop(s). Please remove or reassign shops from this category first.`,
          shopCount: totalShopCount,
          adminShopCount,
          agentShopCount
        },
        { status: 400 }
      );
    }

    // Safe to delete - no shops are using this category
    await Category.findByIdAndDelete(id);

    return NextResponse.json(
      { success: true, message: 'Category deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category', details: error.message },
      { status: 500 }
    );
  }
});

