# Left Rail, Right Rail, Bottom Strip - API Data Source

## 📊 Quick Summary

| Section | API Used | Response Field | Plan Type Filter | Fallback |
|---------|----------|----------------|------------------|----------|
| **Left Rail** | `/api/search` OR `/api/shops/nearby` | `leftRail` OR client-side filtered | `LEFT_BAR` | Any shop (if filters active) |
| **Right Rail** | `/api/search` OR `/api/shops/nearby` | `rightRail` OR client-side filtered | `RIGHT_SIDE` | Any shop (if filters active) |
| **Bottom Strip** | `/api/search` OR `/api/shops/nearby` | `bottomStrip` OR client-side filtered | All except `LEFT_BAR` & `RIGHT_SIDE` | N/A |

---

## 🔍 Detailed Breakdown

### Scenario 1: When Search Filters Are Active (`isSearchActive = true`)

**API:** `/api/search`

**Request Example:**
```
GET /api/search?pincode=800001&city=Patna&category=Restaurant&userLat=25.5941&userLng=85.1376
```

**Response Structure:**
```json
{
  "success": true,
  "mainResults": [],      // HERO shops
  "leftRail": [],         // ← LEFT RAIL DATA COMES FROM HERE
  "rightRail": [],        // ← RIGHT RAIL DATA COMES FROM HERE
  "bottomStrip": [],      // ← BOTTOM STRIP DATA COMES FROM HERE
  "totalFound": 0
}
```

---

#### 🟦 LEFT RAIL Data Source

**API Response Field:** `searchData.leftRail`

**What's in `leftRail` array:**
- Shops with `planType = 'LEFT_BAR'` (prioritized)
- If no LEFT_BAR shops found AND filters are active → Fallback to ANY filtered shops (except HERO and RIGHT_SIDE)
- Maximum: 10 shops from API, but only first 3 are displayed

**Processing in HeroSection:**
```javascript
const leftBanners = searchData.leftRail
  .filter((shop: any) => shop?.id && !usedShopIds.has(shop.id))
  .slice(0, 3)  // Take only first 3 shops
  .map((shop: any) => transformShopToBanner(shop));
```

**Display:** First 3 shops from `leftRail` array

**Shop Data Fields Used:**
- `id` - Shop ID
- `imageUrl` or `photoUrl` - Shop image
- `name` or `shopName` - Shop name
- `latitude`, `longitude` - Coordinates
- `distance` - Distance in km
- `area`, `city` - Location info
- `visitorCount` - Visitor count
- `website` - Shop website URL

---

#### 🟦 RIGHT RAIL Data Source

**API Response Field:** `searchData.rightRail`

**What's in `rightRail` array:**
- Shops with `planType = 'RIGHT_SIDE'` (prioritized)
- If no RIGHT_SIDE shops found AND filters are active → Fallback to ANY filtered shops (except HERO and LEFT_BAR)
- Maximum: 10 shops from API, but only first 3 are displayed

**Processing in HeroSection:**
```javascript
const rightBanners = searchData.rightRail
  .filter((shop: any) => shop?.id && !usedShopIds.has(shop.id))
  .slice(0, 3)  // Take only first 3 shops
  .map((shop: any) => transformShopToBanner(shop));
```

**Display:** First 3 shops from `rightRail` array

**Shop Data Fields Used:** (Same as Left Rail)

---

#### 🟦 BOTTOM STRIP Data Source

**API Response Field:** `searchData.bottomStrip`

**What's in `bottomStrip` array:**
- Shops with plan types: `BOTTOM_RAIL`, `PREMIUM`, `FEATURED`, `BANNER`, `BASIC`, `HERO`
- Excludes: `LEFT_BAR` and `RIGHT_SIDE` (they have their own rails)
- Maximum: 30 shops from API, all 30 are displayed

**Processing in HeroSection:**
```javascript
const bottomBanners = searchData.bottomStrip
  .filter((shop: any) => {
    const isLeftOrRight = shop?.planType === 'LEFT_BAR' || shop?.planType === 'RIGHT_SIDE';
    return shop?.id && !isLeftOrRight && !usedShopIds.has(shop.id);
  })
  .sort((a, b) => {
    // Sort by plan priority: HERO > BOTTOM_RAIL > PREMIUM > FEATURED > BANNER > BASIC
  })
  .slice(0, 30)  // Take first 30 shops
  .map((shop: any) => transformShopToBanner(shop));
```

**Display:** First 30 shops from `bottomStrip` array

**Sorting Priority:**
1. HERO (6)
2. BOTTOM_RAIL (5)
3. PREMIUM (4)
4. FEATURED (3)
5. BANNER (2)
6. BASIC (1)
7. Then by `visitorCount` (popularity)

**Shop Data Fields Used:** (Same as Left Rail)

---

### Scenario 2: When Search Filters Are NOT Active (`isSearchActive = false`)

**API:** `/api/shops/nearby` (multiple calls)

**Request Examples:**
```
GET /api/shops/nearby?useMongoDB=true&radiusKm=1000&userLat=25.5941&userLng=85.1376&city=Patna
GET /api/shops/nearby?useMongoDB=true&radiusKm=1000&city=Patna&limit=50
GET /api/shops/by-plan?planType=LEFT_BAR&limit=10
GET /api/shops/by-plan?planType=RIGHT_SIDE&limit=10
GET /api/shops/by-plan?planType=HERO&limit=10
```

**Response Structure:**
```json
{
  "success": true,
  "shops": [
    {
      "id": "shop_id",
      "shopName": "Shop Name",
      "planType": "LEFT_BAR",
      "category": "Category",
      "city": "City",
      "pincode": "Pincode",
      "photoUrl": "image_url",
      "latitude": 25.5941,
      "longitude": 85.1376,
      "distance": 2.5,
      "visitorCount": 100,
      "priorityRank": 5
    }
  ]
}
```

---

#### 🟦 LEFT RAIL Data Source (Normal Flow)

**API:** `/api/shops/nearby` OR `/api/shops/by-plan?planType=LEFT_BAR`

**Data Processing:**
1. Fetches shops from `/api/shops/nearby` (all shops)
2. Filters shops with `planType = 'LEFT_BAR'`
3. If no LEFT_BAR shops found → Uses any shops (fallback)
4. Sorts by: `priorityRank` (higher first) → `distance` (nearest first)
5. Takes first 3 shops

**Code:**
```javascript
const leftBarShops = uniqueShopsArray
  .filter((shop) => shop && shop.id && shop.latitude && shop.longitude)
  .sort((a, b) => {
    // Prioritize LEFT_BAR plan shops
    if (a.planType === 'LEFT_BAR' && b.planType !== 'LEFT_BAR') return -1;
    if (a.planType !== 'LEFT_BAR' && b.planType === 'LEFT_BAR') return 1;
    // Then by priorityRank → distance
    return (b.priorityRank || 0) - (a.priorityRank || 0) || 
           (a.distance || 999999) - (b.distance || 999999);
  })
  .slice(0, 3)  // Take first 3
```

**Display:** 3 shops in left rail

---

#### 🟦 RIGHT RAIL Data Source (Normal Flow)

**API:** `/api/shops/nearby` OR `/api/shops/by-plan?planType=RIGHT_SIDE`

**Data Processing:**
1. Fetches shops from `/api/shops/nearby` (all shops)
2. Filters shops with `planType = 'RIGHT_SIDE'`
3. Excludes shops already used in Left Rail
4. If no RIGHT_SIDE shops found → Uses any shops (fallback)
5. Sorts by: `priorityRank` (higher first) → `distance` (nearest first)
6. Takes first 3 shops

**Code:**
```javascript
const rightBarShops = uniqueShopsArray
  .filter((shop) => 
    shop && shop.id && shop.latitude && shop.longitude &&
    !usedShopIds.has(shop.id)  // Exclude left rail shops
  )
  .sort((a, b) => {
    // Prioritize RIGHT_SIDE plan shops
    if (a.planType === 'RIGHT_SIDE' && b.planType !== 'RIGHT_SIDE') return -1;
    if (a.planType !== 'RIGHT_SIDE' && b.planType === 'RIGHT_SIDE') return 1;
    // Then by priorityRank → distance
    return (b.priorityRank || 0) - (a.priorityRank || 0) || 
           (a.distance || 999999) - (b.distance || 999999);
  })
  .slice(0, 3)  // Take first 3
```

**Display:** 3 shops in right rail

---

#### 🟦 BOTTOM STRIP Data Source (Normal Flow)

**API:** `/api/shops/nearby` (all shops)

**Data Processing:**
1. Fetches shops from `/api/shops/nearby` (all shops)
2. Excludes shops with `planType = 'LEFT_BAR'` or `'RIGHT_SIDE'`
3. Includes shops with plan types: `BOTTOM_RAIL`, `PREMIUM`, `FEATURED`, `BANNER`, `BASIC`, `HERO`
4. Excludes shops already used in Left/Right Rails
5. Sorts by: Plan priority → `visitorCount` → `distance`
6. Takes first 30 shops

**Code:**
```javascript
const bottomShops = uniqueShopsArray
  .filter((shop) => {
    const isLeftOrRight = shop.planType === 'LEFT_BAR' || shop.planType === 'RIGHT_SIDE';
    return !isLeftOrRight && shop && shop.id && !usedShopIds.has(shop.id);
  })
  .sort((a, b) => {
    // Sort by plan priority: HERO > BOTTOM_RAIL > PREMIUM > FEATURED > BANNER > BASIC
    const planPriority = {
      'HERO': 6, 'BOTTOM_RAIL': 5, 'PREMIUM': 4,
      'FEATURED': 3, 'BANNER': 2, 'BASIC': 1
    };
    const priorityA = planPriority[a.planType] || 0;
    const priorityB = planPriority[b.planType] || 0;
    if (priorityB !== priorityA) return priorityB - priorityA;
    // Then by visitorCount → distance
    return (b.visitorCount || 0) - (a.visitorCount || 0) ||
           (a.distance || 999999) - (b.distance || 999999);
  })
  .slice(0, 30)  // Take first 30
```

**Display:** 30 shops in bottom strip

---

## 📋 API Response Field Mapping

### When Using `/api/search`:

```
API Response:
{
  "leftRail": [...]     → Left Rail (3 shops)
  "rightRail": [...]    → Right Rail (3 shops)
  "bottomStrip": [...]  → Bottom Strip (30 shops)
}
```

### When Using `/api/shops/nearby`:

```
API Response:
{
  "shops": [...]  → All shops
}

Then client-side filtering:
- Filter by planType='LEFT_BAR' → Left Rail (3 shops)
- Filter by planType='RIGHT_SIDE' → Right Rail (3 shops)
- Filter by planType != LEFT_BAR/RIGHT_SIDE → Bottom Strip (30 shops)
```

---

## 🔄 Data Flow Summary

### Left Rail:
1. **Search Mode:** `searchData.leftRail` → First 3 shops
2. **Normal Mode:** Filter `shops` array → `planType='LEFT_BAR'` → Sort → First 3 shops

### Right Rail:
1. **Search Mode:** `searchData.rightRail` → First 3 shops
2. **Normal Mode:** Filter `shops` array → `planType='RIGHT_SIDE'` → Sort → First 3 shops

### Bottom Strip:
1. **Search Mode:** `searchData.bottomStrip` → First 30 shops
2. **Normal Mode:** Filter `shops` array → Exclude LEFT_BAR/RIGHT_SIDE → Sort → First 30 shops

---

## 🎯 Key Points

1. **Left Rail** gets data from `leftRail` field (search mode) OR filtered `shops` array (normal mode)
2. **Right Rail** gets data from `rightRail` field (search mode) OR filtered `shops` array (normal mode)
3. **Bottom Strip** gets data from `bottomStrip` field (search mode) OR filtered `shops` array (normal mode)

4. **Plan Type Priority:**
   - Left Rail: `LEFT_BAR` plan shops (or fallback)
   - Right Rail: `RIGHT_SIDE` plan shops (or fallback)
   - Bottom Strip: All other plan types (sorted by priority)

5. **Fallback Logic:**
   - If no plan-specific shops found AND filters are active → Show any filtered shops
   - This ensures shops always appear when filters are applied

