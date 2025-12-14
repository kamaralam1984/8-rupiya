# APIs Used on Homepage - Complete List

## 🔍 Main APIs Used for Shop Data

### 1. `/api/search` ⭐ PRIMARY (When Filters Active)

**Used By:** HeroSection (when `isSearchActive = true`)

**Purpose:** Search shops with filters and organize by plan type

**Query Parameters:**
- `pincode` - Filter by pincode (exact match)
- `city` - Filter by city (case-insensitive regex)
- `category` - Filter by category (exact match)
- `shopName` - Filter by shop name (case-insensitive regex)
- `area` - Filter by area (case-insensitive regex)
- `planType` - Filter by plan type
- `userLat` - User latitude (for distance calculation)
- `userLng` - User longitude (for distance calculation)

**Response:**
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

**Data Sources:**
- AgentShop collection (`agentshops`) - Priority 1
- AdminShop collection (`shopsfromimage`) - Priority 2
- Shop collection (`shops`) - Priority 3

**File:** `app/api/search/route.ts`

---

### 2. `/api/shops/nearby` ⭐ PRIMARY (Most Used)

**Used By:**
- HeroSection (normal flow)
- FeaturedBusinesses
- TopRatedBusinesses
- NewBusinesses

**Purpose:** Fetch shops based on location and filters

**Query Parameters:**
- `useMongoDB=true` (required)
- `userLat` - User latitude (optional)
- `userLng` - User longitude (optional)
- `radiusKm` - Search radius in km (default: 1000)
- `city` - Filter by city (optional)
- `area` - Filter by area (optional)
- `pincode` - Filter by pincode (optional, exact match)
- `category` - Filter by category (optional, exact match)
- `limit` - Limit number of results (optional)

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
      "isVisible": true,
      "paymentStatus": "PAID"
    }
  ]
}
```

**Data Sources:**
- AgentShop collection (`agentshops`) - Priority 1
- AdminShop collection (`shopsfromimage`) - Priority 2
- Shop collection (`shops`) - Priority 3

**Filters Applied:**
- Only shows shops where `paymentStatus = 'PAID'` (or doesn't exist)
- Only shows shops where `isVisible !== false`
- Calculates distance using Haversine formula
- Sorts by priorityRank → distance

**File:** `app/api/shops/nearby/route.ts`

---

### 3. `/api/shops/by-plan` 🔄 FALLBACK

**Used By:** HeroSection (when no shops found via nearby)

**Purpose:** Fetch shops by specific plan type

**Query Parameters:**
- `planType` - Plan type: `LEFT_BAR`, `RIGHT_SIDE`, `HERO`, etc.
- `limit` - Number of results (default: 10)
- `pincode` - Filter by pincode (optional)
- `category` - Filter by category (optional)
- `city` - Filter by city (optional)
- `area` - Filter by area (optional)

**Response:**
```json
{
  "success": true,
  "shops": [...]
}
```

**File:** `app/api/shops/by-plan/route.ts`

---

### 4. `/api/banners` 🖼️ BANNERS

**Used By:** HeroSection (normal flow, for banner images)

**Purpose:** Fetch banner images for hero, left, right sections

**Query Parameters:**
- `section` - Section: `hero`, `left`, `right`, `top`
- `loc` - Location ID
- `cat` - Category (optional)
- `limit` - Number of banners

**Response:**
```json
{
  "success": true,
  "banners": [
    {
      "id": "banner_id",
      "imageUrl": "image_url",
      "linkUrl": "link_url",
      "title": "Banner Title"
    }
  ]
}
```

**File:** `app/api/banners/route.ts`

---

### 5. `/api/businesses/featured` 🔄 FALLBACK

**Used By:**
- FeaturedBusinesses (fallback)
- TopRatedBusinesses (fallback)
- NewBusinesses (fallback)

**Purpose:** Fallback API when `/api/shops/nearby` returns no results

**Response:**
```json
{
  "success": true,
  "businesses": [
    {
      "id": "business_id",
      "name": "Business Name",
      "category": "Category",
      "imageUrl": "image_url",
      "rating": 4.5,
      "reviews": 100,
      "city": "City"
    }
  ]
}
```

**File:** `app/api/businesses/featured/route.ts`

---

### 6. `/api/shops/search-options` 📋 FILTER OPTIONS

**Used By:** HomepageSearchFilter

**Purpose:** Get available filter options (categories, cities, pincodes)

**Response:**
```json
{
  "success": true,
  "categories": ["Category1", "Category2", ...],
  "cities": ["City1", "City2", ...],
  "pincodes": ["800001", "800002", ...],
  "areas": ["Area1", "Area2", ...],
  "totalShops": 100
}
```

**File:** `app/api/shops/search-options/route.ts`

---

### 7. `/api/homepage` ⚙️ SETTINGS

**Used By:** Homepage component

**Purpose:** Get homepage settings (sections visibility, layout, theme)

**Response:**
```json
{
  "success": true,
  "settings": {
    "sections": {
      "hero": true,
      "categories": true,
      "offers": true,
      "featuredBusinesses": true,
      "topRated": true,
      "newBusinesses": true
    },
    "layout": {
      "theme": "light",
      "primaryColor": "#3b82f6",
      "secondaryColor": "#8b5cf6",
      "containerWidth": "98%",
      "sectionSpacing": "40px"
    }
  }
}
```

**File:** `app/api/homepage/route.ts`

---

### 8. `/api/analytics/banner-click` 📊 ANALYTICS

**Used By:** HeroSection (when banner/shop is clicked)

**Purpose:** Track banner/shop clicks for analytics

**Method:** POST

**Body:**
```json
{
  "bannerId": "shop_id",
  "section": "left|right|bottom|hero",
  "position": 0
}
```

**File:** `app/api/analytics/banner-click/route.ts`

---

## 📊 API Usage Summary by Component

### HeroSection Component

**When Search Active (`isSearchActive = true`):**
- ✅ `/api/search` - Main API for filtered shops

**When Search Inactive (`isSearchActive = false`):**
- ✅ `/api/banners` - For banner images (4 calls: hero, left, right, top)
- ✅ `/api/shops/nearby` - For shop data (multiple calls with different filters)
- ✅ `/api/shops/by-plan` - Fallback for plan-specific shops (3 calls: LEFT_BAR, RIGHT_SIDE, HERO)

**Always:**
- ✅ `/api/analytics/banner-click` - Track clicks (POST)

---

### FeaturedBusinesses Component

**Primary:**
- ✅ `/api/shops/nearby` - Fetch shops with filters

**Fallback:**
- ✅ `/api/businesses/featured` - If no shops found

---

### TopRatedBusinesses Component

**Primary:**
- ✅ `/api/shops/nearby` - Fetch shops with filters

**Fallback:**
- ✅ `/api/businesses/featured` - If no shops found

---

### NewBusinesses Component

**Primary:**
- ✅ `/api/shops/nearby` - Fetch shops with filters

**Fallback:**
- ✅ `/api/businesses/featured` - If no shops found

---

### HomepageSearchFilter Component

**For Filter Options:**
- ✅ `/api/shops/search-options` - Get categories, cities, pincodes

---

### Homepage Component

**For Settings:**
- ✅ `/api/homepage` - Get homepage configuration

---

## 🎯 API Priority & Flow

### HeroSection Flow:

```
Check: isSearchActive?
│
├─→ YES → /api/search
│   └─→ Returns: mainResults, leftRail, rightRail, bottomStrip
│
└─→ NO → Normal Flow
    ├─→ /api/banners (4 calls)
    ├─→ /api/shops/nearby (multiple calls)
    └─→ /api/shops/by-plan (3 calls, fallback)
```

### Other Components Flow:

```
Component Mounts
│
├─→ /api/shops/nearby (with filters)
│   └─→ Success? → Display shops
│   └─→ No shops? → /api/businesses/featured (fallback)
```

---

## 📝 API Request Examples

### Example 1: Search API (Filters Active)

```javascript
GET /api/search?pincode=800001&city=Patna&category=Restaurant&userLat=25.5941&userLng=85.1376
```

### Example 2: Nearby Shops API (Normal Flow)

```javascript
GET /api/shops/nearby?useMongoDB=true&radiusKm=1000&userLat=25.5941&userLng=85.1376&city=Patna
```

### Example 3: Nearby Shops API (With Filters)

```javascript
GET /api/shops/nearby?useMongoDB=true&radiusKm=1000&pincode=800001&category=Restaurant&city=Patna
```

### Example 4: Shops by Plan Type

```javascript
GET /api/shops/by-plan?planType=LEFT_BAR&limit=10&city=Patna
```

### Example 5: Search Options

```javascript
GET /api/shops/search-options
```

---

## 🔄 API Call Sequence on Homepage Load

### Initial Load (No Filters):

1. **Homepage Component**
   - `GET /api/homepage` - Get settings

2. **HomepageSearchFilter Component**
   - `GET /api/shops/search-options` - Get filter options

3. **HeroSection Component**
   - `GET /api/banners?section=hero&loc=...` - Hero banner
   - `GET /api/banners?section=left&loc=...` - Left banners
   - `GET /api/banners?section=right&loc=...` - Right banners
   - `GET /api/banners?section=top&loc=...` - Top banners
   - `GET /api/shops/nearby?useMongoDB=true&radiusKm=1000&userLat=...&userLng=...` - Nearby shops
   - `GET /api/shops/nearby?radiusKm=1000&useMongoDB=true` - All shops (fallback)
   - `GET /api/shops/by-plan?planType=LEFT_BAR&limit=10` - Left bar shops (fallback)
   - `GET /api/shops/by-plan?planType=RIGHT_SIDE&limit=10` - Right side shops (fallback)
   - `GET /api/shops/by-plan?planType=HERO&limit=10` - Hero shops (fallback)

4. **FeaturedBusinesses Component**
   - `GET /api/shops/nearby?useMongoDB=true&radiusKm=1000&userLat=...&userLng=...`

5. **TopRatedBusinesses Component**
   - `GET /api/shops/nearby?useMongoDB=true&radiusKm=1000&userLat=...&userLng=...`

6. **NewBusinesses Component**
   - `GET /api/shops/nearby?useMongoDB=true&radiusKm=1000&userLat=...&userLng=...`

---

### When Filters Applied:

1. **HeroSection Component**
   - `GET /api/search?pincode=800001&city=Patna&category=Restaurant&userLat=...&userLng=...`

2. **FeaturedBusinesses Component**
   - `GET /api/shops/nearby?useMongoDB=true&radiusKm=1000&pincode=800001&city=Patna&category=Restaurant&userLat=...&userLng=...`

3. **TopRatedBusinesses Component**
   - `GET /api/shops/nearby?useMongoDB=true&radiusKm=1000&pincode=800001&city=Patna&category=Restaurant&userLat=...&userLng=...`

4. **NewBusinesses Component**
   - `GET /api/shops/nearby?useMongoDB=true&radiusKm=1000&pincode=800001&city=Patna&category=Restaurant&userLat=...&userLng=...`

---

## 🗄️ Database Collections Used

All shop APIs fetch from these MongoDB collections (in priority order):

1. **`agentshops`** - AgentShop model (`lib/models/AgentShop.ts`) - HIGHEST PRIORITY
2. **`shopsfromimage`** - AdminShop model (`lib/models/Shop.ts`) - SECOND PRIORITY
3. **`shops`** - Shop model (`models/Shop.ts`) - LOWEST PRIORITY

---

## ✅ Summary

**Primary APIs:**
1. `/api/search` - When filters active (HeroSection)
2. `/api/shops/nearby` - Most common API (all components)
3. `/api/banners` - Banner images (HeroSection normal flow)

**Supporting APIs:**
4. `/api/shops/by-plan` - Plan-specific shops (HeroSection fallback)
5. `/api/businesses/featured` - Fallback for Featured/TopRated/New components
6. `/api/shops/search-options` - Filter options (HomepageSearchFilter)
7. `/api/homepage` - Homepage settings (Homepage component)

**Analytics:**
8. `/api/analytics/banner-click` - Track clicks (HeroSection)

**Most Used API:** `/api/shops/nearby` - Used by 4 components and HeroSection fallback

