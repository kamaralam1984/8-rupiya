# Pending Shops Implementation

## Overview

Pending shops feature implement किया गया है जिसमें:
- Pending shops अलग section में दिखते हैं
- Regular shops में केवल PAID shops दिखते हैं
- "Pay Amount" button से payment mark करने पर shop move होता है
- Agent commission automatically add होता है
- Revenue automatically update होता है

## Features Implemented

### 1. Payment Status Field

**File: `lib/models/Shop.ts`**
- `paymentStatus` field add किया गया
- Values: `'PAID'` या `'PENDING'`
- Default: `'PENDING'`
- Index add किया गया filtering के लिए

### 2. Shop Creation

**File: `app/api/admin/shops/route.ts`**
- नए shops automatically `paymentStatus: 'PENDING'` के साथ create होते हैं
- Payment के बिना shops pending में save होते हैं

### 3. Regular Shops Filtering

**File: `app/api/admin/shops/route.ts` (GET endpoint)**
- Regular shops list में केवल `PAID` shops दिखते हैं
- `PENDING` shops exclude होते हैं
- Old shops (जिनमें paymentStatus नहीं है) भी दिखते हैं (backward compatibility)

### 4. Pending Shops API

**File: `app/api/admin/shops/pending/route.ts`**
- New endpoint: `GET /api/admin/shops/pending`
- केवल `PENDING` shops return करता है
- Admin/Editor access required

### 5. Pending Shops Page

**File: `app/(admin)/admin/shops/pending/page.tsx`**
- Complete pending shops management page
- Shop cards with image, details, and amount
- "Pay Amount" button for each shop
- Real-time updates after payment

### 6. Payment Processing

**File: `app/api/admin/shops/[id]/mark-payment-done/route.ts`**
- Payment mark करने पर:
  - Shop का `paymentStatus` `PAID` हो जाता है
  - Agent commission automatically add होता है
  - Revenue record update/create होता है
  - Shop regular shops में move हो जाता है

### 7. Revenue Update

**File: `app/api/admin/shops/[id]/mark-payment-done/route.ts`**
- Payment date और district के based revenue update
- Plan type के according revenue breakdown
- Agent commission calculate और subtract
- Net revenue calculate

### 8. Sidebar Navigation

**File: `app/(admin)/admin/layout.tsx`**
- "Pending Shops" menu item add किया गया
- Orange color scheme
- Admin और Editor को access

## User Flow

### 1. Shop Creation
```
User creates shop → paymentStatus: 'PENDING' → Shop saved in database
```

### 2. Viewing Pending Shops
```
Admin → Pending Shops menu → See all pending shops → View shop details
```

### 3. Payment Processing
```
Admin clicks "Pay Amount" → Payment marked as done → 
  - Shop status: PENDING → PAID
  - Agent commission added
  - Revenue updated
  - Shop moved to regular shops
  - Notification sent
```

## API Endpoints

### GET /api/admin/shops/pending
Get all pending shops

**Response:**
```json
{
  "success": true,
  "shops": [...],
  "count": 5
}
```

### POST /api/admin/shops/[id]/mark-payment-done
Mark payment as done for a shop

**Request Body:**
```json
{
  "paymentMode": "CASH",
  "amount": 100,
  "planType": "BASIC",
  "district": "PATNA",
  "mobile": "+919876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment marked as done and notification sent",
  "shop": {...}
}
```

## Database Changes

### Shop Model
- Added `paymentStatus: 'PAID' | 'PENDING'` field
- Default: `'PENDING'`
- Index: `{ paymentStatus: 1 }`

## Files Modified/Created

### Created:
1. ✅ `app/api/admin/shops/pending/route.ts` - Pending shops API
2. ✅ `app/(admin)/admin/shops/pending/page.tsx` - Pending shops page

### Modified:
1. ✅ `lib/models/Shop.ts` - Added paymentStatus field
2. ✅ `app/api/admin/shops/route.ts` - Filter PENDING shops, set default status
3. ✅ `app/api/admin/shops/[id]/mark-payment-done/route.ts` - Update status, revenue
4. ✅ `app/(admin)/admin/layout.tsx` - Added menu item

## Testing

### Test Cases:

1. **Create Shop:**
   - ✅ Shop create करें
   - ✅ Check करें कि paymentStatus = 'PENDING'

2. **View Pending Shops:**
   - ✅ `/admin/shops/pending` पर जाएं
   - ✅ Pending shops list दिखनी चाहिए

3. **Regular Shops:**
   - ✅ `/admin/shops` पर जाएं
   - ✅ Pending shops नहीं दिखने चाहिए

4. **Payment Processing:**
   - ✅ "Pay Amount" button click करें
   - ✅ Shop status PAID हो जाना चाहिए
   - ✅ Shop regular shops में move हो जाना चाहिए
   - ✅ Agent commission add होना चाहिए
   - ✅ Revenue update होना चाहिए

## Benefits

✅ **Better Organization:**
- Pending और paid shops अलग-अलग
- Easy to track pending payments

✅ **Automatic Updates:**
- Agent commission automatically add
- Revenue automatically update
- No manual intervention needed

✅ **User Experience:**
- Clear payment status
- Easy payment processing
- Real-time updates

## Notes

⚠️ **Important:**
- Old shops (जिनमें paymentStatus नहीं है) regular shops में दिखेंगे
- Payment mark करने के बाद shop automatically regular shops में move हो जाता है
- Revenue update district और date based होता है

✅ **Future Improvements:**
- Payment history tracking
- Bulk payment processing
- Payment reminders
- Payment analytics












