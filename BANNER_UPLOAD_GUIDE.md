# Dynamic Banner Image Upload & Storage Guide

## Overview

This guide covers how to implement dynamic banner image uploads with cloud storage and database metadata storage. **Never store images directly in the database** - store them in cloud storage and save URLs in the database.

## Architecture

```
User Upload → Next.js API → Cloud Storage (Supabase Storage/S3) → Database (PostgreSQL)
                                    ↓
                            Returns Public URL
                                    ↓
                            Save URL in Database
```

## Step 1: Choose Image Storage Solution

### Recommended: **Supabase Storage** (Best for your setup)

**Why Supabase Storage?**
- ✅ Free tier: 1GB storage, 2GB bandwidth
- ✅ Already using Supabase for database
- ✅ Built-in CDN
- ✅ Automatic image optimization
- ✅ Easy integration with Next.js
- ✅ Secure file uploads

**Alternative: AWS S3 + CloudFront**
- More scalable but more complex
- Better for very high traffic
- More expensive

## Step 2: Database Schema Update

Add these columns to your `banners` table:

```sql
-- Update banners table
ALTER TABLE banners ADD COLUMN IF NOT EXISTS storage_path TEXT; -- Path in storage bucket
ALTER TABLE banners ADD COLUMN IF NOT EXISTS file_size INTEGER; -- File size in bytes
ALTER TABLE banners ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100); -- image/jpeg, image/png, etc.
ALTER TABLE banners ADD COLUMN IF NOT EXISTS width INTEGER; -- Image width
ALTER TABLE banners ADD COLUMN IF NOT EXISTS height INTEGER; -- Image height
ALTER TABLE banners ADD COLUMN IF NOT EXISTS uploaded_by UUID; -- User/admin who uploaded
ALTER TABLE banners ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP DEFAULT NOW();
ALTER TABLE banners ADD COLUMN IF NOT EXISTS file_name VARCHAR(255); -- Original filename
```

## Step 3: Install Required Packages

```bash
npm install @supabase/supabase-js @supabase/storage-js
npm install sharp  # For image optimization
npm install formidable  # For file upload handling
npm install @types/formidable  # TypeScript types
```

## Step 4: Set Up Supabase Storage

### 4.1 Create Storage Bucket

In Supabase Dashboard:
1. Go to **Storage** → **Create Bucket**
2. Name: `banners`
3. Public: **Yes** (for public banner images)
4. File size limit: 5MB (adjust as needed)
5. Allowed MIME types: `image/jpeg, image/png, image/webp, image/svg+xml`

### 4.2 Set Up Storage Policies

```sql
-- Allow public read access
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'banners');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'banners' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update/delete their uploads
CREATE POLICY "Authenticated Update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'banners' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated Delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'banners' 
  AND auth.role() = 'authenticated'
);
```

## Step 5: Create Upload API Endpoint

Create `app/api/banners/upload/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create admin client (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Allowed image types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const section = formData.get('section') as string;
    const title = formData.get('title') as string;
    const linkUrl = formData.get('linkUrl') as string;
    const advertiser = formData.get('advertiser') as string;
    const sponsored = formData.get('sponsored') === 'true';
    const position = parseInt(formData.get('position') || '0');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, SVG' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 5MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${randomUUID()}.${fileExtension}`;
    const storagePath = `banners/${section}/${fileName}`;

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Optimize image (except SVG)
    let optimizedBuffer = buffer;
    let width: number | null = null;
    let height: number | null = null;

    if (file.type !== 'image/svg+xml') {
      try {
        const metadata = await sharp(buffer).metadata();
        width = metadata.width || null;
        height = metadata.height || null;

        // Resize if too large (max 2000px on longest side)
        const maxDimension = 2000;
        if (metadata.width && metadata.height) {
          if (metadata.width > maxDimension || metadata.height > maxDimension) {
            optimizedBuffer = await sharp(buffer)
              .resize(maxDimension, maxDimension, {
                fit: 'inside',
                withoutEnlargement: true,
              })
              .webp({ quality: 85 })
              .toBuffer();
            
            // Update metadata after resize
            const resizedMetadata = await sharp(optimizedBuffer).metadata();
            width = resizedMetadata.width || null;
            height = resizedMetadata.height || null;
          } else {
            // Just optimize without resizing
            optimizedBuffer = await sharp(buffer)
              .webp({ quality: 85 })
              .toBuffer();
          }
        }
      } catch (error) {
        console.error('Image optimization error:', error);
        // Use original if optimization fails
        optimizedBuffer = buffer;
      }
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('banners')
      .upload(storagePath, optimizedBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image', details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('banners')
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Save banner metadata to database
    const { data: bannerData, error: dbError } = await supabaseAdmin
      .from('banners')
      .insert({
        section,
        image_url: publicUrl,
        storage_path: storagePath,
        title: title || null,
        link_url: linkUrl || '#',
        advertiser: advertiser || null,
        sponsored: sponsored || false,
        position: position || 0,
        file_size: optimizedBuffer.length,
        mime_type: file.type,
        width,
        height,
        file_name: file.name,
        active: true,
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: Delete uploaded file if DB insert fails
      await supabaseAdmin.storage.from('banners').remove([storagePath]);
      return NextResponse.json(
        { error: 'Failed to save banner data', details: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      banner: bannerData,
      imageUrl: publicUrl,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
```

## Step 6: Bulk Upload Endpoint

Create `app/api/banners/upload/bulk/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const section = formData.get('section') as string;
    const defaultLinkUrl = formData.get('defaultLinkUrl') as string || '#';
    const defaultAdvertiser = formData.get('defaultAdvertiser') as string || '';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 files per bulk upload' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    // Process files in parallel (with concurrency limit)
    const BATCH_SIZE = 5;
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (file, index) => {
        const globalIndex = i + index;
        
        try {
          // Validate file
          if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            throw new Error(`Invalid file type: ${file.name}`);
          }
          if (file.size > MAX_FILE_SIZE) {
            throw new Error(`File too large: ${file.name}`);
          }

          // Generate filename
          const fileExtension = file.name.split('.').pop();
          const fileName = `${randomUUID()}.${fileExtension}`;
          const storagePath = `banners/${section}/${fileName}`;

          // Convert to buffer
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);

          // Optimize image
          let optimizedBuffer = buffer;
          let width: number | null = null;
          let height: number | null = null;

          if (file.type !== 'image/svg+xml') {
            try {
              const metadata = await sharp(buffer).metadata();
              width = metadata.width || null;
              height = metadata.height || null;

              if (metadata.width && metadata.height) {
                const maxDimension = 2000;
                if (metadata.width > maxDimension || metadata.height > maxDimension) {
                  optimizedBuffer = await sharp(buffer)
                    .resize(maxDimension, maxDimension, {
                      fit: 'inside',
                      withoutEnlargement: true,
                    })
                    .webp({ quality: 85 })
                    .toBuffer();
                  
                  const resizedMetadata = await sharp(optimizedBuffer).metadata();
                  width = resizedMetadata.width || null;
                  height = resizedMetadata.height || null;
                } else {
                  optimizedBuffer = await sharp(buffer)
                    .webp({ quality: 85 })
                    .toBuffer();
                }
              }
            } catch (error) {
              optimizedBuffer = buffer;
            }
          }

          // Upload to storage
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('banners')
            .upload(storagePath, optimizedBuffer, {
              contentType: file.type,
              upsert: false,
            });

          if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
          }

          // Get public URL
          const { data: urlData } = supabaseAdmin.storage
            .from('banners')
            .getPublicUrl(storagePath);

          const publicUrl = urlData.publicUrl;

          // Extract title from filename (remove extension)
          const title = file.name.replace(/\.[^/.]+$/, '');

          // Save to database
          const { data: bannerData, error: dbError } = await supabaseAdmin
            .from('banners')
            .insert({
              section,
              image_url: publicUrl,
              storage_path: storagePath,
              title: title,
              link_url: defaultLinkUrl,
              advertiser: defaultAdvertiser || title,
              sponsored: false,
              position: globalIndex,
              file_size: optimizedBuffer.length,
              mime_type: file.type,
              width,
              height,
              file_name: file.name,
              active: true,
            })
            .select()
            .single();

          if (dbError) {
            // Rollback
            await supabaseAdmin.storage.from('banners').remove([storagePath]);
            throw new Error(`Database error: ${dbError.message}`);
          }

          return {
            success: true,
            index: globalIndex,
            fileName: file.name,
            banner: bannerData,
            imageUrl: publicUrl,
          };
        } catch (error: any) {
          return {
            success: false,
            index: globalIndex,
            fileName: file.name,
            error: error.message,
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.success) {
          results.push(result);
        } else {
          errors.push(result);
        }
      });
    }

    return NextResponse.json({
      success: errors.length === 0,
      uploaded: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
```

## Step 7: Admin Upload Component

Create `app/components/admin/BannerUpload.tsx`:

```typescript
'use client';

import { useState, useRef } from 'react';

interface UploadResult {
  success: boolean;
  banner?: any;
  imageUrl?: string;
  error?: string;
}

export default function BannerUpload() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  const handleSingleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setResult(null);

    const formData = new FormData(e.currentTarget);
    const fileInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
    
    if (!fileInput.files || fileInput.files.length === 0) {
      setResult({ success: false, error: 'Please select a file' });
      setUploading(false);
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('image', fileInput.files[0]);
    formDataToSend.append('section', formData.get('section') as string);
    formDataToSend.append('title', formData.get('title') as string);
    formDataToSend.append('linkUrl', formData.get('linkUrl') as string);
    formDataToSend.append('advertiser', formData.get('advertiser') as string);
    formDataToSend.append('sponsored', formData.get('sponsored') === 'on' ? 'true' : 'false');
    formDataToSend.append('position', formData.get('position') as string);

    try {
      const response = await fetch('/api/banners/upload', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        e.currentTarget.reset();
        fileInputRef.current?.reset();
      }
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setResult(null);

    const formData = new FormData(e.currentTarget);
    const fileInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
    
    if (!fileInput.files || fileInput.files.length === 0) {
      setResult({ success: false, error: 'Please select files' });
      setUploading(false);
      return;
    }

    const formDataToSend = new FormData();
    Array.from(fileInput.files).forEach((file) => {
      formDataToSend.append('images', file);
    });
    formDataToSend.append('section', formData.get('section') as string);
    formDataToSend.append('defaultLinkUrl', formData.get('defaultLinkUrl') as string);
    formDataToSend.append('defaultAdvertiser', formData.get('defaultAdvertiser') as string);

    try {
      const response = await fetch('/api/banners/upload/bulk', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        e.currentTarget.reset();
        bulkFileInputRef.current?.reset();
      }
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setBulkMode(false)}
          className={`px-4 py-2 rounded ${!bulkMode ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Single Upload
        </button>
        <button
          onClick={() => setBulkMode(true)}
          className={`px-4 py-2 rounded ${bulkMode ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Bulk Upload
        </button>
      </div>

      {!bulkMode ? (
        <form onSubmit={handleSingleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Section</label>
            <select name="section" required className="w-full p-2 border rounded">
              <option value="hero">Hero</option>
              <option value="left">Left Rail</option>
              <option value="right">Right Rail</option>
              <option value="top">Top/Bottom Strip</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Image</label>
            <input
              ref={fileInputRef}
              type="file"
              name="image"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              required
              className="w-full p-2 border rounded"
            />
            <p className="text-xs text-gray-500 mt-1">Max 5MB. JPEG, PNG, WebP, or SVG</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              name="title"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Link URL</label>
            <input
              type="url"
              name="linkUrl"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Advertiser</label>
            <input
              type="text"
              name="advertiser"
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" name="sponsored" id="sponsored" />
            <label htmlFor="sponsored">Sponsored</label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Position</label>
            <input
              type="number"
              name="position"
              defaultValue="0"
              min="0"
              className="w-full p-2 border rounded"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload Banner'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleBulkUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Section</label>
            <select name="section" required className="w-full p-2 border rounded">
              <option value="top">Top/Bottom Strip</option>
              <option value="left">Left Rail</option>
              <option value="right">Right Rail</option>
              <option value="hero">Hero</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Images (Multiple)</label>
            <input
              ref={bulkFileInputRef}
              type="file"
              name="images"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              multiple
              required
              className="w-full p-2 border rounded"
            />
            <p className="text-xs text-gray-500 mt-1">Max 50 files, 5MB each. JPEG, PNG, WebP, or SVG</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Default Link URL</label>
            <input
              type="url"
              name="defaultLinkUrl"
              placeholder="#"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Default Advertiser</label>
            <input
              type="text"
              name="defaultAdvertiser"
              className="w-full p-2 border rounded"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : `Upload ${bulkFileInputRef.current?.files?.length || 0} Banners`}
          </button>
        </form>
      )}

      {result && (
        <div className={`mt-4 p-4 rounded ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {result.success ? (
            <div>
              <p className="text-green-800 font-medium">Upload successful!</p>
              {result.imageUrl && (
                <div className="mt-2">
                  <img src={result.imageUrl} alt="Uploaded" className="max-w-xs rounded" />
                  <p className="text-sm text-gray-600 mt-2">URL: {result.imageUrl}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-red-800">Error: {result.error}</p>
          )}
        </div>
      )}

      {result && 'uploaded' in result && (
        <div className="mt-4 p-4 rounded bg-blue-50 border border-blue-200">
          <p className="text-blue-800">
            Uploaded: {result.uploaded} | Failed: {result.failed}
          </p>
          {result.errors && result.errors.length > 0 && (
            <div className="mt-2">
              <p className="font-medium">Errors:</p>
              <ul className="list-disc list-inside text-sm">
                {result.errors.map((err: any, i: number) => (
                  <li key={i}>{err.fileName}: {err.error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

## Step 8: Update Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 9: Update Banner API to Use Database

Update `app/api/banners/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Banner } from '@/app/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const section = searchParams.get('section') as Banner['section'] | null;
  const loc = searchParams.get('loc');
  const cat = searchParams.get('cat');
  const limit = parseInt(searchParams.get('limit') || '10');

  let query = supabase
    .from('banners')
    .select('*')
    .eq('active', true);

  if (section) {
    query = query.eq('section', section);
  }

  query = query.order('position', { ascending: true });
  query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform to match Banner interface
  const banners: Banner[] = data.map((banner) => ({
    id: banner.id,
    section: banner.section,
    imageUrl: banner.image_url,
    title: banner.title,
    cta: banner.cta,
    ctaText: banner.cta_text,
    linkUrl: banner.link_url,
    alt: banner.alt || banner.title || 'Banner',
    advertiser: banner.advertiser,
    sponsored: banner.sponsored,
    position: banner.position,
  }));

  return NextResponse.json({ banners });
}
```

## Step 10: Bulk Upload Process Workflow

### Option A: Admin Panel (Recommended)
1. Create admin page at `/admin/banners`
2. Use the `BannerUpload` component
3. Upload single or multiple files
4. Images automatically optimized and stored

### Option B: Script-Based Bulk Import
Create `scripts/bulk-upload-banners.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function bulkUploadFromFolder(folderPath: string, section: string) {
  const files = await readdir(folderPath);
  const imageFiles = files.filter(f => 
    /\.(jpg|jpeg|png|webp|svg)$/i.test(f)
  );

  console.log(`Found ${imageFiles.length} images to upload`);

  for (const fileName of imageFiles) {
    try {
      const filePath = join(folderPath, fileName);
      const fileBuffer = await readFile(filePath);
      
      // Determine MIME type
      const ext = fileName.split('.').pop()?.toLowerCase();
      const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
                      ext === 'png' ? 'image/png' :
                      ext === 'webp' ? 'image/webp' :
                      ext === 'svg' ? 'image/svg+xml' : 'image/jpeg';

      // Optimize if needed
      let optimizedBuffer = fileBuffer;
      let width: number | null = null;
      let height: number | null = null;

      if (mimeType !== 'image/svg+xml') {
        const metadata = await sharp(fileBuffer).metadata();
        width = metadata.width || null;
        height = metadata.height || null;

        if (metadata.width && metadata.height) {
          const maxDimension = 2000;
          if (metadata.width > maxDimension || metadata.height > maxDimension) {
            optimizedBuffer = await sharp(fileBuffer)
              .resize(maxDimension, maxDimension, {
                fit: 'inside',
                withoutEnlargement: true,
              })
              .webp({ quality: 85 })
              .toBuffer();
            
            const resizedMetadata = await sharp(optimizedBuffer).metadata();
            width = resizedMetadata.width || null;
            height = resizedMetadata.height || null;
          }
        }
      }

      // Upload
      const storageFileName = `${randomUUID()}.${ext}`;
      const storagePath = `banners/${section}/${storageFileName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('banners')
        .upload(storagePath, optimizedBuffer, {
          contentType: mimeType,
        });

      if (uploadError) {
        console.error(`Failed to upload ${fileName}:`, uploadError);
        continue;
      }

      // Get URL
      const { data: urlData } = supabaseAdmin.storage
        .from('banners')
        .getPublicUrl(storagePath);

      // Save to database
      const title = fileName.replace(/\.[^/.]+$/, '');
      const { error: dbError } = await supabaseAdmin
        .from('banners')
        .insert({
          section,
          image_url: urlData.publicUrl,
          storage_path: storagePath,
          title,
          link_url: '#',
          advertiser: title,
          sponsored: false,
          position: 0,
          file_size: optimizedBuffer.length,
          mime_type: mimeType,
          width,
          height,
          file_name: fileName,
          active: true,
        });

      if (dbError) {
        console.error(`Failed to save ${fileName} to DB:`, dbError);
        // Clean up uploaded file
        await supabaseAdmin.storage.from('banners').remove([storagePath]);
      } else {
        console.log(`✓ Uploaded: ${fileName}`);
      }
    } catch (error) {
      console.error(`Error processing ${fileName}:`, error);
    }
  }

  console.log('Bulk upload complete!');
}

// Usage
// bulkUploadFromFolder('./public/Assets/hero', 'left');
```

## Best Practices

1. **Image Optimization**: Always optimize images before upload (Sharp library)
2. **File Naming**: Use UUIDs to avoid conflicts
3. **Storage Organization**: Organize by section (`banners/hero/`, `banners/left/`)
4. **Error Handling**: Always rollback on database errors
5. **File Size Limits**: Enforce 5MB limit
6. **CDN**: Supabase Storage includes CDN automatically
7. **Backup**: Regular backups of database (Supabase handles this)

## Cost Considerations

**Supabase Storage Free Tier:**
- 1GB storage
- 2GB bandwidth/month
- Perfect for starting

**When you scale:**
- Pro: $25/month - 100GB storage, 200GB bandwidth
- Team: $599/month - 1TB storage, 2TB bandwidth

## Security

1. **Authentication**: Protect upload endpoints with authentication
2. **File Validation**: Always validate file type and size
3. **Rate Limiting**: Add rate limiting to prevent abuse
4. **Virus Scanning**: Consider adding virus scanning for production

## Next Steps

1. Set up Supabase Storage bucket
2. Install required packages
3. Create upload API endpoints
4. Build admin upload interface
5. Test with a few images
6. Bulk upload existing images
7. Update banner API to use database

This setup will handle thousands of banner images efficiently!

