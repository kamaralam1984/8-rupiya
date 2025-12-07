# 📊 KVL Business - Complete System Documentation Report

## 🎯 Project Overview

**Project Name:** KVL Business Directory  
**Technology Stack:** Next.js 16, React 19, TypeScript, MongoDB, Mongoose, Tailwind CSS  
**Purpose:** A comprehensive business directory platform with agent management, payment tracking, and location-based shop discovery

---

## 📁 Database Structure & Collections

### 1. **Shops Collection (`shopsfromimage`)**
**Model:** `lib/models/Shop.ts`  
**Purpose:** Stores shops created by admin from images with GPS data

**Fields:**
- `shopName` (String, Required) - Name of the shop
- `ownerName` (String, Required) - Owner's name
- `category` (Enum: Grocery, Clothes, Electronics, Restaurant, Medical, Other)
- `mobile` (String, Optional) - Contact number
- `area` (String, Optional) - Area/locality
- `fullAddress` (String, Required) - Complete address
- `city` (String, Optional) - City name
- `pincode` (String, Optional) - 6-digit pincode
- `latitude` (Number, Required) - GPS latitude
- `longitude` (Number, Required) - GPS longitude
- `photoUrl` (String, Required) - Shop image URL
- `iconUrl` (String, Required) - Icon/image URL
- `createdByAdmin` (ObjectId, Required) - Reference to admin User
- `paymentExpiryDate` (Date) - 365 days from payment date
- `lastPaymentDate` (Date) - Last payment date
- `createdAt` (Date) - Creation timestamp

**Indexes:**
- category, latitude/longitude (geospatial), area, city, pincode, createdByAdmin

---

### 2. **Agents Collection (`agents`)**
**Model:** `lib/models/Agent.ts`  
**Purpose:** Stores agent information and credentials

**Fields:**
- `name` (String, Required) - Agent's full name
- `phone` (String, Required, Unique) - Phone number
- `email` (String, Required, Unique) - Email address
- `passwordHash` (String, Required) - Bcrypt hashed password
- `agentCode` (String, Required, Unique, Uppercase) - Unique agent identifier
- `totalShops` (Number, Default: 0) - Total shops created
- `totalEarnings` (Number, Default: 0) - Total commission earned (20% of payments)
- `createdAt` (Date) - Account creation date
- `updatedAt` (Date) - Last update timestamp

**Methods:**
- `comparePassword(candidatePassword)` - Verify password

**Indexes:**
- agentCode, phone, email

---

### 3. **Agent Shops Collection (`agentshops`)**
**Model:** `lib/models/AgentShop.ts`  
**Purpose:** Stores shops created by agents

**Fields:**
- `shopName` (String, Required) - Shop name
- `ownerName` (String, Required) - Owner name
- `mobile` (String, Required) - Contact number
- `category` (Enum: Grocery, Clothes, Electronics, Restaurant, Medical, Others)
- `pincode` (String, Required) - 6-digit pincode
- `address` (String, Required) - Full address
- `photoUrl` (String, Required) - Shop photo URL
- `latitude` (Number, Required) - GPS latitude
- `longitude` (Number, Required) - GPS longitude
- `paymentStatus` (Enum: PAID, PENDING, Default: PENDING)
- `paymentMode` (Enum: CASH, UPI, NONE, Default: NONE)
- `receiptNo` (String) - Payment receipt number
- `amount` (Number, Default: 100) - Payment amount
- `sendSmsReceipt` (Boolean, Default: false) - SMS receipt flag
- `agentId` (ObjectId, Required) - Reference to Agent
- `paymentExpiryDate` (Date) - 365 days from payment
- `lastPaymentDate` (Date) - Last payment date
- `createdAt` (Date) - Creation timestamp
- `updatedAt` (Date) - Update timestamp

**Indexes:**
- agentId + createdAt (descending), paymentStatus, category, pincode

---

### 4. **Renew Shops Collection (`renewshops`)**
**Model:** `lib/models/RenewShop.ts`  
**Purpose:** Stores expired shops that need payment renewal (365+ days old)

**Fields:**
- `shopName` (String, Required)
- `ownerName` (String, Required)
- `mobile` (String, Required)
- `category` (String, Required)
- `pincode` (String, Required)
- `address` (String, Required)
- `photoUrl` (String, Required)
- `latitude` (Number, Required)
- `longitude` (Number, Required)
- `originalShopId` (ObjectId, Required) - Reference to original shop
- `originalAgentShopId` (ObjectId, Optional) - Reference to AgentShop if exists
- `expiredDate` (Date) - Date when shop expired
- `createdAt` (Date) - Original creation date
- `lastPaymentDate` (Date) - Last payment before expiry

**Indexes:**
- originalShopId, originalAgentShopId, expiredDate, category, pincode

---

### 5. **Renewal Payments Collection (`renewalpayments`)**
**Model:** `lib/models/RenewalPayment.ts`  
**Purpose:** Tracks all renewal payment records with shop and agent details

**Fields:**
- `shopName` (String, Required)
- `ownerName` (String, Required)
- `mobile` (String, Required)
- `category` (String, Required)
- `pincode` (String, Required)
- `address` (String, Required)
- `photoUrl` (String, Required)
- `latitude` (Number, Required)
- `longitude` (Number, Required)
- `agentName` (String, Required) - Agent who created the shop
- `agentCode` (String, Required) - Agent code
- `agentId` (ObjectId, Required) - Reference to Agent
- `renewalAmount` (Number, Default: 100) - Renewal payment amount
- `renewalDate` (Date) - Date of renewal
- `receiptNo` (String, Required) - Receipt number
- `paymentMode` (Enum: CASH, UPI, NONE, Default: CASH)
- `originalShopId` (ObjectId, Required) - Original shop reference
- `originalAgentShopId` (ObjectId, Optional) - Original AgentShop reference
- `createdAt` (Date) - Record creation timestamp

**Indexes:**
- agentId + renewalDate (descending), agentCode, renewalDate, originalShopId

---

### 6. **Other Collections (Legacy/Supporting)**
- `users` - Admin users
- `businesses` - Business listings
- `categories` - Business categories
- `locations` - Location data
- `offers` - Offers/promotions
- `banners` - Banner images
- `sliderimages` - Slider images
- `herobannerimages` - Hero banner images
- `messages` - Contact messages
- `otps` - OTP verification codes

---

## 🔐 Authentication System

### Admin Authentication
**Location:** `app/(auth)/login/page.tsx`, `app/api/auth/login/route.ts`

**Flow:**
1. Admin enters email/phone and password
2. Server verifies credentials against `users` collection
3. JWT token generated and stored in localStorage
4. Token validated on protected routes via `requireAdmin` middleware

**Middleware:** `lib/auth.ts`
- `requireAdmin()` - Validates admin JWT token
- `authenticateRequest()` - General authentication middleware

---

### Agent Authentication
**Location:** `app/agent/login/page.tsx`, `app/api/agent/auth/login/route.ts`

**Flow:**
1. Agent enters Agent ID (agentCode) and password
2. Server finds agent by `agentCode` in `agents` collection
3. Password verified using bcrypt `comparePassword()`
4. JWT token generated with agent data
5. Token stored in localStorage as `agent_token`

**Protection:** `app/components/AgentRouteGuard.tsx`
- Wraps agent pages to check authentication
- Redirects to login if not authenticated

---

## 🛠️ Core Features & Functions

### 1. **Location-Based Shop Discovery**
**Component:** `app/components/NearbyBusinesses.tsx`  
**API:** `app/api/shops/nearby/route.ts`

**How it works:**
1. User's current location captured via Geolocation API
2. Distance slider sets search radius (default: 0 km = all nearby)
3. MongoDB geospatial query finds shops within radius:
   ```javascript
   {
     latitude: { $gte: minLat, $lte: maxLat },
     longitude: { $gte: minLng, $lte: maxLng }
   }
   ```
4. Results sorted by distance and displayed on map/list

**Context:** `app/contexts/LocationContext.tsx`, `app/contexts/DistanceContext.tsx`

---

### 2. **Image-Based Shop Creation (Admin)**
**Page:** `app/(admin)/admin/shops/new-from-image/page.tsx`  
**API:** `app/api/admin/shops/route.ts`, `app/api/admin/upload-shop-image/route.ts`

**Process:**
1. Admin uploads shop image with GPS coordinates in EXIF
2. Image uploaded to Cloudinary
3. EXIF data extracted using `exifr` library
4. GPS coordinates (latitude/longitude) extracted
5. Reverse geocoding via OpenStreetMap Nominatim API to get address
6. Image overlay text parsed for shop name, owner, address, etc.
7. Shop created in `shopsfromimage` collection

**Features:**
- Automatic GPS extraction from EXIF
- Automatic address reverse geocoding
- Text parsing from image overlay
- Manual override option

---

### 3. **Agent Shop Creation**
**Page:** `app/agent/shops/new/page.tsx`  
**API:** `app/api/agent/shops/route.ts`

**Multi-Step Form:**
1. **Step 1: Basic Info**
   - Shop name, owner name, mobile, category, pincode

2. **Step 2: Photo Upload**
   - Image upload to Cloudinary
   - Photo URL stored

3. **Step 3: Location & Payment**
   - **Location Capture:** Automatic via Geolocation API (button press)
   - Payment status (PAID/PENDING)
   - Payment mode (CASH/UPI)
   - Receipt number (auto-generated if empty)
   - SMS receipt option

**Auto-Sync:**
- When agent creates shop with PAID status, corresponding shop automatically created in `shopsfromimage` collection for website display

---

### 4. **Payment Management System**

#### A. **Mark Payment Done (Admin)**
**API:** `app/api/admin/shops/[id]/mark-payment-done/route.ts`  
**Page:** `app/(admin)/admin/shops/page.tsx`

**Process:**
1. Admin marks PENDING shop as PAID
2. `paymentStatus` updated to 'PAID'
3. `lastPaymentDate` set to current date
4. `createdAt` updated to payment date (for 365-day calculation)
5. `paymentExpiryDate` calculated (createdAt + 365 days)
6. If previously PENDING, agent commission (20% of amount) added to `totalEarnings`
7. Shop automatically syncs to agent's shop list

**Commission Calculation:**
```javascript
const commission = Math.round(shop.amount * 0.2); // 20%
agent.totalEarnings += commission;
```

---

#### B. **Payment Status Tracking**
- **PAID:** Payment received, shop active for 365 days
- **PENDING:** Payment not yet received
- **EXPIRED:** 365 days passed, moved to renew collection

**Days Counter:**
- Calculated as: `paymentExpiryDate - currentDate`
- Color-coded badges:
  - Green: > 30 days remaining
  - Yellow: 15-30 days
  - Red: < 15 days
  - Expired: 0 or negative days

---

### 5. **Shop Expiry & Renewal System**

#### A. **Automatic Expiry Detection**
**API:** `app/api/admin/shops/check-expiry/route.ts`  
**Cron/Manual:** Runs every 5 minutes (client-side) or manually

**Process:**
1. Finds shops where `paymentExpiryDate < currentDate`
2. Moves expired shops from `shopsfromimage` to `renewshops` collection
3. Stores `originalShopId` and `originalAgentShopId` for reference
4. Sets `expiredDate` to current date
5. Preserves `createdAt` and `lastPaymentDate`

---

#### B. **Renewal Process**
**Admin API:** `app/api/admin/shops/renew/route.ts`  
**Agent API:** `app/api/agent/shops/renew/route.ts`  
**Pages:** 
- `app/(admin)/admin/shops/renew/page.tsx`
- `app/agent/shops/renew/page.tsx`

**Process:**
1. Admin/Agent selects expired shop from renew list
2. Payment details entered (amount, mode, receipt number)
3. Shop moved back from `renewshops` to `shopsfromimage`
4. `createdAt` updated to renewal date (resets 365-day counter)
5. `paymentExpiryDate` recalculated (renewal date + 365 days)
6. `lastPaymentDate` updated
7. Agent commission (20% of renewal amount) added to `totalEarnings`
8. Entry created in `renewalpayments` collection with:
   - Shop details
   - Agent details (name, code, ID)
   - Payment details (amount, date, receipt, mode)

---

### 6. **Agent Dashboard**
**Page:** `app/agent/dashboard/page.tsx`  
**API:** `app/api/agent/dashboard/route.ts`

**Statistics Displayed:**
- Total shops today
- Total shops this month
- Total shops overall
- Total earnings (with auto-recalculation)

**Auto-Recalculation:**
- On dashboard load, recalculates `totalEarnings` from all PAID shops
- Ensures accuracy: `totalEarnings = sum(commission from all PAID shops)`
- Updates agent record if mismatch found

**Auto-Refresh:**
- Refreshes every 30 seconds
- Updates on window focus

---

### 7. **Admin Panel Features**

#### A. **Shop Management**
**Page:** `app/(admin)/admin/shops/page.tsx`

**Features:**
- View all shops (from `shopsfromimage` and legacy `shops` collections)
- Filter by category, payment status
- Search by shop name, owner name
- **Mark Payment Done** - Update payment status
- **Edit Created Date** - Inline date picker to update `createdAt`
- **Edit Shop** - Update shop details
- **Delete Shop** - Remove shop (also deletes corresponding AgentShop)
- **Days Remaining** - Color-coded expiry counter
- Auto-move expired shops every 5 minutes

**API Endpoints:**
- `GET /api/admin/shops` - List all shops
- `GET /api/admin/shops/[id]` - Get single shop
- `PUT /api/admin/shops/[id]` - Update shop
- `DELETE /api/admin/shops/[id]` - Delete shop
- `POST /api/admin/shops/[id]/mark-payment-done` - Mark payment done
- `POST /api/admin/shops/[id]/update-created-date` - Update created date

---

#### B. **Agent Management**
**Page:** `app/(admin)/admin/agents/page.tsx`

**Features:**
- View all agents
- Create new agent
- Edit agent details
- Reset agent password
- View agent statistics (total shops, earnings)
- **Recalculate Earnings** - Manually recalculate agent's total earnings

**API Endpoints:**
- `GET /api/admin/agents` - List all agents
- `POST /api/admin/agents` - Create agent
- `GET /api/admin/agents/[id]` - Get agent
- `PUT /api/admin/agents/[id]` - Update agent
- `DELETE /api/admin/agents/[id]` - Delete agent
- `POST /api/admin/agents/[id]/reset-password` - Reset password
- `POST /api/admin/agents/[id]/recalculate-earnings` - Recalculate earnings

---

#### C. **Database Viewer**
**Page:** `app/(admin)/admin/database/[collection]/page.tsx`

**Features:**
- View any MongoDB collection
- Grid/Table view toggle
- Search functionality
- Pagination
- Document count
- Edit/Delete documents (for some collections)

**API:** `app/api/admin/database/[collection]/route.ts`

---

#### D. **Renew Shops Management**
**Page:** `app/(admin)/admin/shops/renew/page.tsx`

**Features:**
- View all expired shops
- Renew payment for shops
- Move shop back to active list
- Track renewal history

---

### 8. **Agent Panel Features**

#### A. **Shop Management**
**Page:** `app/agent/shops/page.tsx`

**Features:**
- View all shops created by logged-in agent
- Filter by payment status (PAID/PENDING)
- Filter by category
- Search shops
- View shop details
- Auto-refresh every 30 seconds
- Auto-update on window focus

**API:** `app/api/agent/shops/route.ts`

---

#### B. **Shop Details**
**Page:** `app/agent/shops/[id]/page.tsx`

**Features:**
- View complete shop information
- Payment status display
- Location on map
- Photo display

---

#### C. **Renew Shops**
**Page:** `app/agent/shops/renew/page.tsx`

**Features:**
- View agent's expired shops
- Renew payment
- Move shop back to active list

---

### 9. **Location Capture System**

**Component:** `app/agent/shops/new/page.tsx` (Step 3)

**Process:**
1. User clicks "Capture Current Location" button
2. Browser Geolocation API called
3. Secure origin check (HTTPS or localhost)
4. Permission requested from user
5. GPS coordinates captured
6. Coordinates automatically set in form
7. No manual entry required

**Error Handling:**
- Permission denied
- Position unavailable
- Timeout
- Secure origin required (HTTPS/localhost only)

---

### 10. **Image Upload System**

**Service:** Cloudinary

**Endpoints:**
- `app/api/admin/upload-shop-image/route.ts` - Admin image upload
- `app/api/agent/upload/route.ts` - Agent image upload

**Process:**
1. Image file sent to API
2. Uploaded to Cloudinary
3. URL returned
4. URL stored in database

**Configuration:** `next.config.ts`
- Cloudinary hostname configured for Next.js Image component

---

## 🔄 Data Flow & Synchronization

### Agent Shop → Admin Shop Sync
**When:** Agent creates shop with PAID status

**Process:**
1. Shop created in `agentshops` collection
2. If `paymentStatus === 'PAID'`:
   - Corresponding shop created in `shopsfromimage` collection
   - Same data copied (shopName, ownerName, address, coordinates, etc.)
   - `createdByAdmin` set to null or system admin
   - Shop appears on website immediately

**API:** `app/api/agent/shops/route.ts` (POST)

---

### Payment Status Sync
**When:** Admin marks payment as done

**Process:**
1. Shop updated in `shopsfromimage` collection
2. Corresponding `AgentShop` found by matching:
   - shopName + ownerName + mobile
3. `AgentShop.paymentStatus` updated to 'PAID'
4. Agent's shop list auto-refreshes (30-second interval)

**API:** `app/api/admin/shops/[id]/mark-payment-done/route.ts`

---

### Expiry & Renewal Flow
```
Active Shop (shopsfromimage)
    ↓ (365 days passed)
Expired Shop (renewshops)
    ↓ (Renewal payment)
Active Shop (shopsfromimage) [createdAt updated]
```

---

## 📊 Commission System

### Calculation
- **Commission Rate:** 20% of payment amount
- **Formula:** `commission = Math.round(amount * 0.2)`

### When Commission Added
1. **Initial Payment (PENDING → PAID):**
   - Admin marks payment done
   - If previously PENDING, commission added to `agent.totalEarnings`

2. **Renewal Payment:**
   - Shop renewed from `renewshops`
   - Commission (20% of renewal amount) added to `agent.totalEarnings`

### Auto-Recalculation
- Dashboard load triggers recalculation
- Ensures `totalEarnings = sum(commissions from all PAID shops)`
- Manual recalculation available in admin panel

---

## 🗺️ Geospatial Features

### Nearby Shops Query
**API:** `app/api/shops/nearby/route.ts`

**Algorithm:**
1. User location: `(userLat, userLng)`
2. Distance radius: `distance` (km)
3. Calculate bounding box:
   ```javascript
   const latRange = distance / 111; // 1 degree ≈ 111 km
   const lngRange = distance / (111 * Math.cos(userLat * Math.PI / 180));
   
   const minLat = userLat - latRange;
   const maxLat = userLat + latRange;
   const minLng = userLng - lngRange;
   const maxLng = userLng + lngRange;
   ```
4. Query shops within bounding box
5. Calculate actual distance for each shop
6. Filter by radius
7. Sort by distance

---

## 🔔 Notification System (Planned)

**Service:** `lib/services/notificationService.ts`

**Functions:**
- `sendPaymentConfirmation()` - SMS/Email/WhatsApp on payment
- `sendExpiryReminder()` - Reminder before expiry

**Status:** Structure created, API integration pending

---

## 🎨 Frontend Architecture

### Context Providers
1. **LocationContext** (`app/contexts/LocationContext.tsx`)
   - Manages user's current location
   - Provides location state to components

2. **DistanceContext** (`app/contexts/DistanceContext.tsx`)
   - Manages search radius/distance
   - Persists to localStorage
   - Default: 0 km (show all nearby)

3. **AuthContext** (`app/contexts/AuthContext.tsx`)
   - Admin authentication state
   - Token management

4. **AgentAuthContext** (`app/contexts/AgentAuthContext.tsx`)
   - Agent authentication state
   - Agent token management

---

### Component Structure
```
app/
├── components/          # Reusable components
│   ├── NearbyBusinesses.tsx
│   ├── Navbar.tsx
│   └── ...
├── (admin)/            # Admin routes
│   └── admin/
│       ├── shops/
│       ├── agents/
│       └── ...
├── (agent)/            # Agent routes
│   └── agent/
│       ├── dashboard/
│       ├── shops/
│       └── ...
├── (auth)/             # Authentication routes
│   └── login/
└── page.tsx            # Homepage
```

---

## 🔧 API Routes Summary

### Admin Routes
- `/api/admin/shops` - Shop CRUD
- `/api/admin/shops/[id]/mark-payment-done` - Mark payment
- `/api/admin/shops/[id]/update-created-date` - Update date
- `/api/admin/shops/renew` - Renew shop
- `/api/admin/shops/renew-list` - List expired shops
- `/api/admin/shops/check-expiry` - Check and move expired
- `/api/admin/agents` - Agent CRUD
- `/api/admin/agents/[id]/recalculate-earnings` - Recalculate
- `/api/admin/database/[collection]` - Database viewer

### Agent Routes
- `/api/agent/auth/login` - Agent login
- `/api/agent/me` - Get current agent
- `/api/agent/dashboard` - Dashboard stats
- `/api/agent/shops` - Shop CRUD
- `/api/agent/shops/renew` - Renew shop
- `/api/agent/upload` - Image upload

### Public Routes
- `/api/shops/nearby` - Find nearby shops
- `/api/auth/login` - Admin login
- `/api/auth/signup` - Admin signup
- `/api/auth/send-otp` - Send OTP
- `/api/auth/verify-otp` - Verify OTP

---

## 📱 Key Pages

### Public Pages
- `/` - Homepage with nearby shops
- `/search` - Search businesses
- `/[slug]` - Dynamic category/business pages

### Admin Pages
- `/admin` - Admin dashboard
- `/admin/shops` - Shop management
- `/admin/shops/renew` - Renew shops
- `/admin/agents` - Agent management
- `/admin/database/[collection]` - Database viewer

### Agent Pages
- `/agent/login` - Agent login
- `/agent/dashboard` - Agent dashboard
- `/agent/shops` - Agent's shops
- `/agent/shops/new` - Create new shop
- `/agent/shops/renew` - Renew expired shops

---

## 🔐 Security Features

1. **Password Hashing:** bcrypt with salt rounds 10
2. **JWT Tokens:** Secure token-based authentication
3. **Route Protection:** Middleware for admin/agent routes
4. **Input Validation:** Mongoose schema validation
5. **HTTPS Requirement:** Geolocation API requires secure origin

---

## 📈 Business Logic Summary

### Shop Lifecycle
```
1. Shop Created (PAID/PENDING)
   ↓
2. If PAID: Active for 365 days
   If PENDING: Awaiting payment
   ↓
3. After 365 days: Moved to Renew Shops
   ↓
4. Renewal Payment: Back to Active (365 days reset)
```

### Payment Flow
```
PENDING → Admin marks PAID → Agent gets 20% commission
```

### Renewal Flow
```
EXPIRED → Renew Payment → Shop Active (createdAt updated) → Agent gets 20% commission
```

---

## 🛠️ Development Tools

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run create-agent` - Create new agent
- `npm run reset-agent` - Reset agent password
- `npm run verify-agent` - Verify agent credentials

### Environment Variables
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

---

## 📝 Important Notes

1. **Collection Names:**
   - `shopsfromimage` - Admin-created shops
   - `agentshops` - Agent-created shops
   - `renewshops` - Expired shops
   - `renewalpayments` - Renewal payment records

2. **Date Management:**
   - `createdAt` = Payment date (for 365-day calculation)
   - `paymentExpiryDate` = createdAt + 365 days
   - `lastPaymentDate` = Last payment timestamp

3. **Commission:**
   - 20% of payment amount
   - Added when PENDING → PAID
   - Added on renewal payment
   - Auto-recalculated on dashboard load

4. **Location Capture:**
   - Automatic via Geolocation API
   - Requires HTTPS or localhost
   - No manual entry required

---

## 🎯 System Capabilities

✅ Multi-user system (Admin + Agents)  
✅ Location-based shop discovery  
✅ Payment tracking and management  
✅ Automatic expiry detection  
✅ Renewal system  
✅ Commission calculation  
✅ Image upload with GPS extraction  
✅ Real-time data synchronization  
✅ Database viewer  
✅ Search and filtering  
✅ Responsive design  
✅ Auto-refresh mechanisms  

---

## 📞 Support & Maintenance

### Common Issues
1. **Location capture fails:** Ensure HTTPS or localhost
2. **Payment not syncing:** Check agent shop matching logic
3. **Commission incorrect:** Run recalculation
4. **Expired shops not moving:** Check expiry check cron

### Monitoring
- Check MongoDB connection logs
- Monitor API response times
- Track agent earnings accuracy
- Monitor shop expiry dates

---

**Report Generated:** $(date)  
**Version:** 1.0  
**Last Updated:** Current

---

*This is a comprehensive documentation of the KVL Business Directory system. All features, databases, APIs, and workflows are documented above.*

