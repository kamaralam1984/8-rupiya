# Admin Users List - Full Control IDs

## Current Status

**Database में अभी कोई admin user नहीं है.**

## Admin Full Control कौन-कौन से IDs को मिला है?

Admin full control पाने के लिए user का `role` field database में `"admin"` होना चाहिए।

### Scripts में Mentioned Emails:

1. **`admin@99rupeess.com`** - `create-admin.ts` script में default admin email
2. **`kamaralamjdu@gmail.com`** - `set-admin-role.ts` script में mentioned email

लेकिन database में अभी इन users का admin role set नहीं है।

## Admin Users की List कैसे देखें?

### Method 1: Script Run करें (Recommended)

```bash
npm run list-admins
```

यह script सभी admin users की complete list दिखाएगी:
- User ID (_id)
- Name
- Email
- Phone
- Role
- Created Date

### Method 2: MongoDB में Direct Check करें

MongoDB Compass या MongoDB Shell में:

```javascript
// MongoDB Shell में
use your-database-name
db.users.find({ role: "admin" })
```

## Admin Role कैसे Set करें?

### Method 1: Script Use करें

```bash
# Specific email को admin बनाने के लिए
npm run set-admin

# या नया admin user create करने के लिए
npm run create-admin
```

### Method 2: MongoDB में Direct Update

```javascript
// Specific email को admin बनाएं
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)

// Multiple users को admin बनाएं
db.users.updateMany(
  { email: { $in: ["email1@example.com", "email2@example.com"] } },
  { $set: { role: "admin" } }
)
```

### Method 3: MongoDB Atlas Web Interface

1. MongoDB Atlas में login करें
2. Browse Collections → users collection खोलें
3. User document find करें
4. `role` field को `"admin"` में change करें
5. Update करें

## Admin Full Control क्या है?

Admin role वाले users को ये permissions मिलते हैं:

### ✅ Admin के पास Full Access:
- सभी pages access
- सभी data edit/delete
- User management (sirf admin)
- System settings
- Database operations (sirf admin)
- सभी operations

### 📋 Admin-Only Pages:
- `/admin/users` - User management (sirf admin)
- `/admin/database` - Database operations (sirf admin)

### 📋 Admin + Editor Pages:
- `/admin/homepage` - Homepage management
- `/admin/banners` - Banner management
- `/admin/categories` - Category management
- `/admin/locations` - Location management
- `/admin/pages` - Page management
- `/admin/agents` - Agent management

### 📋 Admin + Editor + Operator Pages:
- `/admin` - Dashboard
- `/admin/businesses` - Business management
- `/admin/shops` - Shop management
- `/admin/revenue` - Revenue reports

## Important Notes

⚠️ **Security Warning:**
- Admin users को full system access मिलता है
- केवल trusted users को admin role दें
- Production में admin panel को properly secure करें

⚠️ **After Setting Admin Role:**
- User को logout और login करना होगा
- JWT token refresh होगा
- नया role apply होगा

## Quick Commands

```bash
# Admin users की list देखें
npm run list-admins

# Admin user create करें
npm run create-admin

# Existing user को admin बनाएं
npm run set-admin
```

## Troubleshooting

### Script नहीं चल रहा?
- `.env.local` file check करें
- `MONGODB_URI` properly set है या नहीं verify करें

### Admin role set है लेकिन access नहीं मिल रहा?
- User को logout/login करें
- Browser localStorage clear करें
- JWT token refresh होगा

### Multiple Admin Users?
- Database में check करें: `db.users.find({ role: "admin" })`
- Script run करें: `npm run list-admins`



