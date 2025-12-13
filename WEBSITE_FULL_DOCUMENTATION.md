#

## 📋 Website Overview (वेबसाइट का सारांश)

**8Rupiya** एक **local business directory platform** है जो shop owners को online presence देता है और customers को nearby shops खोजने में मदद करता है। यह एक **Next.js 16** application है जो **MongoDB** database के साथ काम करती है।

---

## 🎯 Website का मुख्य उद्देश्य (Main Purpose)

1. **Shop Owners के लिए:**
   - Online shop listing बनाना
   - Digital presence बढ़ाना
   - Customers तक पहुंच बढ़ाना
   - Different pricing plans के through visibility control

2. **Customers के लिए:**
   - Nearby shops खोजना
   - Shop details देखना (distance, time, visitor count)
   - Category-wise shops browse करना
   - Location-based search करना

3. **Admin के लिए:**
   - सभी shops manage करना
   - Revenue tracking
   - Agent performance monitoring
   - Display settings control

4. **Agents के लिए:**
   - Shops add करना
   - Payments track करना
   - Reports देखना

---

## 🏗️ Technical Architecture (तकनीकी संरचना)

### **Technology Stack:**
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** MongoDB (Mongoose ODM)
- **Styling:** Tailwind CSS 4
- **Authentication:** JWT Tokens + OTP Verification
- **State Management:** React Context API
- **Image Handling:** Next.js Image Optimization

### **Project Structure:**
```
app/
├── (admin)/          # Admin panel routes
├── (agent)/          # Agent panel routes
├── (auth)/           # Authentication routes
├── api/              # API routes (Backend)
├── components/       # React components
├── contexts/         # Global state management
├── shop-directory/   # Public shop directory
└── page.tsx          # Homepage

lib/
├── models/           # MongoDB models
├── auth.ts           # Authentication middleware
└── mongodb.ts        # Database connection
```

---

## 📊 Database Models (डेटाबेस मॉडल)

### 1. **Shop Model** (`lib/models/Shop.ts`)
```typescript
- shopName: string
- ownerName: string
- category: string
- mobile: string
- area: string
- email: string (with OTP verification)
- fullAddress: string
- city: string
- pincode: string
- latitude: number
- longitude: number
- photoUrl: string
- iconUrl: string
- shopUrl: string
- planType: 'BASIC' | 'PREMIUM' | 'FEATURED' | 'LEFT_BAR' | 'RIGHT_SIDE' | 'BOTTOM_RAIL' | 'BANNER' | 'HERO'
- paymentStatus: 'PAID' | 'PENDING'
- visitorCount: number
- isVisible: boolean (public visibility control)
- createdByAdmin / createdByAgent
```

### 2. **Agent Model** (`lib/models/Agent.ts`)
```typescript
- name: string
- email: string
- mobile: string
- agentCode: string
- password: string (hashed)
- shops: ObjectId[] (references)
```

### 3. **AgentShop Model** (`lib/models/AgentShop.ts`)
```typescript
- agentId: ObjectId
- shopName, ownerName, category, etc.
- paymentStatus, planType
- paymentDetails
```

### 4. **Settings Model** (`lib/models/Settings.ts`)
```typescript
- displayLimits: {
    nearbyShops: number
    leftRail: number
    featuredShops: number
    topCategories: number
    latestOffers: number
    featuredBusinesses: number
  }
- iconSizes: {
    bottomStrip: number
    leftRail: number
    featuredBusinesses: number
    latestOffers: number
    topCategories: number
  }
- sectionVisibility: {
    leftRail: boolean
    rightRail: boolean
    bottomRail: boolean
    rightSide: boolean
  }
```

---

## 🎨 Website Features (वेबसाइट की सुविधाएं)

### **1. Homepage (मुख्य पृष्ठ)**

#### **A. Hero Section:**
- **Best Deals Slider:** Top पर promotional images
- **Left Rail:** Left sidebar में shops (3 shops, LEFT_BAR plan)
- **Center Hero:** Main hero banner (HERO plan shops)
- **Right Side:** Right sidebar में shops (1 large shop, RIGHT_SIDE plan)
- **Bottom Rail:** Featured Shops grid (12 shops, BOTTOM_RAIL plan)
- **Bottom Strip:** Nearby Shops horizontal scroll (30 shops, configurable)

**कैसे काम करता है:**
1. Page load पर सभी shops fetch होते हैं
2. Plan type के according shops filter होते हैं
3. Distance calculate होता है (user location से)
4. Settings से display limits और icon sizes fetch होते हैं
5. Section visibility के according sections show/hide होते हैं
6. Layout automatically adjust होता है (जब sections OFF होते हैं)

#### **B. Category Grid:**
- 19+ categories with icons
- Distance और visitor count display
- Click करने पर category page पर redirect

#### **C. Featured Businesses:**
- Featured plan shops
- Grid layout
- Configurable limit और icon size

#### **D. Latest Offers:**
- Offers with shops
- Grid layout
- Configurable limit और icon size

---

### **2. Search Pitara (Shop Directory Page)**

**Location:** `/shop-directory`

**Features:**
- **Search Bar:** Shop name, owner, category, area, city, pincode से search
- **Filters:**
  - Category dropdown
  - City dropdown
  - Pincode dropdown
- **View Modes:**
  - Grid View (cards)
  - List View (table)
- **Display Info:** km, min, visitor, location (area, city, pincode) एक line में
- **Rotating Slogans:** 3 Hindi slogans rotate होते हैं (10 seconds interval)

**कैसे काम करता है:**
1. Page load पर सभी visible shops fetch होते हैं
2. Filters apply होने पर shops filter होते हैं
3. Real-time search (as you type)
4. Sort by distance और visitor count
5. Grid/List view toggle

---

### **3. Admin Panel** (`/admin`)

#### **A. Dashboard:**
- Total shops count
- Revenue summary
- Agent statistics

#### **B. Shop Management:**
- **Shop Directory:** All shops list
  - Search और filter
  - Grid/List view
  - Bulk visibility toggle
  - Individual shop visibility toggle
- **Shop Details:** Edit shop information
- **Payment Management:** Mark payments, update plans

#### **C. Reports & Analytics:**
- **Revenue Reports:** Total revenue, district-wise
- **Agent Performance:**
  - Agent-wise shop count
  - Agent-wise earnings
  - Shop details per agent
- **Shop Summary:** Total shops, plan-wise breakdown
- **Export:** CSV export for Excel

#### **D. Display Limits Configuration:**
- **Display Limits:**
  - Nearby Shops limit
  - Left Rail limit
  - Featured Shops limit
  - Top Categories limit
  - Latest Offers limit
  - Featured Businesses limit
- **Icon/Image Sizes:**
  - Bottom Strip size
  - Left Rail size
  - Featured Businesses size
  - Latest Offers size
  - Top Categories size
- **Section Visibility:**
  - Left Rail ON/OFF
  - Right Rail ON/OFF
  - Bottom Rail ON/OFF
  - Right Side ON/OFF
  - Layout automatically adjusts when sections are OFF

#### **E. Agent Management:**
- Create agents
- View agent list
- Agent performance
- Reset passwords

#### **F. Settings:**
- Global settings management
- Display configuration

---

### **4. Agent Panel** (`/agent`)

#### **A. Dashboard:**
- Agent statistics
- Total shops added
- Earnings summary

#### **B. Shop Management:**
- **Add New Shop:**
  - Step 1: Basic Info (name, owner, category, mobile, area, email)
  - Step 2: Location (address, city, pincode, coordinates)
  - Step 3: Images (photo upload with compression)
  - Step 4: Plan Selection
  - Email OTP verification required
- **Shop List:** All shops added by agent
- **Shop Details:** View और edit shop
- **Renew Shops:** Renew expired shops

#### **C. Payments:**
- Payment history
- Upload payment screenshots
- Payment verification status

#### **D. Reports:**
- Daily reports
- Shop-wise reports
- Payment reports

---

### **5. Authentication System**

#### **A. User Authentication:**
- **Signup:** Email/Phone + OTP verification
- **Login:** Email/Phone + Password
- **OTP System:** Email-based OTP
- **Password Reset:** Forgot password flow
- **JWT Tokens:** Secure authentication

#### **B. Agent Authentication:**
- **Agent Login:** Agent code + Password
- **JWT Tokens:** Agent-specific tokens
- **Route Guards:** Protected routes

#### **C. Admin Authentication:**
- **Admin Login:** Email + Password
- **JWT Tokens:** Admin-specific tokens
- **Middleware:** `requireAdmin` for API protection

---

### **6. Search Functionality**

#### **A. Main Search API** (`/api/search`):
- **Parameters:**
  - `pincode`: Filter by pincode
  - `area`: Filter by area
  - `category`: Filter by category
  - `shopName`: Search by shop name
  - `planType`: Filter by plan type
  - `userLat`, `userLng`: For distance calculation

- **Response:**
  - `mainResults`: Hero section shops (HERO plan)
  - `leftRail`: Left rail shops (LEFT_BAR plan)
  - `rightRail`: Right rail shops (RIGHT_SIDE plan)
  - `bottomStrip`: Bottom strip shops (all other plans)

#### **B. Nearby Shops API** (`/api/shops/nearby`):
- **Parameters:**
  - `userLat`, `userLng`: User coordinates
  - `radiusKm`: Search radius (default 1000 km)
  - `pincode`: Filter by pincode
  - `category`: Filter by category
  - `useMongoDB`: Use MongoDB geospatial queries
  - `limit`: Maximum shops to return

- **Response:**
  - Shops with distance, visitor count
  - Sorted by distance
  - Only visible shops (`isVisible !== false`)

---

### **7. Plan System (प्लान सिस्टम)**

#### **Plan Types:**

1. **BASIC** (₹100/year):
   - Basic listing
   - 1 photo
   - Category search में दिखता है
   - No homepage visibility

2. **LEFT_BAR** (₹100/month):
   - Left sidebar में display (3 slots)
   - Vertical layout
   - Distance और visitor count

3. **RIGHT_SIDE** (₹300/month):
   - Right sidebar में display (1 large slot)
   - Full height
   - Priority display

4. **BOTTOM_RAIL** (₹200/month):
   - Featured Shops grid में (12 slots)
   - Grid layout
   - Prominent display

5. **HERO** (₹500/month):
   - Hero section center में
   - Largest display
   - Highest priority
   - Bottom strip में भी दिखता है

6. **PREMIUM** (₹2,999/year):
   - Enhanced features
   - Multiple photos
   - Offers section
   - WhatsApp button

7. **FEATURED** (₹199+/month):
   - Maximum visibility
   - Homepage banners
   - Top priority

8. **BANNER** (₹399/month):
   - Banner placements
   - Promotional display

**कैसे काम करता है:**
1. Shop creation के समय plan select होता है
2. Plan type के according shop different sections में display होता है
3. Payment status check होता है (only PAID shops display)
4. Plan expiry check होता है
5. Priority ranking के according sorting होता है

---

### **8. Location System (लोकेशन सिस्टम)**

#### **A. Location Detection:**
- **Browser Geolocation API:** Automatic location detection
- **Manual Selection:** City, area, pincode select करना
- **Location Context:** Global state में store होता है
- **LocalStorage:** Location persist होता है

#### **B. Distance Calculation:**
- **Haversine Formula:** GPS coordinates से distance calculate
- **Travel Time:** Distance × 1.5 = minutes
- **Real-time Updates:** Location change पर distance update

#### **C. Location-based Filtering:**
- Pincode filter
- City filter
- Area filter
- Radius-based search (0-1000 km)

---

### **9. Image Handling**

#### **A. Image Upload:**
- **Client-side Compression:** Images compress होते हैं upload से पहले
- **Multiple Formats:** JPG, PNG support
- **Size Limits:** Configurable max size
- **Optimization:** Next.js Image component automatic optimization

#### **B. Image Display:**
- **Lazy Loading:** Images load होते हैं जब needed
- **Responsive Sizes:** Mobile/Desktop के लिए different sizes
- **Placeholder:** Default images अगर image missing

---

### **10. Payment System**

#### **A. Payment Status:**
- **PAID:** Shop visible और active
- **PENDING:** Shop not visible until payment

#### **B. Payment Tracking:**
- Payment date
- Payment expiry (365 days)
- Renewal system
- Payment screenshots upload

#### **C. Revenue Tracking:**
- District-wise revenue
- Agent-wise revenue
- Plan-wise revenue
- Total revenue calculation

---

## 🔄 User Flows (यूजर फ्लो)

### **1. Customer Flow (ग्राहक का फ्लो):**

```
1. Homepage Load
   ↓
2. Location Auto-detect या Manual Select
   ↓
3. Nearby Shops Display (with distance, time, visitor)
   ↓
4. Search/Filter (pincode, category, area)
   ↓
5. Shop Details View
   ↓
6. Contact Shop (call, WhatsApp, visit)
```

### **2. Shop Owner Flow (दुकान मालिक का फ्लो):**

```
1. Agent के through Shop Registration
   ↓
2. Shop Details Fill (name, owner, category, location, images)
   ↓
3. Plan Selection
   ↓
4. Email OTP Verification
   ↓
5. Payment
   ↓
6. Shop Live (visible on website)
```

### **3. Agent Flow (एजेंट का फ्लो):**

```
1. Agent Login
   ↓
2. Dashboard (statistics)
   ↓
3. Add New Shop
   ↓
4. Fill Shop Details (3 steps)
   ↓
5. Email OTP Verification
   ↓
6. Shop Created
   ↓
7. Payment Upload
   ↓
8. Admin Verification
   ↓
9. Shop Live
```

### **4. Admin Flow (एडमिन का फ्लो):**

```
1. Admin Login
   ↓
2. Dashboard (overview)
   ↓
3. Shop Management
   - View all shops
   - Toggle visibility
   - Update plans
   - Mark payments
   ↓
4. Reports & Analytics
   - Revenue reports
   - Agent performance
   - Shop summary
   ↓
5. Settings Management
   - Display limits
   - Icon sizes
   - Section visibility
```

---

## 🛠️ API Endpoints (API एंडपॉइंट)

### **Public APIs:**

1. **`GET /api/shops/nearby`**
   - Nearby shops fetch
   - Distance calculation
   - Filtering support

2. **`GET /api/search`**
   - Multi-parameter search
   - Plan-based organization
   - Distance sorting

3. **`GET /api/settings`**
   - Display limits
   - Icon sizes
   - Section visibility

4. **`GET /api/shops/by-plan`**
   - Plan-wise shops
   - Filtering support

### **Admin APIs:**

1. **`GET /api/admin/settings`**
   - Fetch settings (admin only)

2. **`PUT /api/admin/settings`**
   - Update settings (admin only)

3. **`GET /api/admin/reports/agents`**
   - Agent performance data

4. **`GET /api/admin/reports/export`**
   - Export reports to CSV

5. **`PUT /api/admin/shops/[id]/visibility`**
   - Toggle shop visibility

6. **`POST /api/admin/shops/bulk-visibility`**
   - Bulk visibility update

### **Agent APIs:**

1. **`POST /api/agent/shops`**
   - Create new shop
   - Email OTP verification

2. **`GET /api/agent/shops`**
   - Agent's shops list

3. **`GET /api/agent/dashboard`**
   - Agent statistics

### **Auth APIs:**

1. **`POST /api/auth/send-otp`**
   - Send OTP (signup, login, email-verification)

2. **`POST /api/auth/verify-otp`**
   - Verify OTP

3. **`POST /api/auth/signup`**
   - User registration

4. **`POST /api/auth/login`**
   - User login

---

## 🎨 Component Structure (कंपोनेंट संरचना)

### **Homepage Components:**

1. **`HeroSection.tsx`**
   - Main hero section
   - Fetches shops based on plan types
   - Applies filters
   - Dynamic layout based on section visibility

2. **`LeftRail.tsx`**
   - Left sidebar shops
   - Configurable limit और icon size
   - Distance display

3. **`RightSide.tsx`**
   - Right sidebar shop
   - Single large display
   - Distance display

4. **`BottomRail.tsx`**
   - Featured Shops grid
   - 12 shops display
   - Configurable limit

5. **`BottomStrip.tsx`**
   - Nearby Shops horizontal scroll
   - Configurable limit (default 30)
   - Configurable icon size
   - Area display at bottom

6. **`CategoryGrid.tsx`**
   - Category icons grid
   - Distance to nearest shop
   - Configurable limit और icon size

7. **`FeaturedBusinesses.tsx`**
   - Featured businesses grid
   - Configurable limit और icon size

8. **`LatestOffers.tsx`**
   - Latest offers grid
   - Configurable limit और icon size

### **Shop Directory Components:**

1. **`shop-directory/page.tsx`**
   - Main shop directory page
   - Search और filter functionality
   - Grid/List view toggle
   - Rotating slogans

### **Admin Components:**

1. **`admin/settings/page.tsx`**
   - Display limits configuration
   - Icon sizes configuration
   - Section visibility configuration

2. **`admin/reports/page.tsx`**
   - Revenue reports
   - Agent performance
   - Shop summary
   - Export functionality

3. **`admin/shops/directory/page.tsx`**
   - Shop management
   - Visibility toggle
   - Bulk operations

---

## 🔐 Security Features (सुरक्षा सुविधाएं)

1. **JWT Authentication:** Secure token-based auth
2. **OTP Verification:** Email-based OTP
3. **Password Hashing:** bcrypt for passwords
4. **Route Guards:** Protected routes
5. **Admin Middleware:** `requireAdmin` for admin APIs
6. **Agent Middleware:** `verifyAgentToken` for agent APIs
7. **Input Validation:** All inputs validated
8. **SQL Injection Protection:** Mongoose ODM protection

---

## 📱 Responsive Design (रिस्पॉन्सिव डिज़ाइन)

### **Breakpoints:**
- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

### **Layout Adjustments:**
- Mobile: Single column, smaller icons
- Tablet: 2-3 columns, medium icons
- Desktop: Full layout, larger icons

---

## 🎯 Key Features Summary (मुख्य सुविधाएं सारांश)

### ✅ **Implemented Features:**

1. ✅ Shop listing और management
2. ✅ Plan-based shop display
3. ✅ Location-based search
4. ✅ Distance calculation
5. ✅ Visitor tracking
6. ✅ Payment system
7. ✅ Agent system
8. ✅ Admin panel
9. ✅ Reports और analytics
10. ✅ Display limits configuration
11. ✅ Icon sizes configuration
12. ✅ Section visibility control
13. ✅ Email OTP verification
14. ✅ Image upload और compression
15. ✅ Duplicate shop prevention
16. ✅ Shop visibility control
17. ✅ Dynamic layout adjustment
18. ✅ Rotating slogans
19. ✅ Search Pitara (Shop Directory)
20. ✅ Area, city, pincode display

---

## 🚀 How It Works (कैसे काम करता है)

### **1. Homepage Load Process:**

```
1. User visits homepage
   ↓
2. Location Context checks for saved location
   ↓
3. If no location, requests browser geolocation
   ↓
4. HeroSection component loads
   ↓
5. Fetches settings (display limits, icon sizes, section visibility)
   ↓
6. Fetches shops from /api/shops/nearby
   ↓
7. Filters shops by plan type
   ↓
8. Calculates distances
   ↓
9. Sorts by priority और distance
   ↓
10. Displays shops in respective sections
   ↓
11. Applies section visibility settings
   ↓
12. Adjusts layout if sections are OFF
```

### **2. Search Process:**

```
1. User enters search query
   ↓
2. SearchContext updates
   ↓
3. HeroSection detects search active
   ↓
4. Calls /api/search with parameters
   ↓
5. API filters shops by search criteria
   ↓
6. Organizes by plan type
   ↓
7. Returns organized results
   ↓
8. HeroSection displays in respective sections
```

### **3. Shop Creation Process:**

```
1. Agent logs in
   ↓
2. Navigates to "Add New Shop"
   ↓
3. Fills Step 1: Basic Info
   ↓
4. Fills Step 2: Location
   ↓
5. Enters Email
   ↓
6. Clicks "Send OTP"
   ↓
7. API sends OTP email
   ↓
8. User enters OTP
   ↓
9. API verifies OTP
   ↓
10. Step 3: Upload images
   ↓
11. Step 4: Select plan
   ↓
12. Submit shop
   ↓
13. API creates shop in database
   ↓
14. Shop status: PENDING
   ↓
15. Agent uploads payment
   ↓
16. Admin verifies payment
   ↓
17. Shop status: PAID
   ↓
18. Shop becomes visible on website
```

### **4. Settings Update Process:**

```
1. Admin goes to Settings page
   ↓
2. Changes display limits / icon sizes / section visibility
   ↓
3. Clicks "Save Changes"
   ↓
4. API updates MongoDB
   ↓
5. Settings saved
   ↓
6. Frontend components fetch new settings
   ↓
7. Components update display
   ↓
8. Layout adjusts automatically
```

---

## 📈 Data Flow (डेटा फ्लो)

### **Shop Data Flow:**

```
MongoDB (Shop Collection)
    ↓
API Route (/api/shops/nearby)
    ↓
HeroSection Component
    ↓
Filter by Plan Type
    ↓
Calculate Distances
    ↓
Sort & Limit
    ↓
Display Components (LeftRail, RightSide, BottomRail, BottomStrip)
    ↓
User View
```

### **Settings Data Flow:**

```
Admin Panel
    ↓
PUT /api/admin/settings
    ↓
MongoDB (Settings Collection)
    ↓
GET /api/settings (Public)
    ↓
Frontend Components
    ↓
Apply Settings (limits, sizes, visibility)
    ↓
Updated Display
```

---

## 🎨 UI/UX Features (यूआई/यूएक्स सुविधाएं)

1. **Animations:**
   - Fade-in on page load
   - Hover effects
   - Slogan rotation animations
   - Color cycling animations

2. **Responsive Design:**
   - Mobile-first approach
   - Adaptive layouts
   - Touch-friendly buttons

3. **Loading States:**
   - Skeleton loaders
   - Loading spinners
   - Progress indicators

4. **Error Handling:**
   - Toast notifications
   - Error messages
   - Fallback displays

---

## 🔧 Configuration System (कॉन्फ़िगरेशन सिस्टम)

### **Display Limits:**
- Control how many items show in each section
- Range: 1-100 (depending on section)
- Default values set
- Real-time updates

### **Icon Sizes:**
- Control image/icon sizes
- Range: 30-500px (depending on section)
- Default values set
- Responsive scaling

### **Section Visibility:**
- Turn sections ON/OFF
- Layout automatically adjusts
- No blank spaces
- Real-time updates

---

## 📊 Analytics & Tracking (एनालिटिक्स और ट्रैकिंग)

1. **Visitor Count:** Shop views tracked
2. **Banner Clicks:** Banner click tracking
3. **Offer Clicks:** Offer click tracking
4. **Search Analytics:** Search queries tracked
5. **Revenue Tracking:** Payment tracking
6. **Agent Performance:** Shop count और earnings

---

## 🎯 Business Logic (बिज़नेस लॉजिक)

### **Shop Visibility Rules:**

1. **Only PAID shops** appear in search results
2. **Only visible shops** (`isVisible !== false`) appear publicly
3. **Plan-based placement:**
   - HERO → Hero section
   - LEFT_BAR → Left rail
   - RIGHT_SIDE → Right side
   - BOTTOM_RAIL → Bottom rail
   - BASIC → Bottom strip
   - Others → Bottom strip

4. **Priority Sorting:**
   - HERO > BOTTOM_RAIL > PREMIUM > FEATURED > BANNER > BASIC

5. **Distance Sorting:**
   - Nearest shops first
   - Within 1000 km radius

6. **Deduplication:**
   - Each shop appears only once per section
   - HERO shops can appear in hero + bottom strip

---

## 🚀 Deployment (डिप्लॉयमेंट)

### **Environment Variables Required:**
```
MONGODB_URI=mongodb://...
JWT_SECRET=...
NODEMAILER_EMAIL=...
NODEMAILER_PASSWORD=...
NEXT_PUBLIC_API_URL=...
```

### **Build Command:**
```bash
npm run build
```

### **Start Command:**
```bash
npm start
```

---

## 📝 Summary (सारांश)

**99 Rupees Digital Shop Directory** एक comprehensive local business directory platform है जो:

1. ✅ Shop owners को online presence देता है
2. ✅ Customers को nearby shops खोजने में मदद करता है
3. ✅ Multiple pricing plans offer करता है
4. ✅ Location-based search support करता है
5. ✅ Admin control panel provide करता है
6. ✅ Agent system for shop creation
7. ✅ Payment और revenue tracking
8. ✅ Reports और analytics
9. ✅ Configurable display settings
10. ✅ Responsive design

**Technology:** Next.js 16, TypeScript, MongoDB, Tailwind CSS
**Status:** Production Ready
**Last Updated:** Current implementation

---

**Documentation Version:** 1.0.0
**Last Updated:** Based on current codebase analysis



