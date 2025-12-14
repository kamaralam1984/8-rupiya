# Shop Directory Functionality - Complete Overview

## 📍 Location on Home Page

The **Shop Directory** option is accessible from the **Navbar** component on the home page:

- **Location**: Top navigation bar (right side)
- **Visibility**: Desktop only (hidden on mobile/tablet)
- **Button Style**: Indigo button with folder icon
- **Route**: Links to `/shop-directory`

### Navbar Implementation
```tsx
// File: app/components/Navbar.tsx (Lines 376-385)
<Link
  href="/shop-directory"
  className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-white bg-indigo-600 rounded-lg shadow-md transition-all hover:shadow-lg hover:opacity-90 group"
>
  <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
  <span className="font-medium">Shop Directory</span>
</Link>
```

---

## 🏪 Shop Directory Page Features

### Page Location
- **File**: `app/shop-directory/page.tsx`
- **Route**: `/shop-directory`
- **Type**: Client-side React component

### Core Functionality

#### 1. **Data Fetching**
- **API Endpoint**: `/api/shops/nearby`
- **Parameters**:
  - `useMongoDB=true` (always enabled)
  - `radiusKm=1000` (1000 km radius - shows all shops)
  - `userLat` & `userLng` (from LocationContext if available)
- **Data Source**: MongoDB (Shop, AdminShop, AgentShop collections)
- **Filtering**: Only shows shops where `isVisible !== false`

#### 2. **Location Integration**
- Uses `LocationContext` to get user's location
- Automatically detects GPS location on page load
- Falls back to stored location or default Patna location
- Calculates distance to each shop if coordinates available

#### 3. **Search & Filter System**

**Search Bar**:
- Searches across multiple fields:
  - Shop name
  - Owner name
  - Category
  - Area
  - City
  - Pincode
- Real-time filtering as user types

**Filter Options**:
- **Category Filter**: Dropdown with all unique categories from shops
- **City Filter**: Dropdown with all unique cities from shops
- **Pincode Filter**: Dropdown with all unique pincodes from shops
- All filters can be set to "All" to show everything

**Filter Extraction**:
- Dynamically extracts unique values from fetched shops
- Sorted alphabetically for easy browsing
- Updates automatically when new shops are loaded

#### 4. **View Modes**

**Grid View** (Default):
- Responsive grid layout:
  - 1 column on mobile
  - 2 columns on small screens
  - 3 columns on large screens
  - 4 columns on extra-large screens
- Each card shows:
  - Shop image (photoUrl or iconUrl)
  - Shop name
  - Owner name
  - Category badge
  - City and pincode
  - Distance (if available)
  - Visitor count
  - "View Shop" button

**List View**:
- Table format with columns:
  - Image (thumbnail)
  - Shop Name
  - Owner
  - Category
  - Plan (shows city/pincode - seems mislabeled)
  - Location (city/pincode)
  - Distance
- Hover effects on rows
- Responsive table design

#### 5. **Sorting Logic**
Shops are sorted by:
1. **Distance** (if available) - nearest first
2. **Visitor Count** - highest first (if no distance)

#### 6. **Shop Card Component**

**PublicShopCard** (Grid View):
- Image section (h-48, object-cover)
- Shop name (bold, truncated if too long)
- Owner name
- Category badge (blue background)
- Location info (city, pincode)
- Distance display (blue, bold)
- Visitor count
- "View Shop" button (links to `/shop/{shop._id}`)

#### 7. **User Interface Elements**

**Header Section**:
- Gradient background (blue → indigo → purple)
- Title: "Shop Directory"
- Subtitle: "Discover and explore local shops near you"

**Search Panel**:
- White card with shadow
- Search input field
- Three filter dropdowns (Category, City, Pincode)
- Action buttons:
  - "Clear Filters" (gray button)
  - View toggle button (Grid/List)
  - Results counter (showing X of Y shops)

**Empty State**:
- Shows when no shops match filters
- Message: "No shops found matching your filters"
- "Clear Filters" button to reset

#### 8. **Loading State**
- Shows spinner and "Loading shops..." message
- Full-screen centered loading indicator

---

## 🔌 API Integration

### `/api/shops/nearby` Endpoint

**Query Parameters**:
- `userLat` (optional): User latitude
- `userLng` (optional): User longitude
- `radiusKm` (optional): Search radius in km (default: 1000)
- `useMongoDB` (required): Must be `true`
- `city` (optional): Filter by city
- `area` (optional): Filter by area
- `pincode` (optional): Filter by pincode
- `category` (optional): Filter by category

**Response Format**:
```json
{
  "success": true,
  "shops": [
    {
      "id": "shop_id",
      "shopName": "Shop Name",
      "ownerName": "Owner Name",
      "category": "Category",
      "city": "City",
      "area": "Area",
      "pincode": "Pincode",
      "photoUrl": "image_url",
      "iconUrl": "icon_url",
      "latitude": 25.5941,
      "longitude": 85.1376,
      "distance": 2.5,
      "visitorCount": 100,
      "paymentStatus": "PAID",
      "isVisible": true
    }
  ]
}
```

**Data Sources** (in priority order):
1. **AdminShop** model (`shopsfromimage` collection)
2. **AgentShop** model (`agentshops` collection)
3. **Shop** model (`shops` collection)

**Filtering Logic**:
- Only shops with `isVisible !== false` are returned
- Distance calculated using Haversine formula
- Shops sorted by priority rank (if available), then distance

---

## 🗺️ Location Context Integration

### Location Detection Flow

1. **Auto-Detection** (on page load):
   - Checks browser geolocation support
   - Requests GPS permission
   - Gets current coordinates
   - Validates if within Patna bounds (25.3-25.8 lat, 84.9-85.4 lng)
   - Finds nearest Patna location if within bounds
   - Uses GPS coordinates for distance calculation

2. **Fallback Chain**:
   - If GPS fails → Loads stored location from localStorage
   - If no stored location → Uses default Patna location

3. **Location Persistence**:
   - Saves location to localStorage when pincode is set
   - Persists across page reloads

### Location Data Structure
```typescript
interface Location {
  id: string;
  city: string;
  state: string;
  country: string;
  displayName: string;
  latitude?: number;
  longitude?: number;
  pincode?: string;
  area?: string;
  source: 'auto' | 'manual';
}
```

---

## 🎨 UI/UX Features

### Responsive Design
- **Mobile**: Single column grid, simplified filters
- **Tablet**: 2-column grid
- **Desktop**: 3-4 column grid, full filter panel

### Visual Elements
- **Color Scheme**: Blue/Indigo/Purple gradients
- **Cards**: White background, shadow effects, hover animations
- **Badges**: Category badges with blue background
- **Icons**: Emoji icons for location (📍), pincode (📮), views (👁️)
- **Buttons**: Blue primary buttons, gray secondary buttons

### User Feedback
- Toast notifications for errors
- Loading states
- Empty states with helpful messages
- Results counter showing filtered count

---

## 🔄 State Management

### Component States
```typescript
- shops: Shop[]                    // All fetched shops
- filteredShops: Shop[]            // Filtered results
- loading: boolean                 // Loading state
- viewMode: 'grid' | 'list'        // View mode
- searchQuery: string              // Search text
- selectedCategory: string         // Selected category filter
- selectedCity: string             // Selected city filter
- selectedPincode: string         // Selected pincode filter
- categories: string[]             // Available categories
- cities: string[]                 // Available cities
- pincodes: string[]               // Available pincodes
```

### Effect Hooks
1. **Initial Load**: Fetches shops on component mount
2. **Filter Application**: Re-applies filters when:
   - Shops data changes
   - Search query changes
   - Any filter selection changes
   - Location changes

---

## 🛠️ Technical Implementation Details

### Shop Data Mapping
The API response is mapped to the Shop interface:
```typescript
{
  _id: shop.id || shop._id,
  shopName: shop.shopName || shop.name,
  ownerName: shop.ownerName || 'N/A',
  category: shop.category || 'Uncategorized',
  area: shop.area,
  city: shop.city,
  pincode: shop.pincode,
  photoUrl: shop.photoUrl || shop.imageUrl || '/placeholder-shop.jpg',
  iconUrl: shop.iconUrl || shop.imageUrl || '/placeholder-shop.jpg',
  paymentStatus: shop.paymentStatus || 'PENDING',
  visitorCount: shop.visitorCount || 0,
  latitude: shop.latitude,
  longitude: shop.longitude,
  distance: shop.distance,
  createdAt: shop.createdAt || new Date().toISOString(),
}
```

### Filter Application Logic
1. Start with all shops
2. Apply search query filter (matches any field)
3. Apply category filter (exact match)
4. Apply city filter (exact match)
5. Apply pincode filter (exact match)
6. Sort by distance (if available), then visitor count
7. Update filtered shops state

### Error Handling
- API errors show toast notification
- Failed fetches show error message
- Fallback to empty array if API fails
- Console logging for debugging

---

## 📊 Data Flow Summary

```
Home Page (Navbar)
    ↓
User clicks "Shop Directory" button
    ↓
Navigate to /shop-directory
    ↓
ShopDirectoryPage component mounts
    ↓
LocationContext provides user location
    ↓
Fetch shops from /api/shops/nearby
    ↓
Filter shops (isVisible !== false)
    ↓
Extract filter options (categories, cities, pincodes)
    ↓
Apply filters based on user selections
    ↓
Display shops in Grid or List view
    ↓
User clicks "View Shop" → Navigate to /shop/{id}
```

---

## ✅ Key Features Summary

1. ✅ **Public Access**: No authentication required
2. ✅ **Location-Based**: Uses GPS or manual location
3. ✅ **Distance Calculation**: Shows distance to each shop
4. ✅ **Multi-Filter**: Category, City, Pincode filters
5. ✅ **Search**: Text search across multiple fields
6. ✅ **Dual View**: Grid and List view modes
7. ✅ **Responsive**: Works on all screen sizes
8. ✅ **Real-Time Filtering**: Instant results as user types
9. ✅ **Visibility Filter**: Only shows visible shops
10. ✅ **Sorting**: By distance and visitor count
11. ✅ **Visitor Tracking**: Shows view count for each shop
12. ✅ **Error Handling**: Graceful error messages
13. ✅ **Loading States**: User-friendly loading indicators

---

## 🔍 Files Involved

1. **Frontend Components**:
   - `app/shop-directory/page.tsx` - Main shop directory page
   - `app/components/Navbar.tsx` - Navigation with shop directory link

2. **API Routes**:
   - `app/api/shops/nearby/route.ts` - Shops fetching endpoint

3. **Contexts**:
   - `app/contexts/LocationContext.tsx` - Location management

4. **Utils**:
   - `app/utils/distance.ts` - Distance calculation
   - `app/utils/locationUtils.ts` - Location utilities

5. **Models**:
   - `models/Shop.ts` - Shop model
   - `lib/models/Shop.ts` - AdminShop model
   - `lib/models/AgentShop.ts` - AgentShop model

---

## 🎯 Usage Flow

1. User visits home page
2. Sees "Shop Directory" button in navbar (desktop only)
3. Clicks button → navigates to `/shop-directory`
4. Page loads → detects user location automatically
5. Fetches all visible shops from database
6. Displays shops in grid view by default
7. User can:
   - Search by typing in search bar
   - Filter by category, city, or pincode
   - Toggle between grid and list view
   - Click "View Shop" to see shop details
   - Clear filters to reset view

---

## 📝 Notes

- Shop Directory is **desktop-only** in navbar (mobile users can access via direct URL)
- Uses **1000 km radius** to show all shops (effectively no radius limit)
- Only shows shops where `isVisible !== false`
- Distance calculation uses **Haversine formula** (no external APIs)
- Location is **automatically detected** on page load
- Filters are **dynamically generated** from available shop data
- Shop cards link to `/shop/{shop._id}` for detailed view

