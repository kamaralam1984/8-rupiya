import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Logo from '@/lib/models/Logo';
import { authenticateRequest } from '@/lib/auth';
import mongoose from 'mongoose';

/**
 * GET /api/admin/logos/[id]/download?format=png|svg|pdf
 * Download logo in specified format
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = authenticateRequest(request);
    if (!authResult.user || authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (!['admin', 'editor'].includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin or Editor access required' },
        { status: 403 }
      );
    }
    
    await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'png';

    const logo = await Logo.findOne({
      _id: id,
      createdBy: new mongoose.Types.ObjectId(authResult.user.userId),
    });

    if (!logo) {
      return NextResponse.json(
        { success: false, error: 'Logo not found' },
        { status: 404 }
      );
    }

    // For now, return the existing URL
    // In production, you'd regenerate the file in the requested format
    let downloadUrl = logo.logoUrl;
    let contentType = 'image/png';
    let filename = `${logo.businessName.replace(/\s+/g, '-')}-logo.png`;

    if (format === 'svg' && logo.logoSvgUrl) {
      downloadUrl = logo.logoSvgUrl;
      contentType = 'image/svg+xml';
      filename = `${logo.businessName.replace(/\s+/g, '-')}-logo.svg`;
    } else if (format === 'pdf' && logo.logoPdfUrl) {
      downloadUrl = logo.logoPdfUrl;
      contentType = 'application/pdf';
      filename = `${logo.businessName.replace(/\s+/g, '-')}-logo.pdf`;
    }

    // Fetch the file and return it
    if (downloadUrl) {
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Logo file not found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Error downloading logo:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to download logo' },
      { status: 500 }
    );
  }
}

