# Cloudinary Setup Guide

## Issue: "Failed to upload image to Cloudinary"

If you're seeing this error, follow these steps to fix it:

### Step 1: Verify Cloudinary Account

1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Sign in or create a free account
3. Once logged in, you'll see your account details

### Step 2: Get Your Cloudinary Credentials

From your Cloudinary Dashboard:

1. **Cloud Name**: Found at the top of your dashboard
   - Example: `demo` or `your-username`

2. **API Key**: Click on "API Keys" section
   - Copy the "API Key" value

3. **API Secret**: In the same "API Keys" section
   - Click "Reveal" next to "API Secret"
   - Copy the secret value

### Step 3: Update `.env.local` File

Open your `.env.local` file in the project root and add/update these variables:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Important:**
- Replace `your_cloud_name_here`, `your_api_key_here`, and `your_api_secret_here` with your actual values
- Don't add quotes around the values
- No spaces around the `=` sign
- Make sure there are no extra spaces or characters

### Step 4: Restart Development Server

After updating `.env.local`:

1. Stop your development server (Ctrl+C)
2. Start it again: `npm run dev`

**Note:** Environment variables are loaded when the server starts. You must restart for changes to take effect.

### Step 5: Verify Configuration

Check your server console for:
- ✅ No errors about missing Cloudinary credentials
- ✅ Successful image uploads

### Common Issues

#### Issue 1: "Cloudinary credentials are missing"
**Solution:** Make sure all three environment variables are set in `.env.local`:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

#### Issue 2: "Invalid API Key"
**Solution:** 
- Double-check you copied the correct API Key and Secret
- Make sure there are no extra spaces or characters
- Try regenerating API keys from Cloudinary dashboard

#### Issue 3: "Cloud name not found"
**Solution:**
- Verify your Cloud Name is correct (case-sensitive)
- Check Cloudinary dashboard for the exact cloud name

### Example `.env.local` File

```env
# MongoDB
MONGODB_URI=your_mongodb_uri

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=demo
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Optional: Google Maps API (for better reverse geocoding)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Need Help?

1. Check server console logs for detailed error messages
2. Verify your Cloudinary account is active
3. Ensure you haven't exceeded Cloudinary's free tier limits
4. Check that `.env.local` file is in the project root directory


