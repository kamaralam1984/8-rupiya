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
    
    // Clean up empty strings to undefined for optional fields
    const cleanDescription = description?.trim() || undefined;
    const cleanImageUrl = imageUrl?.trim() || undefined;
    const cleanSlug = slug?.trim() || undefined;

    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Auto-generate slug if not provided
    let categorySlug = cleanSlug || name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

    // Ensure slug is not empty and starts with alphanumeric
    if (!categorySlug || categorySlug.length === 0) {
      categorySlug = `category-${Date.now()}`;
    }

    // Ensure slug starts with alphanumeric character (required by schema)
    if (!/^[a-z0-9]/.test(categorySlug)) {
      categorySlug = `cat-${categorySlug}`;
    }

    // Ensure slug ends with alphanumeric character
    if (!/[a-z0-9]$/.test(categorySlug)) {
      categorySlug = `${categorySlug}1`;
    }

    // Check if slug already exists
    const existing = await Category.findOne({ slug: categorySlug });
    if (existing) {
      categorySlug = `${categorySlug}-${Date.now()}`;
    }

    const category = await Category.create({
      name: name.trim(),
      slug: categorySlug,
      description: cleanDescription,
      imageUrl: cleanImageUrl,
      latitude: latitude && latitude !== '' ? parseFloat(latitude.toString()) : undefined,
      longitude: longitude && longitude !== '' ? parseFloat(longitude.toString()) : undefined,
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json(
      { success: true, category },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating category:', error);
    
    // Handle duplicate key error (slug already exists)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Category with this slug already exists', details: 'Please use a different name or slug' },
        { status: 409 }
      );
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors || {}).map((err: any) => err.message).join(', ');
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors || error.message },
        { status: 400 }
      );
    }
    
    // Handle other errors
    return NextResponse.json(
      { 
        error: 'Failed to create category', 
        details: error.message || 'Unknown error occurred',
        errorType: error.name || 'Unknown'
      },
      { status: 500 }
    );
  }
});

