# kamaralamjdu@gmail.com को Admin बनाने के लिए

## Method 1: MongoDB Atlas Web Interface (सबसे आसान) ⭐

1. **MongoDB Atlas** में जाएं: https://cloud.mongodb.com
2. **Browse Collections** पर क्लिक करें
3. Database: `99-rupeess` select करें
4. Collection: `users` select करें
5. Email `kamaralamjdu@gmail.com` से user ढूंढें
6. **Edit Document** पर क्लिक करें
7. `role` field को `"user"` से `"admin"` में change करें
8. **Update** करें

✅ **Done!** अब user को logout करके फिर से login करना होगा।

---

## Method 2: MongoDB Shell (mongosh) Command

MongoDB Atlas में **mongosh** connect करें और यह command run करें:

```javascript
use 99-rupeess

db.users.updateOne(
  { email: "kamaralamjdu@gmail.com" },
  { $set: { role: "admin" } }
)
```

Verify करने के लिए:
```javascript
db.users.findOne({ email: "kamaralamjdu@gmail.com" })
```

आपको `"role": "admin"` दिखना चाहिए।

---

## Method 3: अगर User नहीं मिल रहा है

अगर `kamaralamjdu@gmail.com` से user नहीं मिल रहा, तो:

### Option A: Signup करें
1. Browser में `http://localhost:3001/signup` पर जाएं
2. Email: `kamaralamjdu@gmail.com` से signup करें
3. फिर MongoDB में role update करें (Method 1 देखें)

### Option B: MongoDB में Direct Create करें

MongoDB Atlas → `users` collection → **Insert Document**:

```json
{
  "name": "Admin User",
  "email": "kamaralamjdu@gmail.com",
  "password": "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
  "phone": "+919999999999",
  "role": "admin",
  "isEmailVerified": true,
  "createdAt": "2024-12-06T00:00:00.000Z",
  "updatedAt": "2024-12-06T00:00:00.000Z"
}
```

**Password:** `admin123` (hash already included)

---

## Login करने के बाद

1. **Logout करें** (अगर logged in हैं)
2. **Login करें** `kamaralamjdu@gmail.com` से
3. **Admin panel** access: `http://localhost:3001/admin`

---

## Verify करें

1. MongoDB में user document check करें:
   - `role: "admin"` होना चाहिए
2. Browser में login करें
3. `/admin` URL पर जाएं - access मिलना चाहिए

---

## Troubleshooting

### Role update नहीं हो रहा?
- MongoDB में double-check करें कि `role: "admin"` है
- Logout करके फिर से login करें
- Browser localStorage clear करें (F12 → Application → Local Storage → Clear)

### Login नहीं हो रहा?
- Password verify करें
- MongoDB में user exist करता है या नहीं check करें
- Browser console में errors check करें (F12)

### Admin panel access नहीं मिल रहा?
- User role `"admin"` है या नहीं verify करें
- JWT token refresh करने के लिए logout/login करें
- Browser localStorage में `user` object check करें - `role: "admin"` होना चाहिए








