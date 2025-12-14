# HeroSection Image Sizes Documentation

## 📐 Image Sizes in HeroSection Components

### **1. Hero Banner (Center) - `HeroBanner.tsx`**

**Image Type:** Full-width responsive banner
- **Desktop:** `60vw` (60% of viewport width)
- **Mobile/Tablet:** `100vw` (full viewport width)
- **Height:** 
  - Desktop: `h-[480px]` (480px)
  - Tablet: `h-[293px]` (293px)
  - Mobile: `h-[176px]` to `h-[240px]` (176px - 240px)
- **Image Component:** Next.js `Image` with `fill` prop
- **Aspect Ratio:** Fills container completely
- **Recommended Upload Size:** 
  - Desktop: **1200px × 800px** (3:2 ratio)
  - Mobile: **800px × 600px** (4:3 ratio)

---

### **2. Left Rail (Left Sidebar) - `LeftRail.tsx`**

**Image Type:** Vertical banners (3-4 shops)
- **Default Size:** `100px` (configurable from admin panel)
- **Admin Control:** Settings → Icon Sizes → Left Rail
- **Height Calculation:** 
  - Dynamic based on number of banners
  - Formula: `calc((100% - (bannerCount - 1) * 8px) / bannerCount)`
  - Minimum: `iconSize` px
- **Image Component:** Next.js `Image` with `fill` prop
- **Sizes Attribute:** 
  - Mobile: `22vw`
  - Tablet: `18vw`
  - Desktop: `20vw`
- **Recommended Upload Size:** 
  - **300px × 400px** (3:4 ratio, vertical)
  - Or square: **300px × 300px**

---

### **3. Right Side (Right Sidebar) - `RightSide.tsx`**

**Image Type:** Single large vertical banner
- **Height:** 
  - Desktop: `h-[480px]` (480px)
  - Tablet: `h-[293px]` (293px)
  - Mobile: `h-[176px]` to `h-[240px]` (176px - 240px)
- **Width:** 
  - Desktop: `20vw` (20% of viewport)
  - Tablet: `18vw` (18% of viewport)
  - Mobile: `22vw` (22% of viewport)
- **Image Component:** Next.js `Image` with `fill` prop
- **Sizes Attribute:** 
  - Mobile: `22vw`
  - Tablet: `18vw`
  - Desktop: `20vw`
- **Recommended Upload Size:** 
  - **400px × 600px** (2:3 ratio, vertical)
  - Or square: **400px × 400px**

---

### **4. Bottom Rail (Featured Shops Grid) - `BottomRail.tsx`**

**Image Type:** Grid cards (12 shops)
- **Height:** 
  - Mobile: `h-32` (128px)
  - Small Tablet: `h-40` (160px)
  - Tablet: `h-44` (176px)
  - Desktop: `h-48` (192px)
- **Width:** 
  - Mobile: 3 columns (`33.33%` each)
  - Tablet: 4 columns (`25%` each)
  - Desktop: 6 columns (`16.67%` each)
- **Image Component:** Next.js `Image` with `fill` prop
- **Sizes Attribute:** 
  - Mobile: `50vw`
  - Tablet: `33vw`
  - Desktop: `16vw`
- **Recommended Upload Size:** 
  - **400px × 400px** (1:1 ratio, square)
  - Or landscape: **500px × 300px** (5:3 ratio)

---

### **5. Bottom Strip (Nearby Shops) - `BottomStrip.tsx`**

**Image Type:** Small horizontal cards (30 shops)
- **Default Desktop Size:** `66px` (configurable from admin panel)
- **Default Mobile Size:** `41px` (62% of desktop size)
- **Admin Control:** Settings → Icon Sizes → Bottom Strip
- **Height:** 
  - Desktop: `iconSize.desktop × 0.8` (80% of width)
  - Mobile: `iconSize.mobile × 0.8` (80% of width)
- **Width:** 
  - Desktop: `iconSize.desktop` (default 66px)
  - Mobile: `iconSize.mobile` (default 41px)
- **Image Component:** Next.js `Image` with fixed `width` and `height`
- **Recommended Upload Size:** 
  - **200px × 200px** (1:1 ratio, square)
  - Minimum: **150px × 150px**

---

### **6. Best Deals Slider - `BestDealsSlider.tsx`**

**Image Type:** Full-width slider banner
- **Width:** `100vw` (full viewport width)
- **Height:** Responsive (typically `h-48` to `h-64` on mobile, `h-64` to `h-96` on desktop)
- **Image Component:** Next.js `Image` with `fill` prop
- **Sizes Attribute:** `100vw`
- **Recommended Upload Size:** 
  - **1920px × 600px** (16:5 ratio, wide banner)
  - Or: **1920px × 800px** (12:5 ratio)

---

## 📊 Summary Table

| Component | Desktop Size | Mobile Size | Admin Configurable | Recommended Upload |
|-----------|-------------|-------------|-------------------|-------------------|
| **Hero Banner** | 60vw × 480px | 100vw × 176-240px | ❌ No | 1200×800px |
| **Left Rail** | 20vw × dynamic | 22vw × dynamic | ✅ Yes (iconSize) | 300×400px |
| **Right Side** | 20vw × 480px | 22vw × 176-240px | ❌ No | 400×600px |
| **Bottom Rail** | 16vw × 192px | 50vw × 128px | ❌ No | 400×400px |
| **Bottom Strip** | 66px × 53px | 41px × 33px | ✅ Yes (iconSize) | 200×200px |
| **Best Deals Slider** | 100vw × 384px | 100vw × 256px | ❌ No | 1920×600px |

---

## 🎨 Image Format Recommendations

1. **Format:** JPG or PNG
2. **Quality:** 
   - High quality for Hero Banner and Slider (90-95%)
   - Medium quality for cards (80-85%)
   - Optimized for web (compressed)
3. **File Size:**
   - Hero Banner: < 500KB
   - Slider: < 300KB
   - Cards: < 100KB each
   - Bottom Strip: < 50KB each

---

## ⚙️ Admin Panel Configuration

### **Configurable Sizes:**
1. **Left Rail Icon Size:**
   - Location: Admin → Settings → Icon Sizes → Left Rail
   - Default: `100px`
   - Range: `30px - 500px`

2. **Bottom Strip Icon Size:**
   - Location: Admin → Settings → Icon Sizes → Bottom Strip
   - Default: `66px` (desktop), `41px` (mobile)
   - Range: `30px - 500px`
   - Mobile automatically calculated as 62% of desktop size

### **Non-Configurable Sizes:**
- Hero Banner (responsive based on viewport)
- Right Side (responsive based on viewport)
- Bottom Rail (fixed responsive heights)
- Best Deals Slider (full width)

---

## 📱 Responsive Breakpoints

- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

---

## 🔧 Technical Details

### **Next.js Image Optimization:**
- All images use Next.js `Image` component
- Automatic optimization and lazy loading
- Responsive image serving based on device
- WebP format when supported by browser

### **Image Loading:**
- Hero Banner: `priority` (loads immediately)
- Other images: `lazy` (loads when in viewport)

---

## 💡 Best Practices

1. **Aspect Ratios:**
   - Maintain consistent aspect ratios for each section
   - Use square images for cards (Bottom Rail, Bottom Strip)
   - Use landscape for banners (Hero, Slider)

2. **Image Quality:**
   - Use high-quality source images
   - Let Next.js handle optimization
   - Compress before upload if file size is too large

3. **File Naming:**
   - Use descriptive names: `shop-name-hero.jpg`
   - Include dimensions if needed: `banner-1200x800.jpg`

4. **Testing:**
   - Test images on different screen sizes
   - Check loading performance
   - Verify aspect ratios don't distort

---

**Last Updated:** Based on current codebase analysis
**Version:** 1.0.0

