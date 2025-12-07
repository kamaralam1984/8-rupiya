# Fix: 403 Admin Access Errors

## Problem

After setting admin role in database, you were getting 403 errors:
- `"Admin, Editor, or Operator access required"`
- Failed to fetch stats: "Banners: 403, Locations: 403, Pages: 403"

## Root Cause

JWT token में पुराना role stored था। Database में role update हो गया था, लेकिन token में अभी भी पुराना role (`"user"`) था।

## Solution Implemented

### 1. Token Refresh API Endpoint

नया endpoint बनाया गया: `/api/auth/refresh-token`

यह endpoint:
- Current token verify करता है
- Database से latest user data fetch करता है
- नया token generate करता है updated role के साथ
- Updated user data और नया token return करता है

### 2. Automatic Token Refresh in Admin Dashboard

Admin dashboard (`/admin`) में automatic token refresh mechanism add किया गया:

- जब 403 error आती है, system automatically:
  1. Token refresh API call करता है
  2. नया token और updated user data receive करता है
  3. AuthContext में update करता है
  4. Failed requests को नए token के साथ retry करता है

### 3. Fallback Mechanism

अगर token refresh fail हो जाए:
- User को alert message दिखता है
- Automatic logout होता है
- Login page पर redirect होता है

## How to Use

### Option 1: Automatic (Recommended)

1. Admin role set करें database में
2. Page refresh करें (`/admin`)
3. System automatically token refresh करेगा
4. सब कुछ काम करना शुरू हो जाएगा

### Option 2: Manual Refresh

अगर automatic refresh नहीं हो रहा:

1. Browser console खोलें (F12)
2. निम्न command run करें:

```javascript
fetch('/api/auth/refresh-token', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
})
.then(res => res.json())
.then(data => {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  window.location.reload();
});
```

### Option 3: Logout and Login

सबसे simple solution:

1. Logout करें
2. Login करें same credentials से
3. नया token automatically generate होगा updated role के साथ

## Files Modified

1. **`app/api/auth/refresh-token/route.ts`** (New)
   - Token refresh endpoint

2. **`app/(admin)/admin/page.tsx`**
   - Automatic 403 error detection
   - Token refresh mechanism
   - Retry logic with new token

## Testing

1. ✅ Admin role set करें: `npm run set-admin`
2. ✅ `/admin` page पर जाएं
3. ✅ Console में check करें - token refresh message दिखना चाहिए
4. ✅ Stats properly load होने चाहिए
5. ✅ कोई 403 errors नहीं आनी चाहिए

## Technical Details

### Token Refresh Flow

```
1. User makes request with old token (role: "user")
2. API returns 403 (role mismatch)
3. Frontend detects 403 error
4. Calls /api/auth/refresh-token with old token
5. Backend:
   - Verifies old token
   - Fetches latest user from database
   - Generates new token with updated role
6. Frontend:
   - Updates AuthContext with new token
   - Retries failed requests with new token
7. Success! ✅
```

### Error Handling

- **403 Error Detected**: Automatic token refresh attempt
- **Token Refresh Success**: Retry requests with new token
- **Token Refresh Failed**: Logout and redirect to login

## Notes

⚠️ **Important:**
- Token refresh केवल valid token के साथ काम करता है
- Expired token के लिए user को logout/login करना होगा
- Token refresh के बाद page reload हो सकता है (expected behavior)

✅ **Benefits:**
- No manual logout/login required
- Seamless user experience
- Automatic role updates reflected immediately
- Better error handling

## Troubleshooting

### Still Getting 403 Errors?

1. **Check Database:**
   ```bash
   npm run list-admins
   ```
   Verify your email has `role: "admin"`

2. **Clear Browser Storage:**
   - Open DevTools (F12)
   - Application → Local Storage
   - Clear all items
   - Login again

3. **Check Token:**
   ```javascript
   // In browser console
   const token = localStorage.getItem('token');
   const user = JSON.parse(localStorage.getItem('user') || '{}');
   console.log('Current role:', user.role);
   ```

4. **Manual Token Refresh:**
   - Use Option 2 above to manually refresh token

### Token Refresh Not Working?

1. Check network tab - `/api/auth/refresh-token` request successful है?
2. Check console for errors
3. Verify JWT_SECRET is set in `.env.local`
4. Try logout/login method (Option 3)

## Future Improvements

- Add token refresh to all admin pages automatically
- Add global error handler for 403 errors
- Add token expiration detection
- Add automatic token refresh before expiration

