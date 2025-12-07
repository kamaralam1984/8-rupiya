# Digital India - Field Agent Panel

## Overview
A complete Next.js 14 web application for field agents to register shops for the Digital India directory.

## Features

### ✅ Authentication
- JWT-based authentication
- Login with email/phone and password
- Protected routes
- Agent session management

### ✅ Dashboard
- Welcome card with agent name and ID
- Stats cards:
  - Total Shops Today
  - Total Shops This Month
  - Total Shops Overall
  - Total Earnings (Commission)
- Quick navigation grid

### ✅ Shop Management
- **Add New Shop** (Multi-step form):
  1. Step 1: Basic Information (Shop name, Owner name, Mobile, Category, Pincode, Address)
  2. Step 2: Shop Photo Upload
  3. Step 3: Location & Payment (GPS capture, Payment status, Receipt)
- **My Shops**: List all shops with filters (Date, Payment status)
- **Shop Details**: View complete shop information with map link

### ✅ Reports
- Daily Report showing:
  - Shops added today
  - Paid vs Pending count
  - Total amount collected
  - Total commission earned
  - Today's shops table

### ✅ Profile & Settings
- View agent information
- Change password (UI ready, API pending)
- Logout

## File Structure

```
app/
├── agent/                          # Agent panel routes
│   ├── layout.tsx                  # Agent layout with AgentAuthProvider
│   ├── login/page.tsx              # Login page
│   ├── dashboard/page.tsx          # Dashboard
│   ├── shops/
│   │   ├── page.tsx                # My Shops list
│   │   ├── new/
│   │   │   ├── page.tsx            # Add New Shop form
│   │   │   └── success/page.tsx    # Success page
│   │   └── [id]/page.tsx           # Shop details
│   ├── reports/
│   │   └── daily/page.tsx          # Daily report
│   ├── profile/page.tsx            # Profile & settings
│   ├── payments/page.tsx           # Payments (placeholder)
│   └── map/page.tsx                # Map view (placeholder)
│
lib/
├── models/
│   ├── Agent.ts                    # Agent model
│   └── AgentShop.ts                # Shop model for agents
├── utils/
│   └── agentAuth.ts                # JWT utilities
└── mongodb.ts                      # DB connection

app/
├── api/
│   └── agent/
│       ├── auth/login/route.ts     # Login API
│       ├── me/route.ts             # Get current agent
│       ├── dashboard/route.ts      # Dashboard stats
│       ├── shops/
│       │   ├── route.ts            # List/Create shops
│       │   └── [id]/route.ts       # Get/Update shop
│       ├── reports/
│       │   └── daily/route.ts      # Daily report
│       └── upload/route.ts         # Image upload

contexts/
└── AgentAuthContext.tsx            # Agent authentication context

components/
└── AgentRouteGuard.tsx             # Route protection component
```

## Setup Instructions

### 1. Environment Variables
Ensure you have these in `.env.local`:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

### 2. Create Sample Agent
Run the script to create a test agent:
```bash
npx ts-node scripts/create-agent.ts
```

This creates an agent with:
- Email: `rahul@digitalindia.com`
- Phone: `+919876543210`
- Password: `password123`
- Agent Code: `AG001`

### 3. Start Development Server
```bash
npm run dev
```

### 4. Access Agent Panel
- Login: http://localhost:3000/agent/login
- Dashboard: http://localhost:3000/agent/dashboard

## Routes

| Route | Description | Protected |
|-------|-------------|-----------|
| `/agent/login` | Agent login page | No |
| `/agent/dashboard` | Agent dashboard | Yes |
| `/agent/shops` | My shops list | Yes |
| `/agent/shops/new` | Add new shop | Yes |
| `/agent/shops/[id]` | Shop details | Yes |
| `/agent/reports/daily` | Daily report | Yes |
| `/agent/profile` | Profile & settings | Yes |
| `/agent/payments` | Payments (placeholder) | Yes |
| `/agent/map` | Map view (placeholder) | Yes |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agent/auth/login` | Agent login |
| GET | `/api/agent/me` | Get current agent |
| GET | `/api/agent/dashboard` | Dashboard stats |
| GET | `/api/agent/shops` | List shops (with filters) |
| POST | `/api/agent/shops` | Create shop |
| GET | `/api/agent/shops/[id]` | Get shop details |
| PUT | `/api/agent/shops/[id]` | Update shop |
| GET | `/api/agent/reports/daily` | Daily report |
| POST | `/api/agent/upload` | Upload shop photo |

## Payment & Commission Logic

- Default shop registration amount: ₹100
- Commission per paid shop: ₹20 (20% of ₹100)
- Payment statuses: `PAID`, `PENDING`
- Payment modes: `CASH`, `UPI`, `NONE`
- Receipt number auto-generated if not provided

## Data Models

### Agent
- name, phone, email
- passwordHash
- agentCode (unique)
- totalShops
- totalEarnings

### AgentShop
- shopName, ownerName, mobile
- category, pincode, address
- photoUrl
- latitude, longitude
- paymentStatus, paymentMode
- receiptNo, amount
- sendSmsReceipt
- agentId (reference to Agent)

## Notes

- All agent routes are protected by `AgentRouteGuard`
- Images are uploaded to `/public/uploads/shops/`
- GPS location captured using browser geolocation API
- Mobile-first responsive design
- Blue & white theme throughout

## Future Enhancements

- [ ] Edit shop functionality
- [ ] Password change API
- [ ] SMS receipt sending
- [ ] Map view with shop markers
- [ ] Payment history page
- [ ] Monthly/Yearly reports
- [ ] Export reports to PDF/Excel


