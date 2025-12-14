# Admin Panel Guide

## Overview

The admin panel provides full control over your website's content, including banners, images, and locations. All data is stored in MongoDB and can be managed through a user-friendly interface.

## Access

1. **Login as Admin**: You need to have a user account with `role: 'admin'` in the database
2. **Navigate to Admin Panel**: Go to `/admin` after logging in
3. **Authentication**: The admin panel requires authentication and will redirect non-admin users

## Features

### 1. Dashboard (`/admin`)
- View statistics: Total banners, active banners, total locations, active locations
- Quick access to banner and location management

### 2. Banner Management (`/admin/banners`)

#### Create Banner
1. Click "+ Add Banner" button
2. Fill in the form:
   - **Section**: Choose from:
     - `hero` - Main hero banner (center)
     - `left` - Left rail banners (4 slots)
     - `right` - Right rail banners (4 slots)
     - `top` - Bottom strip banners (20 slots)
     - `bottom` - Alternative bottom section
   - **Image URL**: Either:
     - Enter a path like `/Assets/image.jpg` for existing images
     - Click "Upload" to upload a new image (saved to `/public/uploads/`)
   - **Title**: Display title (optional)
   - **Advertiser**: Advertiser name (optional)
   - **Link URL**: Where the banner should link to
   - **Area**: Location area (e.g., "A.H. Guard")
   - **Pincode**: Location pincode
   - **Latitude/Longitude**: For distance calculation
   - **Order**: Display order (lower numbers appear first)
   - **Active**: Toggle to show/hide banner
   - **Sponsored**: Mark as sponsored content

#### Edit Banner
1. Click "Edit" on any banner in the table
2. Modify fields as needed
3. Click "Update"

#### Delete Banner
1. Click "Delete" on any banner
2. Confirm deletion

#### Image Upload
- Click "Upload" button in the form
- Select an image file (max 5MB)
- Supported formats: JPEG, PNG, GIF, WebP, SVG
- Images are saved to `/public/uploads/{section}/`
- The URL is automatically filled in the form

### 3. Location Management (`/admin/locations`)

#### Create Location
1. Click "+ Add Location" button
2. Fill in the form:
   - **Location ID**: Unique identifier (e.g., "a-h-guard-801101")
   - **Display Name**: User-friendly name (e.g., "A.H. Guard")
   - **City**: City name (required)
   - **State**: State name (optional)
   - **Country**: Defaults to "India"
   - **Area**: Area name (optional)
   - **Pincode**: Postal code (optional)
   - **District**: District name (optional)
   - **Latitude/Longitude**: GPS coordinates (optional)
   - **Active**: Toggle to enable/disable location

#### Edit Location
1. Click "Edit" on any location
2. Note: Location ID cannot be changed after creation
3. Modify other fields as needed
4. Click "Update"

#### Delete Location
1. Click "Delete" on any location
2. Confirm deletion

## How It Works

### Database Structure

#### Banner Model
```typescript
{
  section: 'hero' | 'left' | 'right' | 'top' | 'bottom',
  imageUrl: string,
  title?: string,
  advertiser?: string,
  linkUrl: string,
  area?: string,
  pincode?: number,
  locationId?: string,
  lat?: number,
  lng?: number,
  isActive: boolean,
  order: number
}
```

#### Location Model
```typescript
{
  id: string, // Unique identifier
  city: string,
  state?: string,
  country: string,
  displayName: string,
  pincode?: number,
  area?: string,
  latitude?: number,
  longitude?: number,
  isActive: boolean
}
```

### Frontend Integration

The frontend components automatically fetch banners from the database:

1. **HeroSection** (`app/components/HeroSection.tsx`)
   - Fetches banners from `/api/banners?section=hero&loc={locationId}`
   - Displays hero banner in center

2. **LeftRail** (`app/components/hero/LeftRail.tsx`)
   - Fetches banners from `/api/banners?section=left&loc={locationId}&limit=4`
   - Displays 4 banners on the left side
   - Sorts by distance if user location is available

3. **RightRail** (`app/components/hero/RightRail.tsx`)
   - Fetches banners from `/api/banners?section=right&loc={locationId}&limit=4`
   - Displays 4 banners on the right side
   - Sorts by distance if user location is available

4. **BottomStrip** (`app/components/hero/BottomStrip.tsx`)
   - Fetches banners from `/api/banners?section=top&loc={locationId}&limit=20`
   - Displays 20 banners in a scrolling strip

### API Endpoints

#### Public Endpoints (No Auth Required)
- `GET /api/banners` - Fetch banners (filtered by section, location, area, pincode)

#### Admin Endpoints (Require Admin Auth)
- `GET /api/admin/banners` - List all banners
- `POST /api/admin/banners` - Create banner
- `GET /api/admin/banners/[id]` - Get single banner
- `PUT /api/admin/banners/[id]` - Update banner
- `DELETE /api/admin/banners/[id]` - Delete banner
- `POST /api/admin/upload` - Upload image file
- `GET /api/admin/locations` - List all locations
- `POST /api/admin/locations` - Create location
- `GET /api/admin/locations/[id]` - Get single location
- `PUT /api/admin/locations/[id]` - Update location
- `DELETE /api/admin/locations/[id]` - Delete location

## Best Practices

1. **Image Management**:
   - Use descriptive filenames
   - Optimize images before uploading (recommended: WebP format)
   - Keep file sizes under 5MB
   - Use consistent image dimensions for each section

2. **Banner Organization**:
   - Use the `order` field to control display sequence
   - Set appropriate `area` and `pincode` for location-based targeting
   - Add `lat` and `lng` for distance-based sorting
   - Mark sponsored content with `sponsored: true`

3. **Location Management**:
   - Use consistent Location ID format (e.g., "area-name-pincode")
   - Always include coordinates for accurate distance calculations
   - Keep location data up-to-date

4. **Testing**:
   - Test banners in different sections
   - Verify location-based filtering works
   - Check mobile responsiveness
   - Test image upload functionality

## Troubleshooting

### Banners Not Showing
1. Check if banner is marked as `isActive: true`
2. Verify the section matches (hero, left, right, top, bottom)
3. Check if location filtering is correct
4. Verify image URL is accessible

### Image Upload Fails
1. Check file size (must be < 5MB)
2. Verify file format is supported
3. Check `/public/uploads/` directory permissions
4. Ensure MongoDB connection is working

### Location Not Found
1. Verify location ID is correct
2. Check if location is marked as active
3. Ensure location exists in database

## Security

- All admin routes require authentication
- Only users with `role: 'admin'` can access admin panel
- File uploads are validated for type and size
- All API endpoints use JWT authentication

## Next Steps

1. Create your first admin user (set `role: 'admin'` in database)
2. Upload banner images
3. Create locations for your service areas
4. Add banners to each section
5. Test the frontend to see your changes

