import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import Category from '@/models/Category';

// GET - List all categories
export const GET = requireAdmin(async (request: NextRequest, context: any) => {
  try {
    await connectDB();

    const categories = await Category.find({})
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ success: true, categories }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: error.message },
      { status: 500 }
    );
  }
});

// POST - Create new category
export const POST = requireAdmin(async (request: NextRequest, context: any) => {
  try {
    await connectDB();

    const body = await request.json();
    const { name, slug, description, imageUrl, latitude, longitude, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Auto-generate slug if not provided
    let categorySlug = slug || name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug already exists
    const existing = await Category.findOne({ slug: categorySlug });
    if (existing) {
      categorySlug = `${categorySlug}-${Date.now()}`;
    }

    const category = await Category.create({
      name,
      slug: categorySlug,
      description,
      imageUrl,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json(
      { success: true, category },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating category:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Category with this slug already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create category', details: error.message },
      { status: 500 }
    );
  }
});

