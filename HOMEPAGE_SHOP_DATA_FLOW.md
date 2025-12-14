# Homepage Shop Data Flow - Complete Documentation

## 📊 Overview

This document explains how shop data flows when the homepage is rendered. The homepage displays shops in multiple sections, each fetching data independently.

---

## 🏗️ Homepage Structure

The homepage (`app/page.tsx`) consists of these sections (in order):

1. **Search & Filter Section** (`HomepageSearchFilter`)
2. **Hero Section** (`HeroSection`) - Contains Left Rail, Right Rail, Hero Banner, Bottom Strip
3. **Categories Section** (`CategoryGrid`)
4. **Offers Section** (`LatestOffers`)
5. **Featured Businesses** (`FeaturedBusinesses`)
6. **Top Rated Businesses** (`TopRatedBusinesses`)
7. **New Businesses** (`NewBusinesses`)

---

## 🔄 Data Flow Diagram

```
Homepage Load
    │
    ├─→ HomepageSearchFilter (No shop data, just UI)
    │
    ├─→ HeroSection
    │   │
    │   ├─→ Check: isSearchActive?
    │   │   │
    │   │   ├─→ YES → /api/search
    │   │   │   ├─→ Returns: mainResults, leftRail, rightRail, bottomStrip
    │   │   │   ├─→ Left Rail: Shops with planType='LEFT_BAR' (or fallback)
    │   │   │   ├─→ Right Rail: Shops with planType='RIGHT_SIDE' (or fallback)
    │   │   │   ├─→ Bottom Strip: All other shops (sorted by plan priority)
    │   │   │   └─→ Hero: Shop with planType='HERO'
    │   │   │
    │   │   └─→ NO → Normal Flow
    │   │       ├─→ /api/banners (for banners)
    │   │       ├─→ /api/shops/nearby (for shops)
    │   │       ├─→ /api/shops/by-plan (fallback for plan-specific shops)
    │   │       └─→ Organize by planType:
    │   │           ├─→ LEFT_BAR → Left Rail (3 shops)
    │   │           ├─→ RIGHT_SIDE → Right Rail (3 shops)
    │   │           ├─→ HERO → Hero Banner (1 shop)
    │   │           └─→ Others → Bottom Strip (30 shops)
    │
    ├─→ FeaturedBusinesses
    │   └─→ /api/shops/nearby
    │       └─→ Filters: isVisible !== false
    │       └─→ Sorts: by distance, then visitorCount
    │       └─→ Shows: Top 10 shops
    │
    ├─→ TopRatedBusinesses
    │   └─→ /api/shops/nearby
    │       └─→ Filters: isVisible !== false
    │       └─→ Sorts: by rating (highest first), then distance
    │       └─→ Shows: Top 6 shops
    │
    └─→ NewBusinesses
        └─→ /api/shops/nearby
            └─→ Filters: isVisible !== false
            └─→ Sorts: by createdAt (newest first), then distance
            └─→ Shows: Top 6 newest shops
```

---

## 📍 1. HeroSection - Left/Right/Bottom Shops

### When Search is Active (`isSearchActive = true`)

**API Endpoint:** `/api/search`

**Query Parameters:**
- `pincode` (if filter applied)
- `city` (if filter applied)
- `category` (if filter applied)
- `shopName` (if filter applied)
- `userLat` & `userLng` (from LocationContext)

**Response Structure:**
```json
{
  "success": true,
  "mainResults": [],      // HERO plan shops
  "leftRail": [],         // LEFT_BAR plan shops (or fallback)
  "rightRail": [],        // RIGHT_SIDE plan shops (or fallback)
  "bottomStrip": [],      // All other shops
  "totalFound": 0
}
```

**Data Sources (Priority Order):**
1. **AgentShop** collection (`agentshops`) - HIGHEST PRIORITY
2. **AdminShop** collection (`shopsfromimage`) - SECOND PRIORITY
3. **Shop** collection (`shops`) - LOWEST PRIORITY

**Processing:**
1. Fetches shops from all 3 collections
2. Filters by search criteria (pincode, city, category, shopName)
3. Calculates distance if user coordinates available
4. Scores shops based on relevance
5. Organizes by planType:
   - `HERO` → mainResults
   - `LEFT_BAR` → leftRail (fallback to any shop if none found)
   - `RIGHT_SIDE` → rightRail (fallback to any shop if none found)
   - Others → bottomStrip

**Display:**
- **Left Rail**: First 3 shops from `leftRail` array
- **Right Rail**: First 3 shops from `rightRail` array
- **Bottom Strip**: First 30 shops from `bottomStrip` array
- **Hero**: First shop from `mainResults` with planType='HERO'

---

### When Search is NOT Active (`isSearchActive = false`)

**API Endpoints Called:**
1. `/api/banners` - For banner images (hero, left, right, top sections)
2. `/api/shops/nearby` - For shop data
3. `/api/shops/by-plan` - Fallback for plan-specific shops

**Shop Fetching Logic:**

```javascript
// Step 1: Try to fetch nearby shops with location
if (location.latitude && location.longitude) {
  url = `/api/shops/nearby?userLat=${lat}&userLng=${lng}&radiusKm=1000&useMongoDB=true`;
  // + filters (city, area, pincode, category)
}

// Step 2: If no location, try city/area
else if (cityFilter || areaFilter || pincodeFilter) {
  url = `/api/shops/nearby?city=${city}&radiusKm=1000&useMongoDB=true`;
  // + filters
}

// Step 3: Fallback - fetch all shops
else {
  url = `/api/shops/nearby?radiusKm=1000&useMongoDB=true&limit=50`;
}
```

**Shop Organization:**

1. **Hero Shop**: 
   - Prioritizes shops with `planType = 'HERO'`
   - Falls back to any shop if no HERO shops found
   - Sorted by: visitorCount → priorityRank → distance

2. **Left Rail** (3 shops):
   - Prioritizes shops with `planType = 'LEFT_BAR'`
   - Falls back to any shop if no LEFT_BAR shops found
   - Sorted by: priorityRank → distance

3. **Right Rail** (3 shops):
   - Prioritizes shops with `planType = 'RIGHT_SIDE'`
   - Falls back to any shop if no RIGHT_SIDE shops found
   - Sorted by: priorityRank → distance

4. **Bottom Strip** (30 shops):
   - Excludes LEFT_BAR and RIGHT_SIDE shops
   - Includes: BOTTOM_RAIL, BASIC, PREMIUM, FEATURED, BANNER, HERO
   - Sorted by: Plan priority → visitorCount → distance

---

## 🏪 2. FeaturedBusinesses Component

**API Endpoint:** `/api/shops/nearby`

**Query Parameters:**
- `useMongoDB=true`
- `radiusKm=1000`
- `userLat` & `userLng` (if available)
- `pincode`, `city`, `category`, `shopName` (if filters applied)

**Data Processing:**
1. Fetches shops from MongoDB
2. Filters: `isVisible !== false`
3. Maps to BusinessSummary format
4. Filters by shopName if search query provided
5. Sorts by: distance → visitorCount
6. Takes top 10 shops

**Fallback:**
- If no shops found → Falls back to `/api/businesses/featured`

**Display:**
- Grid layout: 2 columns (mobile) → 5 columns (desktop)
- Shows: Image, Rating, Shop Name, Location, Distance

---

## ⭐ 3. TopRatedBusinesses Component

**API Endpoint:** `/api/shops/nearby`

**Query Parameters:** (Same as FeaturedBusinesses)

**Data Processing:**
1. Fetches shops from MongoDB
2. Filters: `isVisible !== false`
3. Maps to BusinessSummary format
4. Filters by shopName if search query provided
5. Sorts by: **rating (highest first)** → distance → visitorCount
6. Takes top 6 shops

**Fallback:**
- If no shops found → Falls back to `/api/businesses/featured` (sorted by rating)

**Display:**
- Grid layout: 2 columns (mobile) → 5 columns (desktop)
- Shows: Image, Rating, Shop Name, Location, Distance

---

## 🆕 4. NewBusinesses Component

**API Endpoint:** `/api/shops/nearby`

**Query Parameters:** (Same as FeaturedBusinesses)

**Data Processing:**
1. Fetches shops from MongoDB
2. Filters: `isVisible !== false`
3. Maps to BusinessSummary format (includes `createdAt`)
4. Filters by shopName if search query provided
5. Sorts by: **createdAt (newest first)** → distance → visitorCount
6. Takes top 6 newest shops

**Fallback:**
- If no shops found → Falls back to `/api/businesses/featured` (last 6, reversed)

**Display:**
- Grid layout: 2 columns (mobile) → 5 columns (desktop)
- Shows: Image, Rating, Shop Name, Location, Distance
- Badge: "New" label

---

## 🗄️ Database Collections Used

### Priority Order (Highest to Lowest):

1. **AgentShop** (`agentshops` collection)
   - Model: `lib/models/AgentShop.ts`
   - Priority: HIGHEST
   - Used for: All shop sections

2. **AdminShop** (`shopsfromimage` collection)
   - Model: `lib/models/Shop.ts`
   - Priority: SECOND
   - Used for: All shop sections

3. **Shop** (`shops` collection)
   - Model: `models/Shop.ts`
   - Priority: LOWEST
   - Used for: Fallback when other collections empty

---

## 🔍 API Endpoints Details

### `/api/shops/nearby`

**Purpose:** Fetch shops based on location and filters

**Query Parameters:**
- `useMongoDB=true` (required)
- `userLat` & `userLng` (optional, for distance calculation)
- `radiusKm` (default: 1000)
- `city` (optional filter)
- `area` (optional filter)
- `pincode` (optional filter)
- `category` (optional filter)

**Response:**
```json
{
  "success": true,
  "shops": [
    {
      "id": "shop_id",
      "shopName": "Shop Name",
      "category": "Category",
      "city": "City",
      "pincode": "Pincode",
      "photoUrl": "image_url",
      "latitude": 25.5941,
      "longitude": 85.1376,
      "distance": 2.5,
      "visitorCount": 100,
      "planType": "BASIC",
      "isVisible": true
    }
  ]
}
```

**Data Sources:**
- Fetches from AgentShop, AdminShop, Shop collections
- Combines all shops
- Filters by `isVisible !== false`
- Calculates distance using Haversine formula
- Sorts by priorityRank → distance

---

### `/api/search`

**Purpose:** Search shops with filters and organize by plan type

**Query Parameters:**
- `pincode`, `city`, `category`, `shopName` (filters)
- `userLat` & `userLng` (for distance)

**Response:**
```json
{
  "success": true,
  "mainResults": [],      // HERO shops
  "leftRail": [],         // LEFT_BAR shops (or fallback)
  "rightRail": [],        // RIGHT_SIDE shops (or fallback)
  "bottomStrip": [],      // Other shops
  "totalFound": 0
}
```

**Processing:**
1. Builds MongoDB query with filters
2. Fetches from all 3 collections
3. Calculates shop scores
4. Organizes by planType
5. Applies fallback logic if plan-specific shops not found

---

## 🔄 Filter Application Flow

### When Filters Are Applied:

1. **User sets filters** in `HomepageSearchFilter`
   - Shop Name (text input)
   - Category (dropdown)
   - City (dropdown)
   - Pincode (dropdown)

2. **Filters stored in SearchContext**
   - `searchParams` object updated
   - `isSearchActive` becomes `true` if any filter set

3. **All components react to filter changes:**
   - **HeroSection**: Uses `/api/search` endpoint
   - **FeaturedBusinesses**: Adds filters to `/api/shops/nearby` URL
   - **TopRatedBusinesses**: Adds filters to `/api/shops/nearby` URL
   - **NewBusinesses**: Adds filters to `/api/shops/nearby` URL

4. **Components re-fetch data** when filters change
   - `useEffect` watches `searchParams` and `isSearchActive`
   - Automatically triggers re-fetch

---

## 📊 Shop Data Structure

### Shop Object Fields:

```typescript
{
  id: string;                    // Shop ID
  shopName: string;              // Shop name
  name: string;                  // Alternative name field
  category: string;               // Shop category
  city: string;                  // City name
  area: string;                  // Area/locality
  pincode: string;               // Pincode
  photoUrl: string;              // Main image URL
  imageUrl: string;              // Alternative image URL
  iconUrl: string;               // Icon URL
  latitude: number;               // GPS latitude
  longitude: number;              // GPS longitude
  distance: number;               // Distance in km (calculated)
  visitorCount: number;           // Number of visitors
  rating: number;                 // Shop rating (0-5)
  reviews: number;                // Number of reviews
  planType: string;              // 'BASIC' | 'PREMIUM' | 'FEATURED' | 'HERO' | 'LEFT_BAR' | 'RIGHT_SIDE' | 'BOTTOM_RAIL'
  priorityRank: number;           // Priority ranking (higher = first)
  isVisible: boolean;             // Visibility flag
  website: string;                // Shop website URL
  shopUrl: string;                // Shop page URL slug
  createdAt: string;              // Creation date
}
```

---

## 🎯 Plan Type System

Shops are organized by `planType` field:

- **HERO**: Hero banner (center, large)
- **LEFT_BAR**: Left rail (3 vertical slots)
- **RIGHT_SIDE**: Right rail (1 large slot)
- **BOTTOM_RAIL**: Bottom strip (priority)
- **PREMIUM**: Bottom strip (high priority)
- **FEATURED**: Bottom strip (medium priority)
- **BANNER**: Bottom strip (low priority)
- **BASIC**: Bottom strip (lowest priority)

**Priority Order (for bottom strip):**
1. HERO (6)
2. BOTTOM_RAIL (5)
3. PREMIUM (4)
4. FEATURED (3)
5. BANNER (2)
6. BASIC (1)

---

## 🔄 Re-render Triggers

Components re-fetch shop data when:

1. **Location changes** (`location.id`, `location.latitude`, `location.longitude`)
2. **Search filters change** (`searchParams.pincode`, `searchParams.city`, `searchParams.category`, `searchParams.shopName`)
3. **Search active state changes** (`isSearchActive`)
4. **Component mounts** (initial load)

---

## 📝 Key Files

### Components:
- `app/page.tsx` - Homepage main component
- `app/components/HeroSection.tsx` - Hero section with left/right/bottom shops
- `app/components/FeaturedBusinesses.tsx` - Featured shops section
- `app/components/TopRatedBusinesses.tsx` - Top rated shops section
- `app/components/NewBusinesses.tsx` - New shops section
- `app/components/HomepageSearchFilter.tsx` - Search and filter UI

### API Routes:
- `app/api/shops/nearby/route.ts` - Fetch nearby shops
- `app/api/search/route.ts` - Search shops with filters
- `app/api/shops/search-options/route.ts` - Get filter options (categories, cities, pincodes)

### Contexts:
- `app/contexts/SearchContext.tsx` - Search filter state management
- `app/contexts/LocationContext.tsx` - User location state management

### Models:
- `lib/models/AgentShop.ts` - Agent shop model
- `lib/models/Shop.ts` - Admin shop model
- `models/Shop.ts` - Old shop model

---

## 🎨 Display Logic Summary

### HeroSection:
- **Search Active**: Uses `/api/search` → Returns organized shops by plan type
- **Search Inactive**: Uses `/api/shops/nearby` → Organizes shops by plan type client-side

### Featured/TopRated/New Businesses:
- Always use `/api/shops/nearby`
- Apply filters from SearchContext
- Sort differently (featured by distance, top rated by rating, new by date)
- Show empty state if no shops found

---

## 🔍 Debugging Tips

1. **Check console logs:**
   - `🔄 HeroSection: Fetching banners...` - Shows when HeroSection fetches
   - `✅ HeroSection: Search is active` - Shows search mode
   - `✅ HeroSection: Using normal flow` - Shows normal mode
   - `📍 Filtering by pincode` - Shows filter application

2. **Check API responses:**
   - Network tab → Filter by `/api/shops/nearby` or `/api/search`
   - Check response JSON structure
   - Verify `success: true` and `shops` array

3. **Check SearchContext:**
   - `isSearchActive` should be `true` when filters applied
   - `searchParams` should contain filter values

4. **Check LocationContext:**
   - `location.latitude` and `location.longitude` for distance calculation
   - `location.city` and `location.pincode` for default filters

---

## ✅ Summary

**Shop data flows from:**
1. **Database** (MongoDB) → 3 collections (AgentShop, AdminShop, Shop)
2. **API Endpoints** → `/api/shops/nearby` or `/api/search`
3. **Components** → HeroSection, FeaturedBusinesses, TopRatedBusinesses, NewBusinesses
4. **UI Display** → Left Rail, Right Rail, Bottom Strip, Featured Grid, etc.

**Filter application:**
- Filters stored in SearchContext
- All components watch SearchContext
- Components re-fetch when filters change
- API endpoints apply filters server-side

**Plan type organization:**
- Shops organized by `planType` field
- Priority system determines display order
- Fallback logic shows any shops if plan-specific shops not found


