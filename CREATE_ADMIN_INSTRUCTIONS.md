# Admin User बनाने के लिए Instructions

## Method 1: MongoDB Atlas में Direct (सबसे आसान)

1. **MongoDB Atlas** में जाएं: https://cloud.mongodb.com
2. **Browse Collections** पर क्लिक करें
3. Database: `99-rupeess` select करें
4. Collection: `users` select करें
5. **Insert Document** पर क्लिक करें
6. यह JSON paste करें:

```json
{
  "name": "Admin User",
  "email": "admin@99rupeess.com",
  "password": "$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq",
  "phone": "+919999999999",
  "role": "admin",
  "isEmailVerified": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**⚠️ Note:** Password hash manually नहीं बनाना है। Signup API use करें (Method 2 देखें)।

## Method 2: Signup API Use करके (Recommended)

### Step 1: Signup करें

Browser में या Postman में यह request करें:

```bash
POST http://localhost:3001/api/auth/signup
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@99rupeess.com",
  "password": "admin123",
  "phone": "+919999999999"
}
```

### Step 2: MongoDB में Role Update करें

1. **MongoDB Atlas** → **Browse Collections** → `users` collection
2. Email `admin@99rupeess.com` से user ढूंढें
3. **Edit Document** पर क्लिक करें
4. `role` field को `"user"` से `"admin"` में change करें
5. **Update** करें

### Step 3: Login करें

```
Email: admin@99rupeess.com
Password: admin123
```

## Method 3: MongoDB Shell (mongosh) से

```javascript
// MongoDB Atlas में mongosh connect करें
use 99-rupeess

// Admin user create करें (password automatically hash होगा)
db.users.insertOne({
  name: "Admin User",
  email: "admin@99rupeess.com",
  password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", // "admin123" का hash
  phone: "+919999999999",
  role: "admin",
  isEmailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**Password Hash:** `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy` = `admin123`

## Method 4: Existing User को Admin बनाएं

अगर आपका account पहले से है:

1. **MongoDB Atlas** → **Browse Collections** → `users`
2. अपना email से user ढूंढें
3. **Edit Document**
4. `role: "user"` को `role: "admin"` में change करें
5. **Update**

फिर logout करके फिर से login करें।

## Default Admin Credentials (अगर script run हो जाए)

```
Email: admin@99rupeess.com
Password: admin123
```

## Troubleshooting

### Login नहीं हो रहा?
1. Browser में **DevTools** (F12) खोलें
2. **Application** → **Local Storage** → सब clear करें
3. फिर से login करें

### Role update नहीं हो रहा?
1. MongoDB में double-check करें कि `role: "admin"` है
2. Logout करके फिर से login करें
3. JWT token refresh होगा

### Password hash manually बनाना है?
```bash
# Node.js में
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(hash => console.log(hash));"
```

## Security Note

⚠️ **Production में:**
- Strong password use करें
- Admin credentials secure रखें
- Regular password change करें












