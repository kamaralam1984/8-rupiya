import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import Page from '@/models/Page';

// GET, PUT, DELETE for single page
export const GET = requireAdmin(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();
    const { id: pageId } = await context.params;
    
    if (!pageId) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }
    
    const page = await Page.findById(pageId).lean();
    if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    return NextResponse.json({ success: true, page }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch page', details: error.message }, { status: 500 });
  }
});

export const PUT = requireAdmin(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();
    const { id: pageId } = await context.params;
    
    if (!pageId) {
      console.error('Page ID is missing');
      return NextResponse.json(
        { error: 'Page ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('PUT request received for page:', pageId);
    console.log('Request body keys:', Object.keys(body));
    
    const { title, slug, content, seoTitle, seoDescription, isPublished, designSettings } = body;

    // Find existing page first
    const existingPage = await Page.findById(pageId);
    if (!existingPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Validation
    if (title !== undefined) {
      if (!title || !title.trim()) {
        return NextResponse.json(
          { error: 'Page title cannot be empty' },
          { status: 400 }
        );
      }
    }

    // Ensure content is always provided (even if empty, use placeholder)
    let pageContent = undefined;
    if (content !== undefined) {
      const trimmedContent = typeof content === 'string' ? content.trim() : String(content || '').trim();
      pageContent = trimmedContent || '<div><p>Page content will be added using the drag & drop builder</p></div>';
    }

    // Prepare update data - only include fields that are being updated
    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (slug !== undefined) {
      const slugString = String(slug || '').trim().toLowerCase();
      const formattedSlug = slugString.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      
      if (!formattedSlug) {
        return NextResponse.json(
          { error: 'Invalid slug format. Slug cannot be empty.' },
          { status: 400 }
        );
      }
      
      // Validate slug format matches schema pattern
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formattedSlug)) {
        return NextResponse.json(
          { error: 'Invalid slug format. Use only lowercase letters, numbers, and hyphens.' },
          { status: 400 }
        );
      }
      
      if (formattedSlug !== existingPage.slug) {
        // Check if new slug already exists
        const slugExists = await Page.findOne({ slug: formattedSlug, _id: { $ne: pageId } });
        if (slugExists) {
          return NextResponse.json(
            { error: 'Page with this slug already exists', details: 'Please use a different slug' },
            { status: 409 }
          );
        }
        updateData.slug = formattedSlug;
      }
    }
    if (pageContent !== undefined) updateData.content = pageContent;
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle?.trim() || null;
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription?.trim() || null;
    if (isPublished !== undefined) updateData.isPublished = Boolean(isPublished);
    if (designSettings !== undefined) {
      updateData.designSettings = designSettings || {};
    }

    console.log('Update data:', {
      ...updateData,
      contentLength: updateData.content?.length || 0,
      designSettingsKeys: updateData.designSettings ? Object.keys(updateData.designSettings) : [],
    });

    // Update the page
    const page = await Page.findByIdAndUpdate(
      pageId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!page) {
      return NextResponse.json({ error: 'Page not found after update' }, { status: 404 });
    }

    return NextResponse.json({ success: true, page }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating page:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      errors: error.errors,
      stack: error.stack?.split('\n').slice(0, 5),
    });
    
    // Handle duplicate slug error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Page with this slug already exists', details: 'Please use a different slug' },
        { status: 409 }
      );
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors || {}).map((err: any) => err.message).join(', ');
      console.error('Validation errors:', validationErrors);
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors || error.message },
        { status: 400 }
      );
    }

    // Handle cast errors (invalid ID format)
    if (error.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid page ID format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to update page', 
        details: error.message || 'Unknown error occurred',
        errorType: error.name,
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error.stack,
        }),
      },
      { status: 500 }
    );
  }
});

export const DELETE = requireAdmin(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();
    const { id: pageId } = await context.params;
    
    if (!pageId) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }
    
    const page = await Page.findByIdAndDelete(pageId);
    if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Page deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete page', details: error.message }, { status: 500 });
  }
});

