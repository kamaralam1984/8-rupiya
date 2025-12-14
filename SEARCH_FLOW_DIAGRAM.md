# 🔍 Search & Filter Flow Diagram

## Visual Flow Representation

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         HOMEPAGE (app/page.tsx)                         │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │         HomepageSearchFilter Component (Top of Page)             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │ │
│  │  │ Shop Name    │  │  Category    │  │    City      │           │ │
│  │  │ [Input]      │  │  [Dropdown]  │  │  [Dropdown]  │           │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │ │
│  │                                                                   │ │
│  │  ┌──────────────┐                                                │ │
│  │  │  Pincode     │                                                │ │
│  │  │  [Dropdown]  │                                                │ │
│  │  └──────────────┘                                                │ │
│  │                                                                   │ │
│  │  [🔍 Search Shops]  [Clear Filters]                              │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                          │                                              │
│                          │ Updates SearchContext                        │
│                          ▼                                              │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                    SearchContext (Global State)                    │ │
│  │  {                                                                │ │
│  │    pincode: "800001",                                            │ │
│  │    category: "Electronics",                                      │ │
│  │    city: "Patna",                                                │ │
│  │    shopName: "ABC Store"                                         │ │
│  │  }                                                                │ │
│  │  isSearchActive: true                                            │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                          │                                              │
│                          │ Watches for changes                         │
│                          ▼                                              │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                    HeroSection Component                          │ │
│  │  • Detects filter changes                                        │ │
│  │  • Calls /api/search when filters active                         │ │
│  │  • Processes results                                             │ │
│  │  • Sorts by distance                                             │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                          │                                              │
│                          │ API Call                                     │
│                          ▼                                              │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                    /api/search Endpoint                           │ │
│  │                                                                   │ │
│  │  1. Build MongoDB Query:                                          │ │
│  │     { category: "Electronics", city: "Patna", ... }             │ │
│  │                                                                   │ │
│  │  2. Fetch from Collections:                                      │ │
│  │     • AdminShop                                                  │ │
│  │     • AgentShop                                                  │ │
│  │     • OldShop                                                    │ │
│  │                                                                   │ │
│  │  3. Calculate Distance:                                          │ │
│  │     • From user's location (lat/lng)                             │ │
│  │     • Using Haversine formula                                    │ │
│  │                                                                   │ │
│  │  4. Organize by planType:                                        │ │
│  │     • HERO → mainResults                                         │ │
│  │     • LEFT_BAR → leftRail                                        │ │
│  │     • RIGHT_SIDE → rightRail                                     │ │
│  │     • Others → bottomStrip                                       │ │
│  │                                                                   │ │
│  │  5. Return Structured Data:                                      │ │
│  │     {                                                            │ │
│  │       mainResults: [...],                                        │ │
│  │       leftRail: [...],                                           │ │
│  │       rightRail: [...],                                          │ │
│  │       bottomStrip: [...]                                         │ │
│  │     }                                                            │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                          │                                              │
│                          │ Returns filtered shops                      │
│                          ▼                                              │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │              HeroSection Processes Results                         │ │
│  │                                                                   │ │
│  │  ┌─────────────────────────────────────────────────────────────┐ │ │
│  │  │ LEFT RAIL (3 shops)                                         │ │ │
│  │  │ • Sort by distance (nearest first)                           │ │ │
│  │  │ • Filter out duplicates                                     │ │ │
│  │  │ • Transform to banner format                                │ │ │
│  │  └─────────────────────────────────────────────────────────────┘ │ │
│  │                                                                   │ │
│  │  ┌─────────────────────────────────────────────────────────────┐ │ │
│  │  │ RIGHT RAIL (3 shops)                                        │ │ │
│  │  │ • Sort by distance (nearest first)                          │ │ │
│  │  │ • Exclude left rail shops                                   │ │ │
│  │  │ • Transform to banner format                                │ │ │
│  │  └─────────────────────────────────────────────────────────────┘ │ │
│  │                                                                   │ │
│  │  ┌─────────────────────────────────────────────────────────────┐ │ │
│  │  │ BOTTOM STRIP (up to 30 shops)                               │ │ │
│  │  │ • Exclude left/right rail shops                             │ │ │
│  │  │ • Transform to banner format                                │ │ │
│  │  └─────────────────────────────────────────────────────────────┘ │ │
│  │                                                                   │ │
│  │  ┌─────────────────────────────────────────────────────────────┐ │ │
│  │  │ HERO/CENTER (1 shop)                                        │ │ │
│  │  │ • Shop with planType === 'HERO'                             │ │ │
│  │  │ • Transform to banner format                               │ │ │
│  │  └─────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                          │                                              │
│                          │ Updates UI                                   │
│                          ▼                                              │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                    RENDERED ON HOMEPAGE                           │ │
│  │                                                                   │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐            │ │
│  │  │             │  │              │  │             │            │ │
│  │  │ LEFT RAIL  │  │    HERO      │  │ RIGHT RAIL  │            │ │
│  │  │ (3 shops)  │  │  (1 shop)    │  │  (3 shops)  │            │ │
│  │  │            │  │              │  │             │            │ │
│  │  │ Nearest    │  │   Center     │  │  Nearest    │            │ │
│  │  │ Shops      │  │   Banner     │  │  Shops      │            │ │
│  │  └─────────────┘  └──────────────┘  └─────────────┘            │ │
│  │                                                                   │ │
│  │  ┌───────────────────────────────────────────────────────────┐   │ │
│  │  │              BOTTOM STRIP (up to 30 shops)               │   │ │
│  │  │  [Shop] [Shop] [Shop] [Shop] [Shop] [Shop] ...           │   │ │
│  │  └───────────────────────────────────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Detailed Component Interaction Flow

### Step 1: User Interaction
```
User selects "Electronics" from Category dropdown
    │
    ▼
HomepageSearchFilter.onChange()
    │
    ▼
setSelectedCategory("Electronics")
    │
    ▼
useEffect detects change
    │
    ▼
setSearchParams({ category: "Electronics" })
```

### Step 2: Context Update
```
SearchContext receives update
    │
    ▼
searchParams.category = "Electronics"
    │
    ▼
isSearchActive = true
    │
    ▼
All components subscribed to SearchContext are notified
```

### Step 3: HeroSection Reacts
```
HeroSection.useEffect() detects searchParams change
    │
    ▼
hasFilters = true (category is present)
    │
    ▼
Calls /api/search?category=Electronics&userLat=...&userLng=...
```

### Step 4: API Processing
```
/api/search receives request
    │
    ▼
Builds MongoDB query: { category: /Electronics/i }
    │
    ▼
Fetches from AdminShop, AgentShop, OldShop
    │
    ▼
Filters shops matching "Electronics"
    │
    ▼
Calculates distance from user location
    │
    ▼
Organizes by planType:
    • HERO → mainResults
    • LEFT_BAR → leftRail
    • RIGHT_SIDE → rightRail
    • Others → bottomStrip
    │
    ▼
Returns JSON response
```

### Step 5: HeroSection Processes
```
HeroSection receives search results
    │
    ▼
Processes leftRail:
    • Filters duplicates
    • Sorts by distance (nearest first)
    • Takes top 3
    • Transforms to banner format
    │
    ▼
Processes rightRail:
    • Filters duplicates
    • Excludes left rail shops
    • Sorts by distance (nearest first)
    • Takes top 3
    • Transforms to banner format
    │
    ▼
Processes bottomStrip:
    • Filters duplicates
    • Excludes left/right rail shops
    • Takes up to 30
    • Transforms to banner format
    │
    ▼
Processes mainResults:
    • Finds shop with planType === 'HERO'
    • Transforms to banner format
    │
    ▼
setData({ hero, left, right, bottom })
```

### Step 6: UI Update
```
React re-renders HeroSection
    │
    ▼
LeftRail component receives left banners
    │
    ▼
RightSide component receives right banners
    │
    ▼
BottomStrip component receives bottom banners
    │
    ▼
HeroBanner component receives hero banner
    │
    ▼
User sees filtered shops displayed
```

---

## 📊 Data Flow Summary

### Input → Output Flow

```
USER INPUT
    │
    ├─ Category: "Electronics"
    ├─ City: "Patna"
    ├─ Pincode: "800001"
    └─ Shop Name: "ABC Store"
         │
         ▼
SEARCH CONTEXT
    │
    ├─ searchParams.category = "Electronics"
    ├─ searchParams.city = "Patna"
    ├─ searchParams.pincode = "800001"
    └─ searchParams.shopName = "ABC Store"
         │
         ▼
API QUERY
    │
    └─ MongoDB Query:
        {
          category: /Electronics/i,
          city: /Patna/i,
          pincode: "800001",
          $or: [
            { name: /ABC Store/i },
            { shopName: /ABC Store/i }
          ]
        }
         │
         ▼
FILTERED SHOPS
    │
    ├─ Shop 1: Electronics Store A (distance: 0.5km, planType: LEFT_BAR)
    ├─ Shop 2: Electronics Store B (distance: 1.2km, planType: RIGHT_SIDE)
    ├─ Shop 3: Electronics Store C (distance: 2.3km, planType: BOTTOM_RAIL)
    └─ Shop 4: Electronics Store D (distance: 0.8km, planType: HERO)
         │
         ▼
ORGANIZED BY PLAN TYPE
    │
    ├─ mainResults: [Shop 4] (HERO)
    ├─ leftRail: [Shop 1] (LEFT_BAR)
    ├─ rightRail: [Shop 2] (RIGHT_SIDE)
    └─ bottomStrip: [Shop 3] (BOTTOM_RAIL)
         │
         ▼
SORTED BY DISTANCE
    │
    ├─ LEFT RAIL: [Shop 1 (0.5km), Shop 2 (1.2km), Shop 3 (2.3km)]
    ├─ RIGHT RAIL: [Shop 2 (1.2km), Shop 3 (2.3km)]
    └─ BOTTOM STRIP: [Shop 3 (2.3km)]
         │
         ▼
DISPLAYED ON HOMEPAGE
    │
    ├─ Left Rail: 3 nearest shops
    ├─ Center: Hero banner (Shop 4)
    ├─ Right Rail: 3 nearest shops
    └─ Bottom Strip: All other shops
```

---

## 🎯 Key Decision Points

### Decision 1: When to Use /api/search vs Normal Flow
```
IF (hasFilters OR isSearchActive) THEN
    Use /api/search endpoint
ELSE
    Use normal flow (separate banner fetches)
END IF
```

### Decision 2: How to Sort Left/Right Rails
```
Sort shops by distance (ascending)
Take top 3 nearest shops
```

### Decision 3: Fallback Logic
```
IF (/api/search returns empty) THEN
    Try /api/shops/nearby with same filters
    IF (still empty) THEN
        Show empty state message
    END IF
END IF
```

---

## 🔍 Filter Combination Logic

### Single Filter
```
Category: "Electronics"
    │
    ▼
Query: { category: /Electronics/i }
    │
    ▼
Result: All Electronics shops
```

### Multiple Filters (AND Logic)
```
Category: "Electronics" AND City: "Patna" AND Pincode: "800001"
    │
    ▼
Query: {
    category: /Electronics/i,
    city: /Patna/i,
    pincode: "800001"
}
    │
    ▼
Result: Shops matching ALL criteria
```

### Shop Name Filter (OR Logic)
```
Shop Name: "ABC"
    │
    ▼
Query: {
    $or: [
        { name: /ABC/i },
        { shopName: /ABC/i }
    ]
}
    │
    ▼
Result: Shops with "ABC" in name OR shopName
```

---

**End of Flow Diagram**

