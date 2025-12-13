import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import HomepageSettings from '@/models/HomepageSettings';

// GET - Get homepage settings
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    let settings = await HomepageSettings.findOne({ isActive: true }).lean();

    // If settings exist but heroSections is missing, add defaults
    if (settings && !settings.heroSections) {
      settings = {
        ...settings,
        heroSections: {
          leftRail: true,
          rightRail: true,
          bottomRail: true,
          bottomStrip: true,
        },
      };
    }

    // If no settings exist, create default
    if (!settings) {
      const defaultSettings = await HomepageSettings.create({
        sections: {
          hero: true,
          categories: true,
          offers: true,
          featuredBusinesses: true,
          topRated: true,
          newBusinesses: true,
        },
        heroSections: {
          leftRail: true,
          rightRail: true,
          bottomRail: true,
          bottomStrip: true,
        },
        shopConfig: {
          enabled: false,
          featuredShops: [],
          categories: [],
          displayCount: 12,
        },
        functions: {
          searchBar: true,
          locationFilter: true,
          categoryFilter: true,
          priceFilter: false,
          ratingFilter: true,
          sortOptions: true,
          quickView: false,
          compare: false,
          wishlist: false,
        },
        layout: {
          theme: 'light',
          primaryColor: '#3b82f6',
          secondaryColor: '#8b5cf6',
          containerWidth: '98%',
          sectionSpacing: '40px',
        },
        isActive: true,
      });
      settings = defaultSettings.toObject() as any;
    }

    return NextResponse.json({ success: true, settings }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching homepage settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homepage settings', details: error.message },
      { status: 500 }
    );
  }
});

// PUT - Update homepage settings
export const PUT = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const body = await request.json();
    
    // Remove _id, createdAt, updatedAt if present to avoid update issues
    const { _id, createdAt, updatedAt, ...cleanBody } = body;
    
    // Validate required fields
    if (!cleanBody.sections || !cleanBody.functions || !cleanBody.layout) {
      return NextResponse.json(
        { success: false, error: 'Invalid settings data. Sections, functions, and layout are required.' },
        { status: 400 }
      );
    }

    // Find existing active settings first
    let settings = await HomepageSettings.findOne({ isActive: true });

    if (settings) {
      // Update existing settings - merge nested objects properly
      if (cleanBody.sections) {
        settings.sections = { ...settings.sections, ...cleanBody.sections };
      }
      if (cleanBody.heroSections) {
        settings.heroSections = { ...settings.heroSections, ...cleanBody.heroSections };
      }
      if (cleanBody.shopConfig) {
        settings.shopConfig = { ...settings.shopConfig, ...cleanBody.shopConfig };
      }
      if (cleanBody.functions) {
        settings.functions = { ...settings.functions, ...cleanBody.functions };
      }
      if (cleanBody.layout) {
        settings.layout = { ...settings.layout, ...cleanBody.layout };
      }
      settings.isActive = true;
      await settings.save();
    } else {
      // Create new settings if none exist
      settings = await HomepageSettings.create({
        sections: cleanBody.sections || {
          hero: true,
          categories: true,
          offers: true,
          featuredBusinesses: true,
          topRated: true,
          newBusinesses: true,
        },
        heroSections: cleanBody.heroSections || {
          leftRail: true,
          rightRail: true,
          bottomRail: true,
          bottomStrip: true,
        },
        shopConfig: cleanBody.shopConfig || {
          enabled: false,
          featuredShops: [],
          categories: [],
          displayCount: 12,
        },
        functions: cleanBody.functions || {
          searchBar: true,
          locationFilter: true,
          categoryFilter: true,
          priceFilter: false,
          ratingFilter: true,
          sortOptions: true,
          quickView: false,
          compare: false,
          wishlist: false,
        },
        layout: cleanBody.layout || {
          theme: 'light',
          primaryColor: '#3b82f6',
          secondaryColor: '#8b5cf6',
          containerWidth: '98%',
          sectionSpacing: '40px',
        },
        isActive: true,
      });
    }

    const savedSettings = settings.toObject();
    return NextResponse.json({ 
      success: true, 
      settings: savedSettings,
      message: 'Homepage settings saved successfully'
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating homepage settings:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack,
    });
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update homepage settings', 
        details: error.message || 'Unknown error occurred',
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error.stack,
          errorName: error.name,
          errorCode: error.code,
        }),
      },
      { status: 500 }
    );
  }
});

// POST - Duplicate homepage as new page
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();
    const body = await request.json();
    const { pageTitle, pageSlug, includeShops, includeFunctions } = body;

    if (!pageTitle || !pageSlug) {
      return NextResponse.json(
        { error: 'Page title and slug are required' },
        { status: 400 }
      );
    }

    // Get current homepage settings
    const homepageSettings = await HomepageSettings.findOne({ isActive: true }).lean();
    
    if (!homepageSettings) {
      return NextResponse.json(
        { error: 'Homepage settings not found' },
        { status: 404 }
      );
    }

    // Import Page model
    const Page = (await import('@/models/Page')).default;

    // Check if slug already exists
    const existingPage = await Page.findOne({ slug: pageSlug });
    if (existingPage) {
      return NextResponse.json(
        { error: 'Page with this slug already exists. Please use a different slug.' },
        { status: 409 }
      );
    }

    // Create comprehensive page content with homepage structure
    const sectionsList = [];
    if (homepageSettings.sections.hero) sectionsList.push('Hero Section');
    if (homepageSettings.sections.categories) sectionsList.push('Categories Grid');
    if (homepageSettings.sections.offers) sectionsList.push('Latest Offers');
    if (homepageSettings.sections.featuredBusinesses) sectionsList.push('Featured Businesses');
    if (homepageSettings.sections.topRated) sectionsList.push('Top Rated Businesses');
    if (homepageSettings.sections.newBusinesses) sectionsList.push('New Businesses');
    if (includeShops && homepageSettings.shopConfig.enabled) sectionsList.push('Shop Directory');

    // Create homepage config JSON
    const homepageConfig = {
      sections: homepageSettings.sections,
      shopConfig: includeShops ? homepageSettings.shopConfig : null,
      functions: includeFunctions ? homepageSettings.functions : null,
      layout: homepageSettings.layout,
      duplicated: true,
      originalTitle: 'Homepage',
      duplicatedAt: new Date().toISOString(),
    };

    // Create page content with homepage duplicate marker
    // The dynamic page route will detect this and render with homepage components
    const pageContent = `
      <!-- HOMEPAGE_DUPLICATE_PAGE -->
      <div class="homepage-duplicate-page" data-homepage-duplicate="true" style="display: none;">
        <script type="application/json" id="homepage-config">
          ${JSON.stringify(homepageConfig, null, 2)}
        </script>
        <script>
          if (typeof window !== 'undefined') {
            window.homepageConfig = ${JSON.stringify(homepageConfig)};
          }
        </script>
      </div>
    `;

    // Create page with all homepage settings
    const page = await Page.create({
      title: pageTitle,
      slug: pageSlug,
      content: pageContent,
      seoTitle: `${pageTitle} - Shop Directory & Business Listings`,
      seoDescription: `Browse and discover ${pageTitle} with our comprehensive shop directory. ${includeShops ? 'Shop listings included.' : ''} ${includeFunctions ? 'Advanced search and filter functions available.' : ''}`,
      isPublished: true,
      designSettings: {
        backgroundColor: homepageSettings.layout.theme === 'dark' ? '#1f2937' : '#ffffff',
        textColor: homepageSettings.layout.theme === 'dark' ? '#f9fafb' : '#111827',
        primaryColor: homepageSettings.layout.primaryColor,
        secondaryColor: homepageSettings.layout.secondaryColor,
        accentColor: homepageSettings.layout.secondaryColor,
        linkColor: homepageSettings.layout.primaryColor,
        layout: 'container',
        maxWidth: homepageSettings.layout.containerWidth,
        padding: '20px',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        lineHeight: '1.6',
        sectionSpacing: homepageSettings.layout.sectionSpacing,
        contentSpacing: '20px',
        borderRadius: '8px',
        effects: {
          fadeIn: true,
          slideUp: true,
        },
        functions: includeFunctions ? {
          ...homepageSettings.functions,
          searchHighlight: homepageSettings.functions.searchBar,
          responsiveImages: true,
          seoOptimized: true,
        } : {
          seoOptimized: true,
          responsiveImages: true,
        },
        customCSS: `
          .homepage-duplicate-page {
            max-width: ${homepageSettings.layout.containerWidth};
            margin: 0 auto;
            padding: ${homepageSettings.layout.sectionSpacing};
          }
          .page-header {
            text-align: center;
            margin-bottom: ${homepageSettings.layout.sectionSpacing};
          }
          .page-title {
            color: ${homepageSettings.layout.primaryColor};
            font-size: 2.5rem;
            margin-bottom: 1rem;
          }
          section {
            margin-bottom: ${homepageSettings.layout.sectionSpacing};
            padding: 2rem;
            background: ${homepageSettings.layout.theme === 'dark' ? '#374151' : '#f9fafb'};
            border-radius: 8px;
          }
        `,
        customJS: includeFunctions ? `
          // Initialize functions for duplicate homepage
          if (window.homepageConfig && window.homepageConfig.functions) {
            console.log('Homepage functions initialized:', window.homepageConfig.functions);
          }
        ` : '',
      },
    });

    // Return the created page with success message
    return NextResponse.json(
      {
        success: true,
        page: {
          _id: page._id,
          title: page.title,
          slug: page.slug,
          isPublished: page.isPublished,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt,
        },
        message: `Page "${pageTitle}" has been created successfully with ${sectionsList.length} sections${includeShops ? ' and shop directory' : ''}${includeFunctions ? ' and all functions' : ''}.`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error duplicating homepage:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Page with this slug already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to duplicate homepage', details: error.message },
      { status: 500 }
    );
  }
});

