import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import Category from '@/models/Category';
import { readdir } from 'fs/promises';
import { join } from 'path';

/**
 * Normalize a string for matching (lowercase, remove special chars, spaces)
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, '') // Remove spaces
    .trim();
}

/**
 * Extract keywords from a filename (remove common words, extensions, etc.)
 */
function extractKeywords(filename: string): string[] {
  const withoutExt = filename.replace(/\.(jpeg|jpg|png|gif|webp)$/i, '');
  const normalized = normalizeString(withoutExt);
  
  // Remove common words
  const commonWords = ['download', 'free', 'vector', 'image', 'photo', 'picture', 'icon', 'logo', 'design', 'template', 'premium', 'stock', 'adobe', 'freepik', 'png', 'transparent', 'background', 'isolated', 'flat', 'style', 'illustration', 'hd', 'images', 'clipart', 'for', 'and', 'the', 'a', 'an', 'on', 'in', 'at', 'to', 'of', 'with', 'from'];
  
  const words = normalized.split(/\s+/).filter(word => 
    word.length > 2 && !commonWords.includes(word)
  );
  
  return words;
}

/**
 * Match category to icon filename
 */
function matchCategoryToIcon(categoryName: string, categorySlug: string, iconFilename: string): number {
  const normalizedCategory = normalizeString(categoryName);
  const normalizedSlug = normalizeString(categorySlug);
  const normalizedIcon = normalizeString(iconFilename.replace(/\.(jpeg|jpg|png|gif|webp)$/i, ''));
  
  // Exact match
  if (normalizedIcon === normalizedCategory || normalizedIcon === normalizedSlug) {
    return 100;
  }
  
  // Contains match
  if (normalizedIcon.includes(normalizedCategory) || normalizedCategory.includes(normalizedIcon)) {
    return 80;
  }
  
  if (normalizedIcon.includes(normalizedSlug) || normalizedSlug.includes(normalizedIcon)) {
    return 75;
  }
  
  // Keyword matching
  const categoryKeywords = extractKeywords(categoryName);
  const iconKeywords = extractKeywords(iconFilename);
  
  let matchScore = 0;
  for (const catKeyword of categoryKeywords) {
    for (const iconKeyword of iconKeywords) {
      if (catKeyword === iconKeyword) {
        matchScore += 20;
      } else if (catKeyword.includes(iconKeyword) || iconKeyword.includes(catKeyword)) {
        matchScore += 10;
      }
    }
  }
  
  return matchScore;
}

/**
 * POST - Update all category icons from public/catagory-icon folder
 */
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();
    
    // Read all icon files from public/catagory-icon
    const iconDir = join(process.cwd(), 'public', 'catagory-icon');
    let iconFiles: string[];
    
    try {
      iconFiles = await readdir(iconDir);
    } catch (error: any) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to read icon directory', 
          details: error.message 
        },
        { status: 500 }
      );
    }
    
    // Filter only image files
    const imageFiles = iconFiles.filter(file => 
      /\.(jpeg|jpg|png|gif|webp)$/i.test(file)
    );
    
    if (imageFiles.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No image files found in catagory-icon directory' 
        },
        { status: 400 }
      );
    }
    
    // Get all categories
    const categories = await Category.find({}).lean();
    
    if (categories.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No categories found in database' 
        },
        { status: 400 }
      );
    }
    
    const results: Array<{
      categoryId: string;
      categoryName: string;
      iconFile: string;
      iconUrl: string;
      matched: boolean;
      score?: number;
    }> = [];
    
    let updatedCount = 0;
    let matchedCount = 0;
    
    // Match each category to an icon
    for (const category of categories) {
      let bestMatch: { file: string; score: number } | null = null;
      
      // Find best matching icon
      for (const iconFile of imageFiles) {
        const score = matchCategoryToIcon(
          category.name,
          category.slug,
          iconFile
        );
        
        if (score > 0 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { file: iconFile, score };
        }
      }
      
      // If we found a match with score >= 50, update the category
      if (bestMatch && bestMatch.score >= 50) {
        const iconUrl = `/catagory-icon/${bestMatch.file}`;
        
        await Category.updateOne(
          { _id: category._id },
          { $set: { imageUrl: iconUrl } }
        );
        
        updatedCount++;
        matchedCount++;
        
        results.push({
          categoryId: category._id.toString(),
          categoryName: category.name,
          iconFile: bestMatch.file,
          iconUrl,
          matched: true,
          score: bestMatch.score,
        });
      } else {
        // No good match found
        results.push({
          categoryId: category._id.toString(),
          categoryName: category.name,
          iconFile: '',
          iconUrl: category.imageUrl || '',
          matched: false,
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} category icons`,
      stats: {
        totalCategories: categories.length,
        totalIcons: imageFiles.length,
        matched: matchedCount,
        updated: updatedCount,
        unmatched: categories.length - matchedCount,
      },
      results,
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error updating category icons:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update category icons', 
        details: error.message 
      },
      { status: 500 }
    );
  }
});


