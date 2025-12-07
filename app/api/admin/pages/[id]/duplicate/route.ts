import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import Page from '@/models/Page';

// POST - Duplicate a page
export const POST = requireAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();
    const { id } = await params;

    const originalPage = await Page.findById(id);
    if (!originalPage) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Generate new slug
    let newSlug = `${originalPage.slug}-copy`;
    let counter = 1;
    while (await Page.findOne({ slug: newSlug })) {
      newSlug = `${originalPage.slug}-copy-${counter}`;
      counter++;
    }

    // Create duplicate
    const duplicatedPage = await Page.create({
      title: `${originalPage.title} (Copy)`,
      slug: newSlug,
      content: originalPage.content,
      seoTitle: originalPage.seoTitle,
      seoDescription: originalPage.seoDescription,
      isPublished: false, // Keep unpublished by default
    });

    return NextResponse.json(
      { success: true, page: duplicatedPage },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error duplicating page:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate page', details: error.message },
      { status: 500 }
    );
  }
});

