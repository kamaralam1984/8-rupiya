import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop';
import AdminShop from '@/lib/models/Shop';

/**
 * POST /api/payment/upload-screenshot
 * Upload payment screenshot and update shop payment status
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const paymentId = formData.get('paymentId') as string;
    const amount = formData.get('amount') as string;
    const shopName = formData.get('shopName') as string;
    const ownerName = formData.get('ownerName') as string;
    const mobile = formData.get('mobile') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'payment-screenshots');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = `payment-${paymentId}-${timestamp}-${random}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Generate public URL
    const screenshotUrl = `/uploads/payment-screenshots/${filename}`;

    // Update shop payment status with screenshot
    try {
      const agentShop = await AgentShop.findOne({
        shopName: shopName,
        ownerName: ownerName,
        mobile: mobile,
      });

      if (agentShop) {
        agentShop.paymentStatus = 'PAID';
        agentShop.paymentMode = 'UPI';
        agentShop.paymentScreenshot = screenshotUrl;
        agentShop.lastPaymentDate = new Date();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 365);
        agentShop.paymentExpiryDate = expiryDate;
        await agentShop.save();
      }

      // Also update admin shop
      const adminShop = await AdminShop.findOne({
        shopName: shopName,
        ownerName: ownerName,
      });

      if (adminShop) {
        adminShop.lastPaymentDate = new Date();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 365);
        adminShop.paymentExpiryDate = expiryDate;
        await adminShop.save();
      }
    } catch (updateError) {
      console.error('Error updating shop payment:', updateError);
      // Continue even if update fails - screenshot is saved
    }

    return NextResponse.json(
      {
        success: true,
        screenshotUrl: screenshotUrl,
        message: 'Screenshot uploaded successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Screenshot upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload screenshot' },
      { status: 500 }
    );
  }
}

