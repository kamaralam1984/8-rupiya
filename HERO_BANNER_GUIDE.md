# Hero Banner Create Karne Ka Complete Guide (हिंदी में)

## Step 1: Admin Panel Mein Login Karein
1. Website par login karein
2. Admin panel mein jayein: `/admin`
3. Dashboard par "Manage Hero Banners" button par click karein
   - Ya directly `/admin/hero-banners` par jayein

## Step 2: New Hero Banner Create Karein
1. Top right corner par **"Add Hero Banner"** button par click karein
2. Ek modal/form khulega

## Step 3: Image Upload/Add Karein
### Option A: Computer Se Image Upload
1. "Choose image from your computer" section mein click karein
2. Apni computer se image select karein
3. Image automatically upload ho jayegi
4. Upload complete hone ke baad image preview dikhega

### Option B: Manual URL Enter Karein
1. "Or enter image URL manually" field mein image URL paste karein
   - Example: `/Assets/banner.jpg`
   - Ya: `/uploads/hero-banner.png`

**Required Fields:**
- ✅ **Banner Image** - Zaroori hai
- ✅ **Alt Text** - Image ka description (zaroori hai)

## Step 4: Basic Information Fill Karein
- **Title** (Optional): Banner ka title
- **Link URL**: Jab user banner par click karega to kahan jayega
  - Example: `/category/restaurants`
  - Ya: `https://example.com`

## Step 5: Page Selection (कौन से पेज पर दिखाना है)
### Option A: Specific Page URL
- **Page URL** field mein page ka URL enter karein:
  - `/` - Homepage ke liye
  - `/category/restaurants` - Specific category page
  - `/about` - About page
  - `/contact` - Contact page
  - Koi bhi custom page URL

### Option B: Dropdown Se Select
- "Or Select from Pages" dropdown se page select karein
- Available pages list mein se choose karein

### Option C: Category Based
- **Category** field mein category name enter karein
  - Example: `restaurants`, `hotels`, `shopping`

**Note:** Agar kuch bhi nahi fill karein to banner sabhi pages par dikhega

## Step 6: Effects & Animations Select Karein

### Text Effect (टेक्स्ट इफेक्ट) - 20 Options:
1. **None** - Koi effect nahi
2. **Glow** - Text glow karega
3. **Gradient** - Rainbow gradient
4. **Shadow** - 3D shadow effect
5. **Outline** - Text outline
6. **3D** - 3D text effect
7. **Neon** - Neon glow
8. **Rainbow** - Rainbow colors
9. **Metallic** - Metallic look
10. **Glass** - Glass effect
11. **Emboss** - Embossed text
12. **Anaglyph** - 3D anaglyph
13. **Retro** - Retro style
14. **Holographic** - Holographic effect
15. **Fire** - Fire colors
16. **Ice** - Ice colors
17. **Electric** - Electric glow
18. **Gold** - Gold gradient
19. **Silver** - Silver gradient
20. **Chrome** - Chrome effect
21. **Diamond** - Diamond effect

### Animation (एनिमेशन) - 20 Options:
1. **None** - Koi animation nahi
2. **Fade** - Fade in/out
3. **Slide** - Slide animation
4. **Bounce** - Bounce effect
5. **Pulse** - Pulse animation
6. **Shake** - Shake effect
7. **Rotate** - Rotate animation
8. **Scale** - Scale up/down
9. **Wobble** - Wobble effect
10. **Flip** - Flip animation
11. **Zoom** - Zoom in/out
12. **Glow-pulse** - Glow pulse
13. **Wave** - Wave animation
14. **Float** - Float effect
15. **Spin** - Spin animation
16. **Shimmer** - Shimmer effect
17. **Gradient-shift** - Gradient shift
18. **Typewriter** - Typewriter effect
19. **Glitch** - Glitch effect
20. **Morph** - Morph animation
21. **Elastic** - Elastic bounce

### Animation Settings:
- **Animation Duration**: Kitne seconds tak animation chalega (0.5 to 10 seconds)
- **Animation Delay**: Animation start hone mein kitna delay (0 to 5 seconds)

### Background Effect:
1. **None** - Koi background effect nahi
2. **Gradient** - Gradient background
3. **Blur** - Blur effect
4. **Overlay** - Color overlay
5. **Particles** - Particle effect

**Agar Overlay select kiya:**
- **Overlay Color**: Color picker se color choose karein
- **Overlay Opacity**: 0 se 1 tak (0.3 recommended)

## Step 7: Text Overlay Settings (Optional)
Agar banner par text dikhana hai:

1. **Show Title** checkbox tick karein
   - Title automatically banner par dikhega

2. **Show Subtitle** checkbox tick karein
   - **Subtitle** field mein subtitle text enter karein
   - Example: "Best Deals", "Limited Time Offer"

3. **Title Color**: Color picker se title ka color choose karein
4. **Subtitle Color**: Color picker se subtitle ka color choose karein

## Step 8: Display Settings
- **Display Order**: Number enter karein (lower number = pehle dikhega)
  - Example: 0, 1, 2, 3...
  
- **Start Date** (Optional): Banner kab se start hoga
  - Date picker se date select karein

- **End Date** (Optional): Banner kab tak dikhega
  - Date picker se date select karein

- **Active** checkbox: Banner active hai ya nahi
  - ✅ Tick = Banner dikhega
  - ❌ Untick = Banner hide rahega

## Step 9: Save Karein
1. Sab kuch fill karne ke baad **"Create Hero Banner"** button par click karein
2. Success message aayega
3. Banner list mein add ho jayega

## Step 10: Edit Ya Delete Karein
- **Edit**: Table mein "Edit" button par click karein
- **Delete**: Table mein "Delete" button par click karein

## Examples (उदाहरण)

### Example 1: Homepage Hero Banner
- **Image**: `/Assets/homepage-banner.jpg`
- **Alt Text**: "Homepage Hero Banner"
- **Page URL**: `/`
- **Text Effect**: `gold`
- **Animation**: `fade`
- **Show Title**: ✅ Yes
- **Title**: "Welcome to Our Store"
- **Link URL**: `/shop`

### Example 2: Category Specific Banner
- **Image**: `/Assets/restaurant-banner.jpg`
- **Alt Text**: "Restaurant Banner"
- **Page URL**: `/category/restaurants`
- **Category**: `restaurants`
- **Text Effect**: `neon`
- **Animation**: `pulse`
- **Link URL**: `/category/restaurants`

### Example 3: All Pages Banner
- **Image**: `/Assets/promo-banner.jpg`
- **Alt Text**: "Promotional Banner"
- **Page URL**: (empty - sabhi pages par dikhega)
- **Text Effect**: `gradient`
- **Animation**: `slide`
- **Link URL**: `/promotions`

## Tips (सुझाव)
1. ✅ Always alt text add karein (SEO ke liye)
2. ✅ High quality images use karein
3. ✅ Animation duration 2-3 seconds rakhein (best experience)
4. ✅ Page URL properly enter karein (slash `/` se start)
5. ✅ Multiple banners same page par add kar sakte hain (order se control)
6. ✅ Start/End dates use karein seasonal promotions ke liye

## Troubleshooting (समस्या निवारण)
- **Image upload nahi ho rahi?** - Check karein file size 5MB se kam hai
- **Banner dikh nahi raha?** - Check karein "Active" checkbox ticked hai
- **Wrong page par dikh raha hai?** - Page URL check karein
- **Animation nahi chal rahi?** - Browser console check karein

---

**Need Help?** Admin panel mein sabhi fields ke saath labels aur descriptions hain jo aapko guide karenge.

