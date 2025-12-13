# Postman API Testing Guide

## 🚀 How to Test Homepage APIs in Postman

This guide shows you how to test all the APIs used on the homepage using Postman.

---

## 📋 Prerequisites

1. **Postman installed** (Download from https://www.postman.com/downloads/)
2. **Your application running** (e.g., `http://localhost:3000` or your deployed URL)
3. **Base URL:** `http://localhost:3000` (or your domain)

---

## 🔍 API 1: `/api/search` - Search Shops with Filters

### Request Details

**Method:** `GET`

**URL:** `http://localhost:3000/api/search`

**Query Parameters:**

| Parameter | Type | Required | Example | Description |
|-----------|------|----------|---------|-------------|
| `pincode` | string | No | `800001` | Filter by pincode (exact match) |
| `city` | string | No | `Patna` | Filter by city |
| `category` | string | No | `Restaurant` | Filter by category |
| `shopName` | string | No | `Pizza` | Filter by shop name |
| `area` | string | No | `Bailey Road` | Filter by area |
| `userLat` | number | No | `25.5941` | User latitude (for distance) |
| `userLng` | number | No | `85.1376` | User longitude (for distance) |

### Example Requests

#### Example 1: Search by Pincode
```
GET http://localhost:3000/api/search?pincode=800001&userLat=25.5941&userLng=85.1376
```

#### Example 2: Search by City and Category
```
GET http://localhost:3000/api/search?city=Patna&category=Restaurant&userLat=25.5941&userLng=85.1376
```

#### Example 3: Search by Shop Name
```
GET http://localhost:3000/api/search?shopName=Pizza&userLat=25.5941&userLng=85.1376
```

#### Example 4: Multiple Filters
```
GET http://localhost:3000/api/search?pincode=800001&city=Patna&category=Restaurant&shopName=Pizza&userLat=25.5941&userLng=85.1376
```

### Expected Response

```json
{
  "success": true,
  "mainResults": [
    {
      "id": "shop_id",
      "name": "Shop Name",
      "shopName": "Shop Name",
      "category": "Restaurant",
      "city": "Patna",
      "pincode": "800001",
      "imageUrl": "image_url",
      "photoUrl": "image_url",
      "latitude": 25.5941,
      "longitude": 85.1376,
      "distance": 2.5,
      "visitorCount": 100,
      "planType": "HERO",
      "priorityRank": 5
    }
  ],
  "leftRail": [
    {
      "id": "shop_id",
      "planType": "LEFT_BAR",
      "name": "Left Shop",
      ...
    }
  ],
  "rightRail": [
    {
      "id": "shop_id",
      "planType": "RIGHT_SIDE",
      "name": "Right Shop",
      ...
    }
  ],
  "bottomStrip": [
    {
      "id": "shop_id",
      "planType": "BASIC",
      "name": "Bottom Shop",
      ...
    }
  ],
  "totalFound": 50
}
```

### Postman Steps:

1. **Create New Request**
   - Click "New" → "HTTP Request"
   - Method: `GET`
   - URL: `http://localhost:3000/api/search`

2. **Add Query Parameters**
   - Click "Params" tab
   - Add each parameter:
     - Key: `pincode`, Value: `800001`
     - Key: `userLat`, Value: `25.5941`
     - Key: `userLng`, Value: `85.1376`

3. **Send Request**
   - Click "Send"
   - Check response in "Body" tab

---

## 🏪 API 2: `/api/shops/nearby` - Fetch Nearby Shops

### Request Details

**Method:** `GET`

**URL:** `http://localhost:3000/api/shops/nearby`

**Query Parameters:**

| Parameter | Type | Required | Example | Description |
|-----------|------|----------|---------|-------------|
| `useMongoDB` | boolean | Yes | `true` | Must be `true` |
| `userLat` | number | No | `25.5941` | User latitude |
| `userLng` | number | No | `85.1376` | User longitude |
| `radiusKm` | number | No | `1000` | Search radius (default: 1000) |
| `city` | string | No | `Patna` | Filter by city |
| `area` | string | No | `Bailey Road` | Filter by area |
| `pincode` | string | No | `800001` | Filter by pincode |
| `category` | string | No | `Restaurant` | Filter by category |
| `limit` | number | No | `50` | Limit results |

### Example Requests

#### Example 1: Basic Request (All Shops)
```
GET http://localhost:3000/api/shops/nearby?useMongoDB=true&radiusKm=1000
```

#### Example 2: With Location (Distance Calculation)
```
GET http://localhost:3000/api/shops/nearby?useMongoDB=true&radiusKm=1000&userLat=25.5941&userLng=85.1376
```

#### Example 3: Filter by Pincode
```
GET http://localhost:3000/api/shops/nearby?useMongoDB=true&radiusKm=1000&pincode=800001&userLat=25.5941&userLng=85.1376
```

#### Example 4: Filter by City and Category
```
GET http://localhost:3000/api/shops/nearby?useMongoDB=true&radiusKm=1000&city=Patna&category=Restaurant&userLat=25.5941&userLng=85.1376
```

#### Example 5: With Limit
```
GET http://localhost:3000/api/shops/nearby?useMongoDB=true&radiusKm=1000&limit=50&userLat=25.5941&userLng=85.1376
```

### Expected Response

```json
{
  "success": true,
  "shops": [
    {
      "id": "shop_id",
      "shopName": "Shop Name",
      "name": "Shop Name",
      "category": "Restaurant",
      "city": "Patna",
      "area": "Bailey Road",
      "pincode": "800001",
      "photoUrl": "image_url",
      "imageUrl": "image_url",
      "latitude": 25.5941,
      "longitude": 85.1376,
      "distance": 2.5,
      "visitorCount": 100,
      "planType": "BASIC",
      "priorityRank": 5,
      "isVisible": true,
      "paymentStatus": "PAID"
    }
  ]
}
```

### Postman Steps:

1. **Create New Request**
   - Method: `GET`
   - URL: `http://localhost:3000/api/shops/nearby`

2. **Add Required Parameter**
   - Params tab → Add `useMongoDB` = `true`

3. **Add Optional Parameters**
   - `userLat` = `25.5941`
   - `userLng` = `85.1376`
   - `radiusKm` = `1000`
   - `pincode` = `800001` (optional)

4. **Send Request**

---

## 📋 API 3: `/api/shops/by-plan` - Get Shops by Plan Type

### Request Details

**Method:** `GET`

**URL:** `http://localhost:3000/api/shops/by-plan`

**Query Parameters:**

| Parameter | Type | Required | Example | Description |
|-----------|------|----------|---------|-------------|
| `planType` | string | Yes | `LEFT_BAR` | Plan type: `LEFT_BAR`, `RIGHT_SIDE`, `HERO`, `BASIC`, `PREMIUM`, `FEATURED`, `BOTTOM_RAIL`, `BANNER` |
| `limit` | number | No | `10` | Number of results |
| `pincode` | string | No | `800001` | Filter by pincode |
| `city` | string | No | `Patna` | Filter by city |
| `category` | string | No | `Restaurant` | Filter by category |
| `area` | string | No | `Bailey Road` | Filter by area |

### Example Requests

#### Example 1: Get LEFT_BAR Shops
```
GET http://localhost:3000/api/shops/by-plan?planType=LEFT_BAR&limit=10
```

#### Example 2: Get RIGHT_SIDE Shops
```
GET http://localhost:3000/api/shops/by-plan?planType=RIGHT_SIDE&limit=10
```

#### Example 3: Get HERO Shops
```
GET http://localhost:3000/api/shops/by-plan?planType=HERO&limit=10
```

#### Example 4: Get LEFT_BAR Shops with Filters
```
GET http://localhost:3000/api/shops/by-plan?planType=LEFT_BAR&limit=10&city=Patna&pincode=800001
```

### Expected Response

```json
{
  "success": true,
  "shops": [
    {
      "id": "shop_id",
      "shopName": "Shop Name",
      "planType": "LEFT_BAR",
      "category": "Restaurant",
      "city": "Patna",
      "pincode": "800001",
      "photoUrl": "image_url",
      "latitude": 25.5941,
      "longitude": 85.1376,
      "visitorCount": 100,
      "priorityRank": 5
    }
  ]
}
```

### Postman Steps:

1. **Create New Request**
   - Method: `GET`
   - URL: `http://localhost:3000/api/shops/by-plan`

2. **Add Required Parameter**
   - `planType` = `LEFT_BAR` (or `RIGHT_SIDE`, `HERO`, etc.)

3. **Add Optional Parameters**
   - `limit` = `10`
   - `city` = `Patna` (optional)
   - `pincode` = `800001` (optional)

4. **Send Request**

---

## 🔍 API 4: `/api/shops/search-options` - Get Filter Options

### Request Details

**Method:** `GET`

**URL:** `http://localhost:3000/api/shops/search-options`

**No Parameters Required**

### Example Request

```
GET http://localhost:3000/api/shops/search-options
```

### Expected Response

```json
{
  "success": true,
  "categories": [
    "Restaurant",
    "Hotel",
    "Gym",
    "Hospital",
    ...
  ],
  "cities": [
    "Patna",
    "Delhi",
    "Mumbai",
    ...
  ],
  "pincodes": [
    "800001",
    "800002",
    "800003",
    ...
  ],
  "areas": [
    "Bailey Road",
    "Boring Road",
    "Kankarbagh",
    ...
  ],
  "totalShops": 1000
}
```

### Postman Steps:

1. **Create New Request**
   - Method: `GET`
   - URL: `http://localhost:3000/api/shops/search-options`

2. **Send Request** (No parameters needed)

---

## 🏢 API 5: `/api/businesses/featured` - Featured Businesses

### Request Details

**Method:** `GET`

**URL:** `http://localhost:3000/api/businesses/featured`

**No Parameters Required**

### Example Request

```
GET http://localhost:3000/api/businesses/featured
```

### Expected Response

```json
{
  "success": true,
  "businesses": [
    {
      "id": "business_id",
      "name": "Business Name",
      "category": "Restaurant",
      "imageUrl": "image_url",
      "rating": 4.5,
      "reviews": 100,
      "city": "Patna"
    }
  ]
}
```

---

## 🖼️ API 6: `/api/banners` - Get Banners

### Request Details

**Method:** `GET`

**URL:** `http://localhost:3000/api/banners`

**Query Parameters:**

| Parameter | Type | Required | Example | Description |
|-----------|------|----------|---------|-------------|
| `section` | string | Yes | `hero` | Section: `hero`, `left`, `right`, `top` |
| `loc` | string | Yes | `patna-1` | Location ID |
| `cat` | string | No | `restaurant` | Category (optional) |
| `limit` | number | No | `1` | Number of banners |

### Example Requests

#### Example 1: Get Hero Banner
```
GET http://localhost:3000/api/banners?section=hero&loc=patna-1&limit=1
```

#### Example 2: Get Left Rail Banners
```
GET http://localhost:3000/api/banners?section=left&loc=patna-1&limit=4
```

#### Example 3: Get Right Rail Banners
```
GET http://localhost:3000/api/banners?section=right&loc=patna-1&limit=4
```

---

## 📊 Postman Collection Setup

### Step-by-Step: Create a Postman Collection

1. **Create Collection**
   - Click "New" → "Collection"
   - Name: "8 Rupiya Homepage APIs"

2. **Add Environment Variables**
   - Click "Environments" → "Create Environment"
   - Name: "Local Development"
   - Add variables:
     - `base_url` = `http://localhost:3000`
     - `user_lat` = `25.5941`
     - `user_lng` = `85.1376`
     - `test_pincode` = `800001`
     - `test_city` = `Patna`
     - `test_category` = `Restaurant`

3. **Use Variables in Requests**
   - URL: `{{base_url}}/api/search?pincode={{test_pincode}}&userLat={{user_lat}}&userLng={{user_lng}}`

---

## 🧪 Testing Scenarios

### Scenario 1: Test Left Rail Data

**Request:**
```
GET {{base_url}}/api/search?pincode={{test_pincode}}&userLat={{user_lat}}&userLng={{user_lng}}
```

**Check Response:**
- Look for `leftRail` array
- Should contain shops with `planType: "LEFT_BAR"` (or fallback shops)
- Should have maximum 10 shops, but only first 3 are displayed

**Expected:**
```json
{
  "success": true,
  "leftRail": [
    { "id": "...", "planType": "LEFT_BAR", ... },
    { "id": "...", "planType": "LEFT_BAR", ... },
    { "id": "...", "planType": "LEFT_BAR", ... }
  ]
}
```

---

### Scenario 2: Test Right Rail Data

**Request:**
```
GET {{base_url}}/api/search?pincode={{test_pincode}}&userLat={{user_lat}}&userLng={{user_lng}}
```

**Check Response:**
- Look for `rightRail` array
- Should contain shops with `planType: "RIGHT_SIDE"` (or fallback shops)
- Should have maximum 10 shops, but only first 3 are displayed

**Expected:**
```json
{
  "success": true,
  "rightRail": [
    { "id": "...", "planType": "RIGHT_SIDE", ... },
    { "id": "...", "planType": "RIGHT_SIDE", ... },
    { "id": "...", "planType": "RIGHT_SIDE", ... }
  ]
}
```

---

### Scenario 3: Test Bottom Strip Data

**Request:**
```
GET {{base_url}}/api/search?pincode={{test_pincode}}&userLat={{user_lat}}&userLng={{user_lng}}
```

**Check Response:**
- Look for `bottomStrip` array
- Should contain shops with plan types: `BOTTOM_RAIL`, `PREMIUM`, `FEATURED`, `BANNER`, `BASIC`, `HERO`
- Should NOT contain shops with `planType: "LEFT_BAR"` or `"RIGHT_SIDE"`
- Should have maximum 30 shops

**Expected:**
```json
{
  "success": true,
  "bottomStrip": [
    { "id": "...", "planType": "HERO", ... },
    { "id": "...", "planType": "BOTTOM_RAIL", ... },
    { "id": "...", "planType": "PREMIUM", ... },
    ...
  ]
}
```

---

### Scenario 4: Test Normal Flow (No Filters)

**Request:**
```
GET {{base_url}}/api/shops/nearby?useMongoDB=true&radiusKm=1000&userLat={{user_lat}}&userLng={{user_lng}}
```

**Check Response:**
- Look for `shops` array
- Should contain shops with various `planType` values
- Filter client-side:
  - `planType: "LEFT_BAR"` → Left Rail
  - `planType: "RIGHT_SIDE"` → Right Rail
  - Others → Bottom Strip

---

## 🔍 Debugging Tips

### 1. Check Response Status

**Good Response:**
- Status: `200 OK`
- Body contains `"success": true`

**Error Response:**
- Status: `400`, `500`, etc.
- Body contains `"error"` or `"success": false`

### 2. Check Data Counts

**Left Rail:**
```json
{
  "leftRail": [...]  // Should have shops
}
```

**Right Rail:**
```json
{
  "rightRail": [...]  // Should have shops
}
```

**Bottom Strip:**
```json
{
  "bottomStrip": [...]  // Should have shops
}
```

### 3. Verify Plan Types

**Left Rail should have:**
- `planType: "LEFT_BAR"` (or fallback shops)

**Right Rail should have:**
- `planType: "RIGHT_SIDE"` (or fallback shops)

**Bottom Strip should have:**
- `planType: "BOTTOM_RAIL"`, `"PREMIUM"`, `"FEATURED"`, `"BANNER"`, `"BASIC"`, `"HERO"`
- Should NOT have `"LEFT_BAR"` or `"RIGHT_SIDE"`

### 4. Check Filters

**Test with different filters:**
- Pincode only: `?pincode=800001`
- City only: `?city=Patna`
- Category only: `?category=Restaurant`
- Multiple filters: `?pincode=800001&city=Patna&category=Restaurant`

---

## 📝 Postman Collection JSON

Save this as a Postman Collection file:

```json
{
  "info": {
    "name": "8 Rupiya Homepage APIs",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Search Shops",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/api/search?pincode={{test_pincode}}&userLat={{user_lat}}&userLng={{user_lng}}",
          "host": ["{{base_url}}"],
          "path": ["api", "search"],
          "query": [
            {"key": "pincode", "value": "{{test_pincode}}"},
            {"key": "userLat", "value": "{{user_lat}}"},
            {"key": "userLng", "value": "{{user_lng}}"}
          ]
        }
      }
    },
    {
      "name": "Nearby Shops",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/api/shops/nearby?useMongoDB=true&radiusKm=1000&userLat={{user_lat}}&userLng={{user_lng}}",
          "host": ["{{base_url}}"],
          "path": ["api", "shops", "nearby"],
          "query": [
            {"key": "useMongoDB", "value": "true"},
            {"key": "radiusKm", "value": "1000"},
            {"key": "userLat", "value": "{{user_lat}}"},
            {"key": "userLng", "value": "{{user_lng}}"}
          ]
        }
      }
    },
    {
      "name": "Shops by Plan - LEFT_BAR",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/api/shops/by-plan?planType=LEFT_BAR&limit=10",
          "host": ["{{base_url}}"],
          "path": ["api", "shops", "by-plan"],
          "query": [
            {"key": "planType", "value": "LEFT_BAR"},
            {"key": "limit", "value": "10"}
          ]
        }
      }
    },
    {
      "name": "Shops by Plan - RIGHT_SIDE",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/api/shops/by-plan?planType=RIGHT_SIDE&limit=10",
          "host": ["{{base_url}}"],
          "path": ["api", "shops", "by-plan"],
          "query": [
            {"key": "planType", "value": "RIGHT_SIDE"},
            {"key": "limit", "value": "10"}
          ]
        }
      }
    },
    {
      "name": "Search Options",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/api/shops/search-options",
          "host": ["{{base_url}}"],
          "path": ["api", "shops", "search-options"]
        }
      }
    }
  ]
}
```

---

## ✅ Quick Test Checklist

- [ ] `/api/search` returns `leftRail`, `rightRail`, `bottomStrip` arrays
- [ ] `/api/shops/nearby` returns `shops` array
- [ ] `/api/shops/by-plan?planType=LEFT_BAR` returns LEFT_BAR shops
- [ ] `/api/shops/by-plan?planType=RIGHT_SIDE` returns RIGHT_SIDE shops
- [ ] `/api/shops/search-options` returns categories, cities, pincodes
- [ ] Filters work correctly (pincode, city, category)
- [ ] Distance calculation works (when userLat/userLng provided)
- [ ] Plan types are correct in responses

---

## 🎯 Common Issues & Solutions

### Issue 1: Empty Arrays Returned

**Possible Causes:**
- No shops match the filters
- Database is empty
- Filters are too restrictive

**Solution:**
- Test without filters first: `?useMongoDB=true&radiusKm=1000`
- Check if shops exist in database
- Try different filter values

### Issue 2: Wrong Plan Types

**Possible Causes:**
- Shops don't have `planType` field set
- Plan type values don't match expected values

**Solution:**
- Check database for `planType` values
- Verify plan types: `LEFT_BAR`, `RIGHT_SIDE`, `HERO`, `BASIC`, etc.

### Issue 3: Distance Not Calculated

**Possible Causes:**
- `userLat` and `userLng` not provided
- Shops don't have `latitude` and `longitude` fields

**Solution:**
- Always include `userLat` and `userLng` parameters
- Check if shops have coordinate data

---

## 📱 Testing Mobile/Production URLs

If testing on production, replace `localhost:3000` with your domain:

```
https://yourdomain.com/api/search?pincode=800001&userLat=25.5941&userLng=85.1376
```

---

## 🔗 Quick Links

**Local Development:**
- Base URL: `http://localhost:3000`

**Common Endpoints:**
- Search: `/api/search`
- Nearby: `/api/shops/nearby`
- By Plan: `/api/shops/by-plan`
- Options: `/api/shops/search-options`


