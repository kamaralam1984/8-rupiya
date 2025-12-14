import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HeroSectionSettings from '@/models/HeroSectionSettings';
import { requireAdmin } from '@/lib/auth';

/**
 * GET /api/admin/hero-section
 * Get hero section settings
 */
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    // Get or create default settings
    let settings = await HeroSectionSettings.findOne();
    
    if (!settings) {
      // Create default settings
      settings = await HeroSectionSettings.create({});
    }

    return NextResponse.json({
      success: true,
      settings: settings.toObject(),
    });
  } catch (error: any) {
    console.error('Error fetching hero section settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch hero section settings',
        details: error.message,
      },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/admin/hero-section
 * Update hero section settings
 */
export const PUT = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const body = await request.json();

    // Get or create settings
    let settings = await HeroSectionSettings.findOne();

    if (!settings) {
      settings = await HeroSectionSettings.create(body);
    } else {
      // Update settings
      Object.assign(settings, body);
      await settings.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Hero section settings updated successfully',
      settings: settings.toObject(),
    });
  } catch (error: any) {
    console.error('Error updating hero section settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update hero section settings',
        details: error.message,
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/hero-section/reset
 * Reset to default settings
 */
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const { action } = await request.json();

    if (action === 'reset') {
      // Delete existing settings and create new default
      await HeroSectionSettings.deleteMany({});
      const defaultSettings = await HeroSectionSettings.create({});

      return NextResponse.json({
        success: true,
        message: 'Hero section settings reset to default',
        settings: defaultSettings.toObject(),
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error resetting hero section settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset hero section settings',
        details: error.message,
      },
      { status: 500 }
    );
  }
});


