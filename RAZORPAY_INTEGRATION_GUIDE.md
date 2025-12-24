# Razorpay Payment Integration Guide

Complete step-by-step guide for integrating Razorpay payment gateway in Next.js application.

## 📋 Requirements Checklist

- ✅ Pay Now button in frontend
- ✅ Razorpay checkout opens on button click
- ✅ Backend API route creates Razorpay order
- ✅ Uses RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET from .env
- ✅ Handles both success and failure scenarios
- ✅ Clean, beginner-friendly code
- ✅ Complete working example

## 🛠️ Tech Stack

- **Next.js** (App Router)
- **TypeScript**
- **Razorpay Official SDK**

## 📁 File Structure

```
app/
├── razorpay-example/
│   └── page.tsx              # Frontend component with Pay Now button
└── api/
    └── razorpay/
        ├── create-order/
        │   └── route.ts      # API route to create Razorpay order
        └── verify-payment/
            └── route.ts      # API route to verify payment signature
```

## 🔧 Setup Instructions

### Step 1: Install Razorpay SDK

```bash
npm install razorpay
```

### Step 2: Configure Environment Variables

Create or update `.env.local` file in your project root:

```env
# Razorpay Credentials
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_key_secret_here
```

**Important Notes:**
- Use test credentials for development (starts with `rzp_test_`)
- Use production credentials for production (starts with `rzp_live_`)
- Never commit `.env.local` to version control
- Get credentials from: https://dashboard.razorpay.com/app/keys

### Step 3: Add TypeScript Types (Optional)

Create `types/razorpay.d.ts`:

```typescript
interface Window {
  Razorpay: any;
}
```

## 📝 Code Explanation

### Frontend Code (`app/razorpay-example/page.tsx`)

#### Step 1: Load Razorpay Script
```typescript
const loadRazorpayScript = () => {
  // Dynamically loads Razorpay checkout script
  // Returns Promise<boolean>
}
```

#### Step 2: Handle Pay Now Button
```typescript
const handlePayNow = async () => {
  // 1. Load Razorpay script
  // 2. Create order via API
  // 3. Open Razorpay checkout
}
```

#### Step 3: Payment Success Handler
```typescript
handler: async function (response) {
  // Called when payment is successful
  // Verify payment with backend
}
```

#### Step 4: Payment Failure Handler
```typescript
razorpay.on('payment.failed', function (response) {
  // Called when payment fails
  // Show error message to user
});
```

### Backend API Routes

#### Create Order API (`/api/razorpay/create-order`)

**Purpose:** Creates a Razorpay order and returns order details

**Request:**
```json
{
  "amount": 10000,      // Amount in paise (₹100 = 10000 paise)
  "currency": "INR",
  "receipt": "receipt_123"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "order_xxxxxxxxxxxxx",
  "amount": 10000,
  "currency": "INR",
  "keyId": "rzp_test_xxxxxxxxxxxxx",
  "receipt": "receipt_123"
}
```

#### Verify Payment API (`/api/razorpay/verify-payment`)

**Purpose:** Verifies payment signature to ensure payment is authentic

**Request:**
```json
{
  "razorpay_order_id": "order_xxxxxxxxxxxxx",
  "razorpay_payment_id": "pay_xxxxxxxxxxxxx",
  "razorpay_signature": "signature_xxxxxxxxxxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "orderId": "order_xxxxxxxxxxxxx",
  "paymentId": "pay_xxxxxxxxxxxxx"
}
```

## 🚀 How to Use

1. **Visit the example page:**
   ```
   http://localhost:3000/razorpay-example
   ```

2. **Click "Pay Now" button**

3. **Razorpay checkout popup opens**

4. **Enter test payment details:**
   - Card Number: `4111 1111 1111 1111`
   - CVV: Any 3 digits
   - Expiry: Any future date
   - Name: Any name

5. **Payment is processed and verified**

## 🔍 Payment Flow

```
User clicks "Pay Now"
    ↓
Load Razorpay Script
    ↓
Create Order (API Call)
    ↓
Open Razorpay Checkout
    ↓
User enters payment details
    ↓
Payment Success/Failure
    ↓
Verify Payment (API Call)
    ↓
Show Success/Error Message
```

## ⚠️ Important Notes

### 1. Amount Conversion
- Always send amount in **paise** (smallest currency unit)
- ₹100 = 10000 paise
- ₹1 = 100 paise

### 2. Signature Verification
- **Always verify payment signature** on backend
- Never trust frontend payment data alone
- Signature verification ensures payment is authentic

### 3. Security Best Practices
- Never expose `RAZORPAY_KEY_SECRET` to frontend
- Only send `RAZORPAY_KEY_ID` to frontend (safe to expose)
- Always verify payment on backend before marking as successful

### 4. Test vs Production
- Use test credentials (`rzp_test_*`) for development
- Use production credentials (`rzp_live_*`) for production
- Test cards: https://razorpay.com/docs/payments/payments/test-card-details/

## 🐛 Common Errors & Solutions

### Error 1: "Razorpay is not defined"
**Solution:** Make sure Razorpay script is loaded before using it
```typescript
await loadRazorpayScript();
```

### Error 2: "Invalid key_id"
**Solution:** Check if `RAZORPAY_KEY_ID` is correctly set in `.env.local`

### Error 3: "Signature verification failed"
**Solution:** 
- Ensure `RAZORPAY_KEY_SECRET` is correct
- Check if order_id and payment_id are correct
- Verify signature generation logic

### Error 4: "Order creation failed"
**Solution:**
- Check Razorpay credentials
- Verify amount is in paise
- Check network connectivity

### Error 5: "Payment cancelled"
**Solution:** This is normal when user closes the popup. Handle in `modal.ondismiss` callback.

## 📚 Additional Resources

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Checkout Integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/)
- [Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)
- [Razorpay Dashboard](https://dashboard.razorpay.com/)

## ✅ Testing Checklist

- [ ] Pay Now button opens Razorpay checkout
- [ ] Payment success is handled correctly
- [ ] Payment failure is handled correctly
- [ ] Payment cancellation is handled correctly
- [ ] Payment signature is verified on backend
- [ ] Error messages are user-friendly
- [ ] Loading states are shown during processing

## 🎯 Next Steps

1. Customize payment amount and description
2. Add user details (name, email, phone) dynamically
3. Store payment records in database
4. Send confirmation emails after payment
5. Add payment history page

---

**Note:** This is a complete working example. You can copy the code and customize it according to your needs.

