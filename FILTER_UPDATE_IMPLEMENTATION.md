# Filter Update Implementation - Left Rail, Right Rail, Bottom Strip

## 🎯 Overview

When you select **Category**, **City**, or **Pincode** from the search filter dropdowns on the homepage, the **Left Rail**, **Right Rail**, and **Bottom Strip** sections automatically update to show filtered shops.

---

## 🔄 How It Works

### Step 1: User Selects Filter

When you select a value from any dropdown (Category, City, or Pincode):

1. **Dropdown `onChange` handler** updates local state:
   ```typescript
   onChange={(e) => setSelectedCategory(e.target.value)}
   onChange={(e) => setSelectedCity(e.target.value)}
   onChange={(e) => setSelectedPincode(e.target.value)}
   ```

2. **Auto-update `useEffect`** detects the change and updates `SearchContext`:
   ```typescript
   useEffect(() => {
     const newParams: any = {};
     if (selectedCategory) newParams.category = selectedCategory;
     if (selectedCity) newParams.city = selectedCity;
     if (selectedPincode) newParams.pincode = selectedPincode;
     
     setSearchParams(newParams); // Updates global SearchContext
   }, [selectedCategory, selectedCity, selectedPincode]);
   ```

### Step 2: HeroSection Detects Filter Change

The `HeroSection` component watches `searchParams` in its `useEffect` dependency array:

```typescript
useEffect(() => {
  const fetchBanners = async () => {
    // ... fetch logic
  };
  fetchBanners();
}, [
  searchParams.pincode,    // ← Watches pincode changes
  searchParams.category,  // ← Watches category changes
  searchParams.city,      // ← Watches city changes
  searchParams.shopName,
  isSearchActive,
  // ... other dependencies
]);
```

**When any filter changes**, the `useEffect` runs and re-fetches shop data.

### Step 3: API Call with Filters

When filters are active (`isSearchActive = true`), `HeroSection` calls `/api/search` with filter parameters:

```typescript
const searchParamsObj = new URLSearchParams();
if (searchParams.pincode) searchParamsObj.append('pincode', searchParams.pincode);
if (searchParams.category) searchParamsObj.append('category', searchParams.category);
if (searchParams.city) searchParamsObj.append('city', searchParams.city);
if (searchParams.shopName) searchParamsObj.append('shopName', searchParams.shopName);

const searchUrl = `/api/search?${searchParamsObj.toString()}`;
const searchRes = await fetch(searchUrl);
```

### Step 4: API Returns Filtered Results

The `/api/search` endpoint returns filtered shops organized by plan type:

```json
{
  "success": true,
  "leftRail": [...],      // ← LEFT RAIL SHOPS (filtered)
  "rightRail": [...],      // ← RIGHT RAIL SHOPS (filtered)
  "bottomStrip": [...],    // ← BOTTOM STRIP SHOPS (filtered)
  "mainResults": [...]     // ← HERO SHOPS (filtered)
}
```

### Step 5: HeroSection Updates Display

`HeroSection` processes the API response and updates the display:

```typescript
// Left Rail - First 3 shops from leftRail array
const leftBanners = searchData.leftRail
  .filter((shop: any) => shop?.id && !usedShopIds.has(shop.id))
  .slice(0, 3)
  .map(transformShopToBanner);

// Right Rail - First 3 shops from rightRail array
const rightBanners = searchData.rightRail
  .filter((shop: any) => shop?.id && !usedShopIds.has(shop.id))
  .slice(0, 3)
  .map(transformShopToBanner);

// Bottom Strip - First 30 shops from bottomStrip array
const bottomBanners = searchData.bottomStrip
  .filter((shop: any) => {
    const isLeftOrRight = shop?.planType === 'LEFT_BAR' || shop?.planType === 'RIGHT_SIDE';
    return shop?.id && !isLeftOrRight && !usedShopIds.has(shop.id);
  })
  .slice(0, 30)
  .map(transformShopToBanner);

// Update state - triggers re-render
setData({
  hero: heroBanner,
  left: leftBanners,      // ← LEFT RAIL UPDATED
  right: rightBanners,   // ← RIGHT RAIL UPDATED
  bottom: bottomBanners,  // ← BOTTOM STRIP UPDATED
});
```

---

## 📊 Filter Behavior

### When Filters Are Active

**Category Filter:**
- Shows shops matching the selected category
- Applies to: Left Rail, Right Rail, Bottom Strip

**City Filter:**
- Shows shops in the selected city
- Applies to: Left Rail, Right Rail, Bottom Strip

**Pincode Filter:**
- Shows shops with the selected pincode
- Applies to: Left Rail, Right Rail, Bottom Strip

**Multiple Filters:**
- All filters are combined (AND logic)
- Example: Category="Restaurant" + City="Patna" + Pincode="800001"
- Shows shops that match ALL selected filters

### When No Filters Selected

- Shows all shops (no filtering)
- Left Rail: Shops with `planType = 'LEFT_BAR'`
- Right Rail: Shops with `planType = 'RIGHT_SIDE'`
- Bottom Strip: All other shops (sorted by plan priority)

---

## 🔍 Fallback Logic

If no shops match the filters for a specific plan type:

**Left Rail Fallback:**
- If no `LEFT_BAR` shops found → Shows any filtered shops (except HERO and RIGHT_SIDE)

**Right Rail Fallback:**
- If no `RIGHT_SIDE` shops found → Shows any filtered shops (except HERO and LEFT_BAR)

**Bottom Strip:**
- Shows all filtered shops (except LEFT_BAR and RIGHT_SIDE)
- Sorted by plan priority: HERO > BOTTOM_RAIL > PREMIUM > FEATURED > BANNER > BASIC

---

## ⚡ Performance Optimizations

1. **Immediate Updates:** Dropdowns update `SearchContext` immediately (no form submit needed)
2. **Debounced Search:** Shop name search only updates on form submit (not on every keystroke)
3. **Dependency Tracking:** `HeroSection` only re-fetches when filters actually change
4. **API Efficiency:** Single API call (`/api/search`) returns all filtered data at once

---

## 🧪 Testing

### Test Case 1: Select Category

1. Open homepage
2. Select "Restaurant" from Category dropdown
3. **Expected:** Left Rail, Right Rail, Bottom Strip show only Restaurant shops
4. **Verify:** Console shows `🔄 HeroSection: Filter change detected`

### Test Case 2: Select City

1. Select "Patna" from City dropdown
2. **Expected:** All sections show shops in Patna
3. **Verify:** API call includes `city=Patna` parameter

### Test Case 3: Select Pincode

1. Select "800001" from Pincode dropdown
2. **Expected:** All sections show shops with pincode 800001
3. **Verify:** API call includes `pincode=800001` parameter

### Test Case 4: Multiple Filters

1. Select Category="Restaurant" + City="Patna" + Pincode="800001"
2. **Expected:** Shows restaurants in Patna with pincode 800001
3. **Verify:** API call includes all three parameters

### Test Case 5: Clear Filters

1. Click "Clear All Filters" button
2. **Expected:** All sections show all shops (no filtering)
3. **Verify:** `isSearchActive` becomes `false`, normal flow resumes

---

## 📝 Code Changes Made

### 1. `HeroSection.tsx`

**Added to dependency array:**
```typescript
useEffect(() => {
  // ...
}, [
  // ... existing dependencies
  location.city,        // ← Added
  location.pincode,     // ← Added
  searchParams.pincode,
  searchParams.category,
  searchParams.city,
  // ...
]);
```

**Added console logging:**
```typescript
console.log('🔄 HeroSection: Filter change detected - will update left rail, right rail, and bottom strip');
```

### 2. `HomepageSearchFilter.tsx`

**Improved auto-update logic:**
```typescript
useEffect(() => {
  // Auto-updates SearchContext when dropdowns change
  // Ensures immediate filter updates without form submit
}, [selectedCategory, selectedCity, selectedPincode]);
```

**Added console logging:**
```typescript
console.log('🔄 HomepageSearchFilter: Auto-updating search params from dropdowns:', newParams);
```

---

## ✅ Summary

**What Happens:**
1. User selects Category/City/Pincode dropdown
2. `SearchContext` updates immediately
3. `HeroSection` detects change and re-fetches data
4. API returns filtered shops
5. Left Rail, Right Rail, Bottom Strip update automatically

**Key Features:**
- ✅ Immediate updates (no form submit needed)
- ✅ Works with single or multiple filters
- ✅ Fallback logic ensures shops always appear
- ✅ Performance optimized (single API call)
- ✅ Console logging for debugging

---

## 🔗 Related Files

- **Filter Component:** `app/components/HomepageSearchFilter.tsx`
- **Hero Section:** `app/components/HeroSection.tsx`
- **Search Context:** `app/contexts/SearchContext.tsx`
- **Search API:** `app/api/search/route.ts`
- **Documentation:** `LEFT_RIGHT_BOTTOM_API_DATA.md`

---

## 🐛 Troubleshooting

### Issue: Filters not updating

**Check:**
1. Open browser console
2. Look for `🔄 HomepageSearchFilter: Auto-updating search params` log
3. Look for `🔄 HeroSection: Filter change detected` log
4. Verify API call includes filter parameters

### Issue: No shops showing

**Check:**
1. Verify shops exist in database for selected filters
2. Check API response in Network tab
3. Verify `paymentStatus = 'PAID'` for shops
4. Check console for error messages

### Issue: Duplicate shops

**Check:**
1. Verify `usedShopIds` Set is working correctly
2. Check console for duplicate warnings
3. Ensure shops have unique IDs

---

## 📱 User Experience

**Before:**
- User selects filter → Nothing happens until form submit
- Left/Right/Bottom sections don't update

**After:**
- User selects filter → **Immediate update**
- Left Rail, Right Rail, Bottom Strip update automatically
- No form submit needed for dropdowns
- Smooth, responsive user experience

---

## 🎉 Result

When you select **Category**, **City**, or **Pincode** from the search filter:

✅ **Left Rail** updates immediately  
✅ **Right Rail** updates immediately  
✅ **Bottom Strip** updates immediately  
✅ **Hero Banner** updates (if HERO shops match filters)

**All sections reflect the selected filters in real-time!**

