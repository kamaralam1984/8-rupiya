# Login Error Debugging Guide

## Admin Login करते समय "Internal server error" आ रहा है?

### Step 1: Server Logs Check करें

Terminal में dev server चल रहा हो, वहाँ error देखें:
```bash
npm run dev
```

Login करने की कोशिश करें और terminal में exact error message देखें।

### Step 2: Browser Console Check करें

1. Browser में **F12** दबाएं (DevTools खोलें)
2. **Console** tab पर जाएं
3. Login करने की कोशिश करें
4. Red errors देखें

### Step 3: Network Tab Check करें

1. DevTools में **Network** tab पर जाएं
2. Login करने की कोशिश करें
3. `/api/auth/login` request पर click करें
4. **Response** tab में exact error देखें

### Step 4: Common Issues और Solutions

#### Issue 1: Database Connection Failed
**Error:** `MongoDB Connection Failed` या `MongooseServerSelectionError`

**Solution:**
1. MongoDB Atlas में जाएं
2. **Network Access** → अपना IP address whitelist करें (या `0.0.0.0/0` for testing)
3. `.env.local` में `MONGODB_URI` check करें

#### Issue 2: User Not Found
**Error:** `Invalid email or password`

**Solution:**
1. MongoDB Atlas → `users` collection में user check करें
2. Email correct है या नहीं verify करें
3. User exist करता है या नहीं check करें

#### Issue 3: Password Field Missing
**Error:** `Password field is not available`

**Solution:**
1. MongoDB में user document check करें
2. `password` field exist करता है या नहीं देखें
3. अगर missing है, user को delete करके फिर से signup करें

#### Issue 4: JWT Secret Missing
**Error:** `JWT_SECRET is not defined`

**Solution:**
1. `.env.local` file check करें
2. `JWT_SECRET` set है या नहीं verify करें
3. Server restart करें

### Step 5: Manual Test करें

Postman या curl से test करें:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@99rupeess.com","password":"admin123"}'
```

या Browser Console में:

```javascript
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@99rupeess.com',
    password: 'admin123'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### Step 6: User Verify करें

MongoDB Atlas में:
1. `users` collection खोलें
2. Admin user ढूंढें
3. Verify करें:
   - `email` field exists और correct है
   - `password` field exists और hash है (plain text नहीं)
   - `role` field `"admin"` है
   - `phone` field exists है

### Step 7: Fresh Admin User बनाएं

अगर कुछ भी काम नहीं कर रहा:

1. **Signup करें:**
   ```
   POST /api/auth/signup
   {
     "name": "Admin User",
     "email": "admin@99rupeess.com",
     "password": "admin123",
     "phone": "+919999999999"
   }
   ```

2. **MongoDB में role update करें:**
   - `users` collection → अपना user ढूंढें
   - `role: "user"` → `role: "admin"` change करें

3. **Login करें**

### Step 8: Server Restart करें

कभी-कभी server restart से issue fix हो जाता है:

```bash
# Terminal में Ctrl+C दबाएं (server stop करें)
npm run dev  # फिर से start करें
```

## अगर अभी भी Error आ रहा है:

1. **Exact error message** copy करें (terminal या browser console से)
2. **Network request** का response copy करें
3. **User document** का screenshot लें (MongoDB Atlas से)

इस information के साथ issue को better debug किया जा सकता है।








