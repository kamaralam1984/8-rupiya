# 🏢 Google Business Profile Management System

## Overview
Operator panel में Google Business Profile बनाने और manage करने का complete system implement किया गया है।

## Features

### ✅ Operator Panel
- **Location**: `/admin/google-business`
- **Access**: Admin, Editor, और Operator सभी access कर सकते हैं
- **Features**:
  - सभी shops की list देखें
  - Google Business Profile बनाएं
  - Profile status track करें
  - Filter और search करें

### ✅ Database Model
- **Collection**: `googlebusinessprofiles`
- **Model**: `lib/models/GoogleBusinessProfile.ts`
- **Fields**:
  - Shop reference (shopId)
  - Shop details (shopName, ownerName, mobile, email, address, etc.)
  - Google Business Profile details (googleBusinessId, googleBusinessUrl)
  - Verification status (PENDING, VERIFIED, FAILED, NOT_CREATED)
  - Creation tracking (createdBy, createdByRole, createdAt)

## How to Use

### Step 1: Access Operator Panel
1. Admin/Editor/Operator role से login करें
2. Admin Panel → **"🏢 Google Business"** menu item पर click करें

### Step 2: View Shops
- **All Shops**: सभी shops की list
- **Shops Without Profile**: जिन shops का Google Business Profile नहीं बना है
- **Filter by Status**: 
  - All
  - Not Created
  - Pending
  - Verified
  - Failed

### Step 3: Create Google Business Profile
1. **"Shops Without Profile"** section में जाएं
2. जिस shop के लिए profile बनाना है, उसके सामने **"Create Profile"** button पर click करें
3. Modal में:
   - Shop details automatically fill हो जाएंगी
   - Email (optional) add करें
   - Notes (optional) add करें
4. **"Create Profile"** button पर click करें

### Step 4: Track Status
- **NOT_CREATED**: Profile अभी create नहीं हुआ
- **PENDING**: Profile create हो गया, verification pending है
- **VERIFIED**: Profile verified हो गया
- **FAILED**: Profile creation failed

## API Endpoints

### Get All Profiles
```
GET /api/admin/google-business
Query Params:
  - status: Filter by status (PENDING, VERIFIED, FAILED, NOT_CREATED)
  - shopId: Filter by shop ID
```

### Create Profile
```
POST /api/admin/google-business
Body:
{
  "shopId": "shop_id_here",
  "email": "owner@example.com", // Optional
  "notes": "Additional notes" // Optional
}
```

### Get Single Profile
```
GET /api/admin/google-business/[id]
```

### Update Profile
```
PUT /api/admin/google-business/[id]
Body:
{
  "googleBusinessId": "google_business_id",
  "googleBusinessUrl": "https://...",
  "verificationStatus": "VERIFIED",
  "verificationMethod": "PHONE",
  "notes": "Updated notes"
}
```

### Delete Profile
```
DELETE /api/admin/google-business/[id]
```

## Database Schema

### GoogleBusinessProfile Model
```typescript
{
  shopId: ObjectId, // Reference to Shop
  shopName: string,
  ownerName: string,
  mobile?: string,
  email?: string,
  address: string,
  city?: string,
  pincode?: string,
  latitude: number,
  longitude: number,
  category: string,
  googleBusinessId?: string,
  googleBusinessUrl?: string,
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED' | 'NOT_CREATED',
  verificationMethod?: 'PHONE' | 'EMAIL' | 'POSTCARD' | 'VIDEO',
  createdBy: ObjectId,
  createdByRole: 'admin' | 'editor' | 'operator',
  notes?: string,
  retryCount: number,
  lastRetryAt?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Integration with Google My Business API

**Current Status**: Basic structure ready, API integration pending

### Next Steps for Full Integration:
1. **Google My Business API Setup**:
   - Google Cloud Console में project create करें
   - Google My Business API enable करें
   - OAuth 2.0 credentials setup करें
   - API key और service account setup करें

2. **API Integration**:
   - Google My Business API से business create करें
   - Verification process initiate करें
   - Business details update करें
   - Photos upload करें

3. **Verification Process**:
   - Phone verification
   - Email verification
   - Postcard verification
   - Video verification

## Features Summary

✅ **Completed**:
- Operator panel UI
- Database model
- API endpoints (CRUD operations)
- Status tracking
- Filter and search
- Shop integration

🔄 **Pending**:
- Google My Business API integration
- Automatic verification
- Bulk profile creation
- Email notifications
- Status updates automation

## Usage Examples

### Create Profile for Existing Shop
```javascript
POST /api/admin/google-business
{
  "shopId": "507f1f77bcf86cd799439011",
  "email": "owner@shop.com",
  "notes": "Premium shop, priority verification"
}
```

### Update Profile Status
```javascript
PUT /api/admin/google-business/[profile_id]
{
  "verificationStatus": "VERIFIED",
  "googleBusinessId": "gmb_123456789",
  "googleBusinessUrl": "https://www.google.com/maps/place/..."
}
```

## Notes

- **Operator Role**: Operators can create and view profiles
- **Editor Role**: Editors can create, view, and update profiles
- **Admin Role**: Admins have full access including delete
- **Shop Integration**: Automatically pulls shop details from Shop.ts model
- **Status Tracking**: Complete audit trail of profile creation and updates

## Troubleshooting

### Profile not showing?
- Check if shop exists in database
- Verify shop ID is correct
- Check API response for errors

### Cannot create profile?
- Ensure shop exists
- Check if profile already exists for that shop
- Verify user has operator/editor/admin role

### Status not updating?
- Check API response
- Verify Google Business ID is correct
- Ensure verification process is complete


