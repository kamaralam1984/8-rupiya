import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import Business from '@/models/Business';
import Category from '@/models/Category';
import { slugify, extractAreaFromAddress, generateBusinessSlug } from '@/app/utils/businessUtils';
import fs from 'fs';
import path from 'path';

// Mapping of JSON filenames to category slugs
const JSON_TO_CATEGORY_MAP: Record<string, string> = {
  'Restaurants.json': 'restaurants',
  'Hotel.json': 'hotels',
  'beautyspa.json': 'beauty-spa',
  'Home-Decor.json': 'home-decor',
  'Wedding-Planning.json': 'wedding-planning',
  'Education.json': 'education',
  'Rent.json': 'rent-hire',
  'Hospitals.json': 'hospitals',
  'contractor.json': 'contractors',
  'Pet.json': 'pet-shops',
  'Pg.json': 'pg-hostels',
  'Estate-Agent.json': 'estate-agent',
  'dentists.json': 'dentists',
  'Gym.json': 'gym',
  'Loans.json': 'loans',
  'Event-Organisers.json': 'event-organisers',
  'Driving -Schools.json': 'driving-schools',
  'Packers.json': 'packers-movers',
  'courier_service.json': 'courier-service',
};

interface JsonBusiness {
  name: string;
  address: string;
  pincode: string;
}

export const POST = requireAdmin(async (request: NextRequest, user) => {
  try {
    await connectDB();

    const body = await request.json();
    const { categorySlug, fileName, overwrite = false } = body;

    // If categorySlug is provided, use it; otherwise try to infer from fileName
    let targetCategorySlug = categorySlug;
    if (!targetCategorySlug && fileName) {
      targetCategorySlug = JSON_TO_CATEGORY_MAP[fileName];
    }

    if (!targetCategorySlug) {
      return NextResponse.json(
        { error: 'Category slug or valid fileName is required' },
        { status: 400 }
      );
    }

    // Find the category
    const category = await Category.findOne({ slug: targetCategorySlug });
    if (!category) {
      return NextResponse.json(
        { error: `Category with slug "${targetCategorySlug}" not found` },
        { status: 404 }
      );
    }

    // Read the JSON file
    const jsonFilePath = path.join(process.cwd(), 'app', fileName || `${targetCategorySlug}.json`);
    
    if (!fs.existsSync(jsonFilePath)) {
      // Try alternative filename formats
      const alternativeNames = [
        fileName,
        `${targetCategorySlug}.json`,
        Object.keys(JSON_TO_CATEGORY_MAP).find(key => JSON_TO_CATEGORY_MAP[key] === targetCategorySlug),
      ].filter(Boolean) as string[];

      let found = false;
      for (const altName of alternativeNames) {
        const altPath = path.join(process.cwd(), 'app', altName);
        if (fs.existsSync(altPath)) {
          found = true;
          const fileContent = fs.readFileSync(altPath, 'utf-8');
          const businesses: JsonBusiness[] = JSON.parse(fileContent);
          
          // Get existing slugs to avoid duplicates
          const existingBusinesses = await Business.find({ categoryId: category._id });
          const existingSlugs = new Set(existingBusinesses.map(b => b.slug));

          let imported = 0;
          let skipped = 0;
          let errors: string[] = [];

          for (const business of businesses) {
            try {
              // Check if business already exists
              const existingBusiness = existingBusinesses.find(
                b => b.name.toLowerCase() === business.name.toLowerCase() && 
                     b.address.toLowerCase() === business.address.toLowerCase()
              );

              if (existingBusiness && !overwrite) {
                skipped++;
                continue;
              }

              // Generate slug
              const slug = generateBusinessSlug(business.name, existingSlugs);
              existingSlugs.add(slug);

              // Extract area from address
              const area = extractAreaFromAddress(business.address);

              // Prepare business data
              const businessData: any = {
                name: business.name.trim(),
                slug,
                categoryId: category._id,
                address: business.address.trim(),
                pincode: (business.pincode?.trim() || '').replace(/\D+/g, '').slice(0, 6) || '',
                area: area,
                isFeatured: false,
              };

              if (existingBusiness && overwrite) {
                // Update existing business
                await Business.findByIdAndUpdate(existingBusiness._id, businessData);
                imported++;
              } else {
                // Create new business
                await Business.create(businessData);
                imported++;
              }
            } catch (error: any) {
              errors.push(`${business.name}: ${error.message}`);
            }
          }

          return NextResponse.json({
            success: true,
            category: targetCategorySlug,
            imported,
            skipped,
            total: businesses.length,
            errors: errors.length > 0 ? errors : undefined,
          });
        }
      }

      return NextResponse.json(
        { error: `JSON file not found. Tried: ${alternativeNames.join(', ')}` },
        { status: 404 }
      );
    } else {
      const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
      const businesses: JsonBusiness[] = JSON.parse(fileContent);

      // Get existing slugs to avoid duplicates
      const existingBusinesses = await Business.find({ categoryId: category._id });
      const existingSlugs = new Set(existingBusinesses.map(b => b.slug));

      let imported = 0;
      let skipped = 0;
      let errors: string[] = [];

      for (const business of businesses) {
        try {
          // Check if business already exists
          const existingBusiness = existingBusinesses.find(
            b => b.name.toLowerCase() === business.name.toLowerCase() && 
                 b.address.toLowerCase() === business.address.toLowerCase()
          );

          if (existingBusiness && !overwrite) {
            skipped++;
            continue;
          }

          // Generate slug
          const slug = generateBusinessSlug(business.name, existingSlugs);
          existingSlugs.add(slug);

          // Extract area from address
          const area = extractAreaFromAddress(business.address);

          // Prepare business data
          const businessData: any = {
            name: business.name.trim(),
            slug,
            categoryId: category._id,
            address: business.address.trim(),
                pincode: (business.pincode?.trim() || '').replace(/\D+/g, '').slice(0, 6) || '',
            area: area,
            isFeatured: false,
          };

          if (existingBusiness && overwrite) {
            // Update existing business
            await Business.findByIdAndUpdate(existingBusiness._id, businessData);
            imported++;
          } else {
            // Create new business
            await Business.create(businessData);
            imported++;
          }
        } catch (error: any) {
          errors.push(`${business.name}: ${error.message}`);
        }
      }

      return NextResponse.json({
        success: true,
        category: targetCategorySlug,
        imported,
        skipped,
        total: businesses.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    }
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Failed to import businesses', details: error.message },
      { status: 500 }
    );
  }
});

/**
 * Import all businesses from all JSON files
 */
export const PUT = requireAdmin(async (request: NextRequest, user) => {
  try {
    await connectDB();

    const body = await request.json();
    const { overwrite = false } = body;

    const appDir = path.join(process.cwd(), 'app');
    const results: Record<string, any> = {};

    // Process each JSON file
    for (const [fileName, categorySlug] of Object.entries(JSON_TO_CATEGORY_MAP)) {
      const jsonFilePath = path.join(appDir, fileName);
      
      if (!fs.existsSync(jsonFilePath)) {
        results[categorySlug] = { error: `File not found: ${fileName}` };
        continue;
      }

      try {
        const category = await Category.findOne({ slug: categorySlug });
        if (!category) {
          results[categorySlug] = { error: `Category not found: ${categorySlug}` };
          continue;
        }

        const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
        const businesses: JsonBusiness[] = JSON.parse(fileContent);

        // Get existing slugs to avoid duplicates
        const existingBusinesses = await Business.find({ categoryId: category._id });
        const existingSlugs = new Set(existingBusinesses.map(b => b.slug));

        let imported = 0;
        let skipped = 0;
        let errors: string[] = [];

        for (const business of businesses) {
          try {
            // Check if business already exists
            const existingBusiness = existingBusinesses.find(
              b => b.name.toLowerCase() === business.name.toLowerCase() && 
                   b.address.toLowerCase() === business.address.toLowerCase()
            );

            if (existingBusiness && !overwrite) {
              skipped++;
              continue;
            }

            // Generate slug
            const slug = generateBusinessSlug(business.name, existingSlugs);
            existingSlugs.add(slug);

            // Extract area from address
            const area = extractAreaFromAddress(business.address);

            // Prepare business data
            const businessData: any = {
              name: business.name.trim(),
              slug,
              categoryId: category._id,
              address: business.address.trim(),
                pincode: (business.pincode?.trim() || '').replace(/\D+/g, '').slice(0, 6) || '',
              area: area,
              isFeatured: false,
            };

            if (existingBusiness && overwrite) {
              // Update existing business
              await Business.findByIdAndUpdate(existingBusiness._id, businessData);
              imported++;
            } else {
              // Create new business
              await Business.create(businessData);
              imported++;
            }
          } catch (error: any) {
            errors.push(`${business.name}: ${error.message}`);
          }
        }

        results[categorySlug] = {
          success: true,
          imported,
          skipped,
          total: businesses.length,
          errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Limit errors to first 10
        };
      } catch (error: any) {
        results[categorySlug] = { error: error.message };
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Failed to import businesses', details: error.message },
      { status: 500 }
    );
  }
});

