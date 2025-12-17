# Payment Gateway Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: "Payment gateway not configured" Error

**Symptoms:**
- Error message: "Razorpay credentials not configured"
- Payment order creation fails
- Checkout doesn't open

**Solution:**
1. Check your `.env.local` file has real credentials (not placeholders)
2. Ensure environment variables are set:
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx  # Replace with your actual key
   RAZORPAY_KEY_SECRET=your_actual_secret_key  # Replace with your actual secret
   ```

3. Restart your development server after changing `.env.local`

**To verify configuration:**
```bash
npx ts-node scripts/check-payment-config.ts
```

---

### Issue 2: "Failed to create Razorpay order"

**Symptoms:**
- API returns 500 error
- Console shows "Failed to create Razorpay order"

**Possible Causes:**
1. **Invalid API credentials**
   - Check if your Razorpay key ID and secret are correct
   - Ensure you're using test keys for development
   - Verify keys are active in Razorpay dashboard

2. **Network issues**
   - Check internet connection
   - Verify Razorpay API is accessible

3. **Amount validation**
   - Minimum amount for Razorpay is ₹1 (100 paise)
   - Check if amount is valid

**Solution:**
1. Verify credentials in Razorpay dashboard:
   - Login to https://dashboard.razorpay.com
   - Go to Settings → API Keys
   - Copy Key ID and Key Secret

2. Test with minimal amount:
   ```javascript
   // Test with ₹1
   amount: 1
   ```

---

### Issue 3: Razorpay Checkout Not Opening

**Symptoms:**
- Payment button clicked but nothing happens
- Console shows errors
- "Razorpay SDK not loaded" error

**Possible Causes:**
1. **Script loading failed**
   - Check internet connection
   - Verify Razorpay CDN is accessible
   - Check browser console for errors

2. **Invalid key format**
   - Key ID must start with `rzp_test_` or `rzp_live_`
   - Check key format in environment variables

**Solution:**
1. Check browser console for errors
2. Verify Razorpay script loads:
   ```javascript
   // In browser console
   console.log(window.Razorpay);
   // Should show Razorpay object, not undefined
   ```

3. Test Razorpay script URL:
   - Open: https://checkout.razorpay.com/v1/checkout.js
   - Should load JavaScript file

---

### Issue 4: Payment Verification Fails

**Symptoms:**
- Payment completed but verification fails
- "Invalid payment signature" error
- Payment status stays PENDING

**Possible Causes:**
1. **Webhook secret mismatch**
   - Webhook secret not set correctly
   - Different secret used for verification

2. **Signature verification failed**
   - Payment data tampered
   - Wrong secret used

**Solution:**
1. Set webhook secret in `.env.local`:
   ```env
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   ```

2. Configure webhook in Razorpay dashboard:
   - Go to Settings → Webhooks
   - Add URL: `https://yourdomain.com/api/payment/webhook/razorpay`
   - Select event: `payment.captured`
   - Copy webhook secret

---

### Issue 5: PhonePe Payment Not Working

**Symptoms:**
- PhonePe redirect fails
- "PhonePe credentials not configured" error
- Payment order creation fails

**Solution:**
1. Verify PhonePe credentials:
   ```env
   PHONEPE_MERCHANT_ID=your_merchant_id
   PHONEPE_SALT_KEY=your_salt_key
   PHONEPE_SALT_INDEX=1
   PHONEPE_API_ENDPOINT=https://api-preprod.phonepe.com/apis/pg-sandbox
   ```

2. For production, use:
   ```env
   PHONEPE_API_ENDPOINT=https://api.phonepe.com/apis/hermes
   ```

3. Check PhonePe merchant dashboard for correct credentials

---

### Issue 6: Environment Variables Not Loading

**Symptoms:**
- Configuration check shows "NOT SET"
- Values are undefined in code

**Solution:**
1. Ensure `.env.local` file exists in project root
2. Restart development server after changes
3. For Next.js, environment variables starting with `NEXT_PUBLIC_` are available in browser
4. Server-side variables don't need `NEXT_PUBLIC_` prefix

**File structure:**
```
project-root/
  .env.local          ← Add credentials here
  .env.example       ← Template (optional)
```

---

### Issue 7: Payment Status Not Updating

**Symptoms:**
- Payment completed but shop status still PENDING
- Payment record shows SUCCESS but shop not updated

**Solution:**
1. Check webhook is configured correctly
2. Verify webhook URL is accessible
3. Check server logs for webhook errors
4. Manually verify payment:
   ```bash
   # Check payment status
   GET /api/payment/status/[paymentId]
   ```

---

## Testing Payment Gateway

### Test Razorpay Credentials

1. **Get Test Credentials:**
   - Login to Razorpay Dashboard
   - Go to Settings → API Keys
   - Generate Test Keys (if not already generated)

2. **Test Order Creation:**
   ```bash
   curl -X POST http://localhost:3000/api/payment/create-order \
     -H "Content-Type: application/json" \
     -d '{
       "shopId": "test_shop_id",
       "planType": "BASIC",
       "gateway": "RAZORPAY",
       "customerName": "Test User",
       "customerPhone": "9876543210"
     }'
   ```

3. **Test Payment:**
   - Use Razorpay test cards:
     - Card: 4111 1111 1111 1111
     - CVV: Any 3 digits
     - Expiry: Any future date
     - Name: Any name

### Test PhonePe Credentials

1. **Get Sandbox Credentials:**
   - Login to PhonePe Merchant Dashboard
   - Go to API Credentials
   - Copy Merchant ID, Salt Key, and Salt Index

2. **Test in Sandbox:**
   - Use sandbox endpoint
   - Test with minimal amount
   - Verify redirect works

---

## Debugging Steps

1. **Check Configuration:**
   ```bash
   npx ts-node scripts/check-payment-config.ts
   ```

2. **Check Server Logs:**
   - Look for payment-related errors
   - Check API response codes
   - Verify database connections

3. **Check Browser Console:**
   - Look for JavaScript errors
   - Check network requests
   - Verify API responses

4. **Test API Endpoints:**
   ```bash
   # Test order creation
   POST /api/payment/create-order

   # Test payment status
   GET /api/payment/status/[paymentId]

   # Test verification
   POST /api/payment/verify-razorpay
   ```

---

## Quick Fix Checklist

- [ ] Environment variables set in `.env.local`
- [ ] Real credentials (not placeholders)
- [ ] Development server restarted
- [ ] Razorpay/PhonePe dashboard credentials verified
- [ ] Webhook configured (for production)
- [ ] Base URL set correctly
- [ ] Browser console checked for errors
- [ ] Network requests successful

---

## Getting Help

If issues persist:
1. Check server logs for detailed error messages
2. Verify credentials in payment gateway dashboard
3. Test with minimal amount first
4. Check payment gateway status page
5. Contact payment gateway support if needed

---

## Important Notes

- **Never commit `.env.local` to git** (it's in `.gitignore`)
- **Use test credentials for development**
- **Switch to live credentials only in production**
- **Keep credentials secure and never share publicly**


