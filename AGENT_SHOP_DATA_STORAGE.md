# 📦 Agent Shop Data Storage Guide

## 🎯 Overview

When an agent creates a shop through the agent panel, the shop data is saved in **TWO MongoDB collections**:

1. **`agentshops`** - Agent's shop tracking collection
2. **`shopsfromimage`** - Main website shops collection

---

## 📍 Collection 1: `agentshops` (AgentShop Collection)

### Database Details

- **Collection Name:** `agentshops`
- **Model File:** `lib/models/AgentShop.ts`
- **Model Name:** `AgentShop`
- **Purpose:** Track shops created by agents, payment status, commissions

### When Data is Saved

**API Endpoint:** `POST /api/agent/shops`

**Code Location:** `app/api/agent/shops/route.ts` (Lines 250-288)

### Data Saved Here

```typescript
{
  shopName: string,              // Shop name
  ownerName: string,             // Owner name
  mobile: string,                // Contact number
  category: string,              // Category name
  pincode: string,              // 6-digit pincode
  address: string,               // Full address
  photoUrl: string,              // Main photo URL
  additionalPhotos?: string[],   // Additional photos (max 9)
  shopUrl: string,               // Unique shop URL slug
  latitude: number,              // GPS latitude
  longitude: number,             // GPS longitude
  paymentStatus: 'PENDING',      // Always PENDING initially
  paymentMode: 'CASH' | 'UPI' | 'NONE',
  receiptNo: string,             // Receipt number
  amount: number,                // Payment amount
  planType: 'BASIC' | 'PREMIUM' | 'FEATURED' | 'LEFT_BAR' | 'RIGHT_SIDE' | 'BOTTOM_RAIL' | 'BANNER' | 'HERO',
  planAmount: number,            // Plan amount
  agentCommission: number,       // Agent commission (20% of amount)
  paymentScreenshot?: string,   // UPI screenshot URL
  sendSmsReceipt: boolean,       // SMS receipt flag
  agentId: ObjectId,             // Reference to Agent
  paymentExpiryDate: undefined,  // Set when admin approves
  lastPaymentDate: undefined,    // Set when admin approves
  visitorCount: 0,               // Initial visitor count
  createdAt: Date                // Creation timestamp
}
```

### Key Points

- ✅ **Always created first** (before AdminShop)
- ✅ **Payment status is always `PENDING`** initially
- ✅ **Used for agent dashboard** - agents see their shops here
- ✅ **Tracks agent commission** - calculates agent earnings
- ✅ **Links to Agent** via `agentId` field

### MongoDB Query Example

```javascript
// Find all shops by an agent
db.agentshops.find({ agentId: ObjectId("agent_id_here") })

// Find pending shops
db.agentshops.find({ paymentStatus: "PENDING" })

// Find shops by plan type
db.agentshops.find({ planType: "PREMIUM" })
```

---

## 📍 Collection 2: `shopsfromimage` (AdminShop Collection)

### Database Details

- **Collection Name:** `shopsfromimage`
- **Model File:** `lib/models/Shop.ts`
- **Model Name:** `ShopFromImage` (exported as `Shop`)
- **Purpose:** Main shops database that powers the website homepage and shop directory

### When Data is Saved

**API Endpoint:** `POST /api/agent/shops`

**Code Location:** `app/api/agent/shops/route.ts` (Lines 321-425)

### Data Saved Here

```typescript
{
  shopName: string,              // Shop name
  ownerName: string,             // Owner name
  category: string,              // Category name
  categoryRef?: ObjectId,        // Reference to Category model
  mobile?: string,               // Contact number
  area?: string,                 // Extracted from address
  fullAddress: string,           // Full address
  city?: string,                 // Extracted from address
  pincode?: string,              // 6-digit pincode
  district?: string,             // District for revenue tracking
  latitude: number,              // GPS latitude
  longitude: number,             // GPS longitude
  photoUrl: string,              // Main photo URL
  iconUrl: string,               // Same as photoUrl
  shopUrl: string,               // Unique shop URL (same as AgentShop)
  createdByAgent?: ObjectId,     // Reference to Agent
  agentName?: string,            // Agent name
  agentCode?: string,            // Agent code
  paymentStatus: 'PENDING',      // Always PENDING initially
  paymentExpiryDate: Date,       // Default: 365 days from now
  lastPaymentDate: undefined,    // Set when admin approves
  visitorCount: 0,               // Initial visitor count
  planType: 'BASIC' | 'PREMIUM' | 'FEATURED' | 'LEFT_BAR' | 'RIGHT_SIDE' | 'BOTTOM_RAIL' | 'BANNER' | 'HERO',
  planAmount: number,            // Plan amount
  planStartDate: Date,           // Current date
  planEndDate: Date,             // Default: 365 days from now
  priorityRank: number,          // Based on plan type
  isHomePageBanner: boolean,     // Based on plan type
  isTopSlider: boolean,          // Based on plan type
  isLeftBar: boolean,            // Based on plan type
  isRightBar: boolean,           // Based on plan type
  isHero: boolean,               // Based on plan type
  additionalPhotos?: string[],   // Additional photos (if plan allows)
  shopLogo?: string,             // Shop logo (if plan allows)
  offers?: Array<{...}>,         // Offers section (if plan allows)
  whatsappNumber?: string,       // WhatsApp number (if plan allows)
  createdAt: Date                // Creation timestamp
}
```

### Key Points

- ✅ **Created second** (after AgentShop)
- ✅ **Used by website** - homepage, shop directory, search
- ✅ **Payment status is always `PENDING`** initially
- ✅ **Tracks agent info** - `createdByAgent`, `agentName`, `agentCode`
- ✅ **Plan features set automatically** - based on plan type
- ✅ **Extracts location data** - area, city, district from address

### MongoDB Query Example

```javascript
// Find all shops created by agents
db.shopsfromimage.find({ createdByAgent: { $exists: true } })

// Find shops by agent code
db.shopsfromimage.find({ agentCode: "AGENT001" })

// Find pending shops
db.shopsfromimage.find({ paymentStatus: "PENDING" })

// Find shops by plan type
db.shopsfromimage.find({ planType: "HERO" })
```

---

## 🔄 Data Flow: Agent Creates Shop

### Step-by-Step Process

1. **Agent submits shop form** → `POST /api/agent/shops`

2. **Validation** → Check required fields, plan type, etc.

3. **Create AgentShop** (Collection: `agentshops`)
   - Save shop data with `paymentStatus: 'PENDING'`
   - Generate unique `shopUrl`
   - Link to agent via `agentId`
   - Calculate agent commission

4. **Create AdminShop** (Collection: `shopsfromimage`)
   - Extract area, city, district from address
   - Set plan-based features automatically
   - Link to agent via `createdByAgent`
   - Save agent name and code

5. **Update Agent Stats**
   - Increment `totalShops` count
   - Add commission to `totalEarnings` (if payment is PAID)

6. **Return Success Response**
   - Return shop ID, name, plan type, payment status

---

## 📊 Database Schema Comparison

| Field | AgentShop (`agentshops`) | AdminShop (`shopsfromimage`) |
|-------|-------------------------|------------------------------|
| **shopName** | ✅ Required | ✅ Required |
| **ownerName** | ✅ Required | ✅ Required |
| **mobile** | ✅ Required | ⚠️ Optional |
| **category** | ✅ Required | ✅ Required |
| **pincode** | ✅ Required | ⚠️ Optional |
| **address** | ✅ Required | ✅ Required (as `fullAddress`) |
| **photoUrl** | ✅ Required | ✅ Required |
| **shopUrl** | ✅ Required (unique) | ✅ Required (unique) |
| **latitude** | ✅ Required | ✅ Required |
| **longitude** | ✅ Required | ✅ Required |
| **paymentStatus** | ✅ Always `PENDING` | ✅ Always `PENDING` |
| **planType** | ✅ Required | ✅ Required |
| **planAmount** | ✅ Required | ✅ Required |
| **agentId** | ✅ Required | ❌ Not stored |
| **createdByAgent** | ❌ Not stored | ✅ Optional |
| **agentName** | ❌ Not stored | ✅ Optional |
| **agentCode** | ❌ Not stored | ✅ Optional |
| **area** | ❌ Not stored | ⚠️ Optional (extracted) |
| **city** | ❌ Not stored | ⚠️ Optional (extracted) |
| **district** | ⚠️ Optional | ⚠️ Optional (extracted) |
| **additionalPhotos** | ✅ Optional (max 9) | ✅ Optional |
| **visitorCount** | ✅ Default: 0 | ✅ Default: 0 |
| **paymentExpiryDate** | ⚠️ Undefined initially | ✅ Default: 365 days |
| **lastPaymentDate** | ⚠️ Undefined initially | ⚠️ Default: now |

---

## 🔍 How to Check Agent Shop Data in MongoDB

### Using MongoDB Compass or MongoDB Shell

#### 1. Check AgentShop Collection

```javascript
// Connect to MongoDB
use your_database_name

// View all agent shops
db.agentshops.find().pretty()

// Find shops by specific agent
db.agentshops.find({ agentId: ObjectId("agent_id_here") }).pretty()

// Find pending shops
db.agentshops.find({ paymentStatus: "PENDING" }).pretty()

// Count shops by plan type
db.agentshops.aggregate([
  { $group: { _id: "$planType", count: { $sum: 1 } } }
])

// Find shops created today
db.agentshops.find({
  createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) }
}).pretty()
```

#### 2. Check AdminShop Collection

```javascript
// View all shops (including agent-created)
db.shopsfromimage.find().pretty()

// Find shops created by agents
db.shopsfromimage.find({ createdByAgent: { $exists: true } }).pretty()

// Find shops by agent code
db.shopsfromimage.find({ agentCode: "AGENT001" }).pretty()

// Find pending shops
db.shopsfromimage.find({ paymentStatus: "PENDING" }).pretty()

// Count shops by plan type
db.shopsfromimage.aggregate([
  { $group: { _id: "$planType", count: { $sum: 1 } } }
])

// Find shops by city
db.shopsfromimage.find({ city: "Patna" }).pretty()
```

#### 3. Compare Both Collections

```javascript
// Find shop in AgentShop
const agentShop = db.agentshops.findOne({ shopName: "Shop Name" })

// Find same shop in AdminShop (by shopUrl)
const adminShop = db.shopsfromimage.findOne({ shopUrl: agentShop.shopUrl })

// Compare data
print("AgentShop ID:", agentShop._id)
print("AdminShop ID:", adminShop._id)
print("Same shopUrl:", agentShop.shopUrl === adminShop.shopUrl)
```

---

## 🧪 Testing in Postman

### Create Shop (Agent)

**Request:**
```
POST http://localhost:3000/api/agent/shops
Headers:
  Authorization: Bearer <agent_token>
Content-Type: application/json

Body:
{
  "shopName": "Test Shop",
  "ownerName": "John Doe",
  "mobile": "9876543210",
  "category": "Restaurant",
  "pincode": "800001",
  "address": "123 Main Street, Patna, Bihar",
  "photoUrl": "https://example.com/photo.jpg",
  "latitude": 25.5941,
  "longitude": 85.1376,
  "planType": "BASIC",
  "amount": 100,
  "paymentMode": "CASH"
}
```

**Response:**
```json
{
  "success": true,
  "shop": {
    "_id": "shop_id",
    "shopName": "Test Shop",
    "ownerName": "John Doe",
    "category": "Restaurant",
    "planType": "BASIC",
    "paymentStatus": "PENDING",
    "shopUrl": "/shop/test-shop-123"
  }
}
```

**What Happens:**
1. ✅ Shop saved in `agentshops` collection
2. ✅ Shop saved in `shopsfromimage` collection
3. ✅ Agent stats updated (`totalShops` incremented)

---

## 🔐 Important Notes

### Payment Status

- **Both collections** save shops with `paymentStatus: 'PENDING'`
- **Admin must approve** before shop appears on website
- **After approval**, `paymentStatus` changes to `'PAID'`
- **Payment dates** are set when admin approves

### Shop URL

- **Same `shopUrl`** in both collections
- **Generated automatically** from shop name + ID
- **Format:** `/shop/shop-name-123`
- **Unique constraint** ensures no duplicates

### Agent Tracking

- **AgentShop** tracks via `agentId` (ObjectId reference)
- **AdminShop** tracks via `createdByAgent`, `agentName`, `agentCode`
- **Both collections** can be queried to find agent's shops

### Data Synchronization

- **Both collections** are created in the same API call
- **If AdminShop creation fails**, AgentShop is still created
- **AdminShop errors** are logged but don't fail the request
- **Manual sync** may be needed if AdminShop creation fails

---

## 📝 Summary

### Where Agent Shop Data is Saved:

1. **`agentshops` Collection**
   - Model: `AgentShop`
   - Purpose: Agent tracking, commissions, payment status
   - Used by: Agent dashboard, agent reports

2. **`shopsfromimage` Collection**
   - Model: `ShopFromImage` (exported as `Shop`)
   - Purpose: Website display, homepage, shop directory
   - Used by: Homepage APIs, search APIs, shop directory

### Key Differences:

- **AgentShop** focuses on **agent tracking** and **commissions**
- **AdminShop** focuses on **website display** and **public features**
- **Both** have same shop data but different purposes
- **Both** start with `paymentStatus: 'PENDING'`
- **Admin approval** required before shop appears on website

---

## 🔗 Related Files

- **API Route:** `app/api/agent/shops/route.ts`
- **AgentShop Model:** `lib/models/AgentShop.ts`
- **AdminShop Model:** `lib/models/Shop.ts`
- **Agent Model:** `lib/models/Agent.ts`
- **Pricing Plans:** `app/utils/pricing.ts`
- **Shop URL Generator:** `lib/utils/slugGenerator.ts`

---

## ✅ Quick Checklist

- [ ] Agent creates shop → Saved in `agentshops`
- [ ] Same shop → Saved in `shopsfromimage`
- [ ] Both have same `shopUrl`
- [ ] Both have `paymentStatus: 'PENDING'`
- [ ] Agent stats updated (`totalShops` incremented)
- [ ] Admin must approve before shop appears on website
- [ ] After approval, `paymentStatus` changes to `'PAID'`

