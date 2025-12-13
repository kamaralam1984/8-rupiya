# 🏠 home Homepage Search & Filter Implementation Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture & Data Flow](#architecture--data-flow)
3. [Component Structure](#component-structure)
4. [Step-by-Step Implementation](#step-by-step-implementation)
5. [API Endpoints](#api-endpoints)
6. [State Management](#state-management)
7. [How It Works](#how-it-works)
8. [Code Walkthrough](#code-walkthrough)

---

## 🎯 Overview

This document explains how the **Search & Filter** functionality was implemented on the homepage, allowing users to filter shops displayed in the **Left Rail**, **Right Rail**, **Bottom Strip**, and **Center (Hero)** sections.

### Key Features
- ✅ Search by shop name
- ✅ Filter by category
- ✅ Filter by city
- ✅ Filter by pincode
- ✅ Real-time updates in Left/Right/Bottom/Center sections
- ✅ Nearest shops displayed in Left and Right rails (sorted by distance)
- ✅ Fallback logic when no shops match filters

---

## 🏗️ Architecture & Data Flow

### High-Level Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                         │
│  User selects Category/City/Pincode or types Shop Name     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         HomepageSearchFilter Component                      │
│  • Dropdowns: Category, City, Pincode                       │
│  • Input: Shop Name                                         │
│  • Updates SearchContext immediately on dropdown change     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              SearchContext (Global State)                    │
│  • Stores: pincode, category, city, shopName, area          │
│  • Provides: searchParams, setSearchParams, isSearchActive │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              HeroSection Component                           │
│  • Watches SearchContext for changes                        │
│  • Detects if any filters are active                        │
│  • Calls /api/search when filters present                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              /api/search Endpoint                           │
│  • Filters shops from MongoDB                               │
│  • Organizes by planType:                                   │
│    - HERO → mainResults (center)                            │
│    - LEFT_BAR → leftRail                                    │
│    - RIGHT_SIDE → rightRail                                 │
│    - BOTTOM_RAIL → bottomStrip                              │
│  • Returns structured data                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         HeroSection Processes Results                       │
│  • Transforms shops to banner format                        │
│  • Sorts Left/Right rails by distance (nearest first)       │
│  • Updates state → Renders LeftRail, RightSide, BottomStrip │
└─────────────────────────────────────────────────────────────┘jjjsjj
```

---

## 📦 Component Structure

### 1. **HomepageSearchFilter** (`app/components/HomepageSearchFilter.tsx`)
**Purpose:** UI component for search and filter inputs

**Key Features:**
- Search bar for shop name
- Dropdowns for Category, City, Pincode
- Auto-updates SearchContext when dropdowns change
- Fetches filter options from `/api/shops/search-options`
- Clear filters button

**Location on Homepage:** Top of the page (above HeroSection)

### 2. **SearchContext** (`app/contexts/SearchContext.tsx`)
**Purpose:** Global state management for search parameters

**State:**
```typescript
{
  pincode?: string;
  area?: string;
  category?: string;
  city?: string;
  shopName?: string;
  planType?: string;
}
```

**Functions:**
- `setSearchParams(params)` - Update search parameters
- `clearSearch()` - Reset all parameters
- `isSearchActive` - Boolean indicating if any filter is active

### 3. **HeroSection** (`app/components/HeroSection.tsx`)
**Purpose:** Main component that displays Left Rail, Right Rail, Bottom Strip, and Hero Banner

**Key Logic:**
- Watches `SearchContext` for changes
- Detects if filters are active (`hasFilters`)
- Calls `/api/search` when filters present
- Processes results and sorts by distance
- Falls back to `/api/shops/nearby` if search returns empty

### 4. **Homepage** (`app/page.tsx`)
**Purpose:** Main homepage component that renders all sections

**Key Changes:**
- Added `<HomepageSearchFilter />` at the top
- Wrapped HeroSection with `id="businesses-section"` for scrolling

---

## 🔧 Step-by-Step Implementation

### Step 1: Create SearchContext

**File:** `app/contexts/SearchContext.tsx`

```typescript
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface SearchParams {
  pincode?: string;
  area?: string;
  category?: string;
  city?: string;
  shopName?: string;
  planType?: string;
}

interface SearchContextType {
  searchParams: SearchParams;
  setSearchParams: (params: SearchParams) => void;
  clearSearch: () => void;
  isSearchActive: boolean;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useState<SearchParams>({});

  const clearSearch = () => {
    setSearchParams({});
  };

  const isSearchActive = Boolean(
    searchParams.pincode || 
    searchParams.area || 
    searchParams.category || 
    searchParams.city || 
    searchParams.shopName || 
    searchParams.planType
  );

  return (
    <SearchContext.Provider value={{ searchParams, setSearchParams, clearSearch, isSearchActive }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
```

**What it does:**
- Creates a React Context for global search state
- Provides `searchParams` object to store filter values
- Provides `isSearchActive` boolean to check if any filter is active
- Exports `useSearch()` hook for components to access the context

---

### Step 2: Wrap App with SearchProvider

**File:** `app/layout.tsx` (or wherever your root layout is)

```typescript
import { SearchProvider } from './contexts/SearchContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SearchProvider>
          {children}
        </SearchProvider>
      </body>
    </html>
  );
}
```

**What it does:**
- Makes SearchContext available to all components in the app

---

### Step 3: Create HomepageSearchFilter Component

**File:** `app/components/HomepageSearchFilter.tsx`

**Key Parts:**

#### 3.1 State Management
```typescript
const { searchParams, setSearchParams, clearSearch, isSearchActive } = useSearch();

const [searchQuery, setSearchQuery] = useState(searchParams.shopName || '');
const [selectedCategory, setSelectedCategory] = useState(searchParams.category || '');
const [selectedCity, setSelectedCity] = useState(searchParams.city || '');
const [selectedPincode, setSelectedPincode] = useState(searchParams.pincode || '');
```

#### 3.2 Fetch Filter Options
```typescript
useEffect(() => {
  const fetchFilterOptions = async () => {
    const response = await fetch('/api/shops/search-options');
    const data = await response.json();
    if (data.success) {
      setCategories(data.categories || []);
      setCities(data.cities || []);
      setPincodes(data.pincodes || []);
    }
  };
  fetchFilterOptions();
}, []);
```

#### 3.3 Auto-Update SearchContext on Dropdown Change
```typescript
useEffect(() => {
  const newParams: any = {};
  if (searchQuery.trim()) newParams.shopName = searchQuery.trim();
  if (selectedCategory) newParams.category = selectedCategory;
  if (selectedCity) newParams.city = selectedCity;
  if (selectedPincode) newParams.pincode = selectedPincode;
  
  // Only update if params actually changed (avoid infinite loop)
  const paramsChanged = 
    (newParams.shopName || '') !== (searchParams.shopName || '') ||
    (newParams.category || '') !== (searchParams.category || '') ||
    (newParams.city || '') !== (searchParams.city || '') ||
    (newParams.pincode || '') !== (searchParams.pincode || '');
  
  if (paramsChanged) {
    setSearchParams(newParams);
  }
}, [selectedCategory, selectedCity, selectedPincode]);
```

**Why this is important:**
- When user selects Category/City/Pincode from dropdown, it **immediately** updates SearchContext
- This triggers HeroSection to re-fetch data **without requiring form submission**
- Only shop name requires form submission (Enter key or Search button)

#### 3.4 Handle Form Submission (Shop Name)
```typescript
const handleSearch = (e: React.FormEvent) => {
  e.preventDefault();
  
  const newParams: any = {};
  if (searchQuery.trim()) newParams.shopName = searchQuery.trim();
  if (selectedCategory) newParams.category = selectedCategory;
  if (selectedCity) newParams.city = selectedCity;
  if (selectedPincode) newParams.pincode = selectedPincode;
  
  setSearchParams(newParams);
  
  // Scroll to hero section
  setTimeout(() => {
    const heroSection = document.getElementById('businesses-section');
    if (heroSection) {
      heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
};
```

---

### Step 4: Add HomepageSearchFilter to Homepage

**File:** `app/page.tsx`

```typescript
import HomepageSearchFilter from "./components/HomepageSearchFilter";

export default function Home() {
  return (
    <div>
      <Navbar hideSearch={true} />
      
      <main>
        {/* Search & Filter Section - At the Top */}
        <div style={{ marginBottom: sectionSpacing }}>
          <HomepageSearchFilter />
        </div>

        {/* Hero Section */}
        {sections.hero && (
          <div style={{ marginBottom: sectionSpacing }} id="businesses-section">
            <HeroSection />
          </div>
        )}
        
        {/* Other sections... */}
      </main>
    </div>
  );
}
```

**What it does:**
- Places the search filter component at the top of the homepage
- Adds `id="businesses-section"` to HeroSection container for scroll targeting

---

### Step 5: Update HeroSection to Use SearchContext

**File:** `app/components/HeroSection.tsx`

#### 5.1 Import SearchContext
```typescript
import { useSearch } from '../contexts/SearchContext';

export default function HeroSection({ category }: HeroSectionProps) {
  const { location } = useLocation();
  const { searchParams, isSearchActive } = useSearch();
  // ...
}
```

#### 5.2 Detect Filters and Call /api/search
```typescript
useEffect(() => {
  const fetchBanners = async () => {
    // Check if any filters are present
    const hasFilters = Boolean(
      searchParams.pincode || 
      searchParams.category || 
      searchParams.city || 
      searchParams.shopName ||
      searchParams.area
    );
    
    // If filters are present, ALWAYS use /api/search endpoint
    if (hasFilters || isSearchActive) {
      const searchParamsObj = new URLSearchParams();
      if (searchParams.pincode) searchParamsObj.append('pincode', searchParams.pincode);
      if (searchParams.area) searchParamsObj.append('area', searchParams.area);
      if (searchParams.category) searchParamsObj.append('category', searchParams.category);
      if (searchParams.city) searchParamsObj.append('city', searchParams.city);
      if (searchParams.shopName) searchParamsObj.append('shopName', searchParams.shopName);
      if (location.latitude) searchParamsObj.append('userLat', location.latitude.toString());
      if (location.longitude) searchParamsObj.append('userLng', location.longitude.toString());

      const searchUrl = `/api/search?${searchParamsObj.toString()}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await safeJsonParse(searchRes);
      
      // Process results...
    }
  };
  
  fetchBanners();
}, [searchParams, location, isSearchActive]);
```

**Key Points:**
- `useEffect` watches `searchParams` for changes
- When any filter changes, it triggers a re-fetch
- Uses `/api/search` endpoint when filters are active
- Falls back to normal flow when no filters

#### 5.3 Process Search Results and Sort by Distance

```typescript
if (searchData?.success) {
  // Transform left rail - Show NEAREST shops (sorted by distance)
  const leftBanners = searchData.leftRail
    .filter((shop: any) => shop?.id && !usedShopIds.has(shop.id))
    .sort((a: any, b: any) => {
      // Sort by distance (nearest first)
      const distanceA = a.distance || 999999;
      const distanceB = b.distance || 999999;
      return distanceA - distanceB;
    })
    .slice(0, 3)
    .map((shop: any) => {
      usedShopIds.add(shop.id);
      return transformShopToBanner(shop);
    });

  // Transform right rail - Show NEAREST shops (sorted by distance)
  const rightBanners = searchData.rightRail
    .filter((shop: any) => shop?.id && !usedShopIds.has(shop.id))
    .sort((a: any, b: any) => {
      // Sort by distance (nearest first)
      const distanceA = a.distance || 999999;
      const distanceB = b.distance || 999999;
      return distanceA - distanceB;
    })
    .slice(0, 3)
    .map((shop: any) => {
      usedShopIds.add(shop.id);
      return transformShopToBanner(shop);
    });

  // Transform bottom strip
  const bottomBanners = searchData.bottomStrip
    .filter((shop: any) => {
      const isLeftOrRight = shop?.planType === 'LEFT_BAR' || shop?.planType === 'RIGHT_SIDE';
      return shop?.id && !isLeftOrRight && !usedShopIds.has(shop.id);
    })
    .slice(0, 30)
    .map((shop: any) => transformShopToBanner(shop));

  // Transform hero shop
  const heroShopFromSearch = searchData.mainResults.find((shop: any) => shop.planType === 'HERO');
  const heroBanner = heroShopFromSearch ? transformShopToBanner(heroShopFromSearch) : undefined;

  setData({
    hero: heroBanner,
    left: leftBanners,
    right: rightBanners,
    bottom: bottomBanners,
  });
}
```

**What it does:**
- Processes shops from `/api/search` response
- **Left Rail:** Shows 3 nearest shops (sorted by distance)
- **Right Rail:** Shows 3 nearest shops (sorted by distance, excluding left rail shops)
- **Bottom Strip:** Shows up to 30 shops (excluding left/right rail shops)
- **Hero:** Shows shop with `planType === 'HERO'`

---

### Step 6: Update /api/search Endpoint

**File:** `app/api/search/route.ts`

#### 6.1 Add City Filter Support
```typescript
interface SearchParams {
  pincode?: string;
  area?: string;
  category?: string;
  city?: string;  // Added
  shopName?: string;
  planType?: string;
  userLat?: number;
  userLng?: number;
}
```

#### 6.2 Build MongoDB Query with Filters
```typescript
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const pincode = searchParams.get('pincode');
  const area = searchParams.get('area');
  const category = searchParams.get('category');
  const city = searchParams.get('city');  // Added
  const shopName = searchParams.get('shopName');
  const planType = searchParams.get('planType');
  const userLat = parseFloat(searchParams.get('userLat') || '0');
  const userLng = parseFloat(searchParams.get('userLng') || '0');

  await connectDB();

  // Build query
  const query: any = {};
  
  if (pincode) {
    query.pincode = pincode.trim();
  }
  
  if (category) {
    query.category = { $regex: new RegExp(category.trim(), 'i') };
  }
  
  if (city) {
    query.city = { $regex: new RegExp(city.trim(), 'i') };
  }
  
  if (shopName) {
    query.$or = [
      { name: { $regex: new RegExp(shopName.trim(), 'i') } },
      { shopName: { $regex: new RegExp(shopName.trim(), 'i') } }
    ];
  }
  
  if (area) {
    query.area = { $regex: new RegExp(area.trim(), 'i') };
  }

  // Fetch shops from all collections
  const [adminShops, agentShops, oldShops] = await Promise.all([
    AdminShop.find(query).lean(),
    AgentShop.find(query).lean(),
    OldShop.find(query).lean(),
  ]);

  // Combine and deduplicate...
  // Calculate distances...
  // Organize by planType...
  
  return NextResponse.json({
    success: true,
    mainResults: heroShops,
    leftRail: leftRailShops,
    rightRail: rightRailShops,
    bottomStrip: bottomStripShops,
    totalFound: allShops.length,
  });
}
```

#### 6.3 Fallback Logic for Left/Right Rails
```typescript
// If no LEFT_BAR shops found, use any filtered shops (excluding HERO and RIGHT_SIDE)
if (leftRailShops.length === 0) {
  leftRailShops = allShops
    .filter(shop => shop.planType !== 'HERO' && shop.planType !== 'RIGHT_SIDE')
    .slice(0, 3);
}

// If no RIGHT_SIDE shops found, use any filtered shops (excluding HERO and LEFT_BAR)
if (rightRailShops.length === 0) {
  rightRailShops = allShops
    .filter(shop => shop.planType !== 'HERO' && shop.planType !== 'LEFT_BAR')
    .slice(0, 3);
}
```

**What it does:**
- Filters shops based on user's search criteria
- Organizes shops by `planType`:
  - `HERO` → `mainResults` (center banner)
  - `LEFT_BAR` → `leftRail`
  - `RIGHT_SIDE` → `rightRail`
  - `BOTTOM_RAIL`, `BASIC`, `PREMIUM`, `FEATURED` → `bottomStrip`
- Calculates distance from user's location
- Provides fallback shops if plan-specific shops not found

---

## 🔌 API Endpoints

### 1. `/api/search`
**Purpose:** Advanced search with plan-based organization

**Query Parameters:**
- `pincode` (optional) - Filter by pincode
- `category` (optional) - Filter by category
- `city` (optional) - Filter by city
- `shopName` (optional) - Filter by shop name
- `area` (optional) - Filter by area
- `userLat` (optional) - User's latitude for distance calculation
- `userLng` (optional) - User's longitude for distance calculation

**Response:**
```json
{
  "success": true,
  "mainResults": [...],      // Hero shops (planType: HERO)
  "leftRail": [...],         // Left rail shops (planType: LEFT_BAR)
  "rightRail": [...],        // Right rail shops (planType: RIGHT_SIDE)
  "bottomStrip": [...],      // Bottom strip shops (other plan types)
  "totalFound": 50
}
```

### 2. `/api/shops/search-options`
**Purpose:** Get unique filter options for dropdowns

**Response:**
```json
{
  "success": true,
  "categories": ["Electronics", "Food", "Clothing", ...],
  "cities": ["Patna", "Delhi", "Mumbai", ...],
  "pincodes": ["800001", "800002", "800003", ...]
}
```

### 3. `/api/shops/nearby`
**Purpose:** Fallback endpoint when `/api/search` returns empty

**Query Parameters:**
- `userLat` - User's latitude
- `userLng` - User's longitude
- `radiusKm` - Search radius in kilometers
- `pincode` (optional) - Filter by pincode
- `category` (optional) - Filter by category
- `city` (optional) - Filter by city

**Response:**
```json
{
  "success": true,
  "shops": [...],
  "total": 30
}
```

---

## 🎛️ State Management

### SearchContext Flow

```
User Action → HomepageSearchFilter → SearchContext → HeroSection → API Call → Update UI
```

1. **User selects Category/City/Pincode**
   - `HomepageSearchFilter` updates local state (`selectedCategory`, `selectedCity`, `selectedPincode`)
   - `useEffect` detects change and calls `setSearchParams()` in SearchContext
   - SearchContext state updates

2. **HeroSection detects change**
   - `useEffect` watches `searchParams` from SearchContext
   - Detects `hasFilters === true`
   - Calls `/api/search` with filters

3. **API returns filtered results**
   - HeroSection processes results
   - Sorts Left/Right rails by distance
   - Updates component state (`setData()`)
   - UI re-renders with filtered shops

---

## 🔄 How It Works

### Scenario 1: User Selects Category from Dropdown

1. User clicks Category dropdown → selects "Electronics"
2. `onChange` handler fires → `setSelectedCategory("Electronics")`
3. `useEffect` in HomepageSearchFilter detects change
4. Calls `setSearchParams({ category: "Electronics" })`
5. SearchContext updates → `isSearchActive = true`
6. HeroSection's `useEffect` detects `searchParams.category` changed
7. Calls `/api/search?category=Electronics&userLat=...&userLng=...`
8. API filters shops where `category` matches "Electronics"
9. Returns shops organized by planType
10. HeroSection processes results:
    - Left Rail: 3 nearest Electronics shops
    - Right Rail: 3 nearest Electronics shops (different from left)
    - Bottom Strip: All other Electronics shops
    - Hero: Electronics shop with `planType === 'HERO'` (if exists)
11. UI updates immediately

### Scenario 2: User Types Shop Name and Clicks Search

1. User types "ABC Store" in search bar
2. User clicks "Search Shops" button
3. `handleSearch()` fires → `setSearchParams({ shopName: "ABC Store" })`
4. SearchContext updates
5. HeroSection detects change → calls `/api/search?shopName=ABC Store&...`
6. API filters shops where name contains "ABC Store"
7. Returns matching shops
8. HeroSection displays filtered results
9. Page scrolls to HeroSection (`scrollIntoView`)

### Scenario 3: Multiple Filters Active

1. User selects Category: "Food", City: "Patna", Pincode: "800001"
2. Each dropdown change updates SearchContext immediately
3. HeroSection calls `/api/search?category=Food&city=Patna&pincode=800001&...`
4. API filters shops matching ALL criteria:
   - Category = "Food" AND
   - City = "Patna" AND
   - Pincode = "800001"
5. Returns shops matching all filters
6. HeroSection displays results sorted by distance

---

## 📝 Code Walkthrough

### HomepageSearchFilter.tsx - Key Sections

#### Section 1: Auto-Update on Dropdown Change
```typescript
useEffect(() => {
  const newParams: any = {};
  if (searchQuery.trim()) newParams.shopName = searchQuery.trim();
  if (selectedCategory) newParams.category = selectedCategory;
  if (selectedCity) newParams.city = selectedCity;
  if (selectedPincode) newParams.pincode = selectedPincode;
  
  const paramsChanged = 
    (newParams.shopName || '') !== (searchParams.shopName || '') ||
    (newParams.category || '') !== (searchParams.category || '') ||
    (newParams.city || '') !== (searchParams.city || '') ||
    (newParams.pincode || '') !== (searchParams.pincode || '');
  
  if (paramsChanged) {
    setSearchParams(newParams);
  }
}, [selectedCategory, selectedCity, selectedPincode]);
```

**Why this works:**
- Watches `selectedCategory`, `selectedCity`, `selectedPincode`
- When any changes, immediately updates SearchContext
- Prevents infinite loops by checking if params actually changed
- **Result:** Left/Right/Bottom sections update instantly without form submission

#### Section 2: Form Submission (Shop Name)
```typescript
const handleSearch = (e: React.FormEvent) => {
  e.preventDefault();
  const newParams: any = {};
  if (searchQuery.trim()) newParams.shopName = searchQuery.trim();
  // ... include other filters
  setSearchParams(newParams);
  // Scroll to results
};
```

**Why this works:**
- Shop name requires user to type, so we wait for form submission
- Includes all current filter values (category, city, pincode)
- Updates SearchContext → triggers HeroSection re-fetch

---

### HeroSection.tsx - Key Sections

#### Section 1: Filter Detection
```typescript
const hasFilters = Boolean(
  searchParams.pincode || 
  searchParams.category || 
  searchParams.city || 
  searchParams.shopName ||
  searchParams.area
);

if (hasFilters || isSearchActive) {
  // Use /api/search endpoint
}
```

**Why this works:**
- Checks if ANY filter is present
- If yes, uses `/api/search` (organized by planType)
- If no, uses normal flow (fetches banners separately)

#### Section 2: Distance Sorting
```typescript
const leftBanners = searchData.leftRail
  .filter((shop: any) => shop?.id && !usedShopIds.has(shop.id))
  .sort((a: any, b: any) => {
    const distanceA = a.distance || 999999;
    const distanceB = b.distance || 999999;
    return distanceA - distanceB;  // Nearest first
  })
  .slice(0, 3)
  .map((shop: any) => transformShopToBanner(shop));
```

**Why this works:**
- API calculates distance from user's location
- Sorts by distance (ascending)
- Takes top 3 nearest shops
- Transforms to banner format for display

#### Section 3: Fallback Logic
```typescript
if (searchData?.success && 
    searchData.mainResults?.length === 0 && 
    searchData.leftRail?.length === 0 && 
    searchData.rightRail?.length === 0 && 
    searchData.bottomStrip?.length === 0) {
  // Try fallback: /api/shops/nearby
  const fallbackRes = await fetch(`/api/shops/nearby?userLat=...&userLng=...&pincode=...`);
  const fallbackData = await safeJsonParse(fallbackRes);
  // Process fallback data...
}
```

**Why this works:**
- If `/api/search` returns no results, tries `/api/shops/nearby`
- Ensures users always see shops (even if filters are too restrictive)
- Provides better user experience

---

### /api/search/route.ts - Key Sections

#### Section 1: Build MongoDB Query
```typescript
const query: any = {};

if (pincode) {
  query.pincode = pincode.trim();
}

if (category) {
  query.category = { $regex: new RegExp(category.trim(), 'i') };
}

if (city) {
  query.city = { $regex: new RegExp(city.trim(), 'i') };
}

if (shopName) {
  query.$or = [
    { name: { $regex: new RegExp(shopName.trim(), 'i') } },
    { shopName: { $regex: new RegExp(shopName.trim(), 'i') } }
  ];
}
```

**Why this works:**
- Builds MongoDB query object dynamically
- Uses regex for case-insensitive matching
- Combines multiple filters with AND logic

#### Section 2: Organize by PlanType
```typescript
const heroShops = allShops.filter(s => s.planType === 'HERO');
const leftRailShops = allShops.filter(s => s.planType === 'LEFT_BAR');
const rightRailShops = allShops.filter(s => s.planType === 'RIGHT_SIDE');
const bottomStripShops = allShops.filter(s => 
  ['BOTTOM_RAIL', 'BASIC', 'PREMIUM', 'FEATURED', 'BANNER', 'HERO'].includes(s.planType)
);
```

**Why this works:**
- Separates shops by their `planType` field
- Each section gets appropriate shops
- Ensures proper organization

#### Section 3: Calculate Distance
```typescript
if (userLat && userLng && shop.latitude && shop.longitude) {
  shop.distance = calculateDistance(
    userLat, 
    userLng, 
    shop.latitude, 
    shop.longitude
  );
}
```

**Why this works:**
- Uses Haversine formula to calculate distance
- Stores distance in shop object
- Used by HeroSection for sorting

---

## 🎨 UI/UX Features

### 1. **Immediate Feedback**
- Dropdown changes update results instantly (no form submission needed)
- "Filters Active" indicator shows when filters are applied
- Clear button appears when filters are active

### 2. **User-Friendly Messages**
- Empty state messages explain why no shops are shown
- Example: "No shops found for pincode: 800006"

### 3. **Smooth Scrolling**
- After search, page scrolls to results section
- Uses `scrollIntoView` with smooth behavior

### 4. **Responsive Design**
- Works on mobile and desktop
- Grid layout adapts to screen size

---

## 🐛 Troubleshooting

### Issue: Left/Right Rails Not Updating
**Solution:**
- Check if `useEffect` in HeroSection watches `searchParams`
- Verify `hasFilters` logic includes all filter types
- Check console logs for API calls

### Issue: Filters Not Applied
**Solution:**
- Verify SearchContext is wrapped around app
- Check if `setSearchParams` is called correctly
- Verify API endpoint receives correct query parameters

### Issue: No Shops Showing
**Solution:**
- Check if fallback logic is working
- Verify MongoDB query is correct
- Check if shops exist in database with matching filters

---

## 📊 Summary

### What Was Implemented:
1. ✅ **SearchContext** - Global state management
2. ✅ **HomepageSearchFilter** - UI component for filters
3. ✅ **HeroSection Updates** - Filter detection and API calls
4. ✅ **API Endpoint Updates** - Filter support and plan-based organization
5. ✅ **Distance Sorting** - Nearest shops in Left/Right rails
6. ✅ **Fallback Logic** - Ensures shops always display

### Key Benefits:
- 🚀 **Instant Updates** - Dropdown changes update immediately
- 🎯 **Accurate Filtering** - Multiple filters work together
- 📍 **Distance-Based** - Shows nearest shops first
- 🔄 **Fallback Support** - Always shows shops when possible
- 📱 **Responsive** - Works on all devices

---

## 🔗 Related Files

- `app/components/HomepageSearchFilter.tsx` - Search filter UI
- `app/contexts/SearchContext.tsx` - Global search state
- `app/components/HeroSection.tsx` - Main display component
- `app/page.tsx` - Homepage layout
- `app/api/search/route.ts` - Search API endpoint
- `app/api/shops/search-options/route.ts` - Filter options API

---

**End of Implementation Guide**

