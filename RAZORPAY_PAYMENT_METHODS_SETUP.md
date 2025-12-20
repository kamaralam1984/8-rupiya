# Razorpay Payment Methods Setup Guide

## Problem
Multiple payment options (UPI, Debit Card, Credit Card, Net Banking) not working in payment links.

## Solution

### 1. Check Razorpay Dashboard Settings

**Important:** Payment methods availability is controlled by your Razorpay account settings, not just the API code.

#### Steps to Enable All Payment Methods:

1. **Login to Razorpay Dashboard**
   - Go to https://dashboard.razorpay.com
   - Login with your account credentials

2. **Navigate to Settings**
   - Click on **Settings** in the left sidebar
   - Select **Payment Methods**

3. **Enable All Payment Methods**
   - ✅ **Cards** - Enable Credit/Debit Cards
   - ✅ **UPI** - Enable UPI payments
   - ✅ **Net Banking** - Enable Net Banking
   - ✅ **Wallets** - Enable Wallets (Paytm, PhonePe, etc.)
   - ✅ **EMI** - Enable EMI (optional)
   - ✅ **Pay Later** - Enable Pay Later (optional)

4. **Save Settings**
   - Click **Save** to apply changes

### 2. Code Configuration

The code has been updated to explicitly enable all payment methods in the payment link creation:

```typescript
options: {
  checkout: {
    method: {
      netbanking: 1,      // Enable Net Banking
      card: 1,            // Enable Credit/Debit Cards
      upi: 1,             // Enable UPI
      wallet: 1,          // Enable Wallets
      emi: 0,             // Disable EMI (optional)
      paylater: 0,        // Disable Pay Later (optional)
    },
  },
}
```

### 3. Verify Payment Link

After creating a payment link, verify that all payment methods are available:

1. Open the payment link in a browser
2. Check if all payment options are visible:
   - 💳 Cards (Credit/Debit)
   - 📱 UPI
   - 🏦 Net Banking
   - 💰 Wallets

### 4. Test Payment Methods

#### Test Cards:
- **Success:** 4111 1111 1111 1111
- **Failure:** 4000 0000 0000 0002
- **CVV:** Any 3 digits
- **Expiry:** Any future date

#### Test UPI:
- **Success:** success@razorpay
- **Failure:** failure@razorpay

#### Test Net Banking:
- Use any test bank from the list

### 5. Common Issues

#### Issue: Payment methods not showing
**Solution:**
- Check Razorpay dashboard settings
- Verify account is activated
- Check if account has restrictions

#### Issue: Only UPI showing
**Solution:**
- Enable Cards and Net Banking in dashboard
- Check account activation status
- Verify KYC completion

#### Issue: Payment link not working
**Solution:**
- Check Razorpay credentials in `.env.local`
- Verify webhook URL is configured
- Check network connectivity

### 6. Environment Variables

Ensure these are set in `.env.local`:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### 7. Production vs Test Mode

- **Test Mode:** Use test credentials (starts with `rzp_test_`)
- **Production Mode:** Use live credentials (starts with `rzp_live_`)

**Note:** Payment methods availability may differ between test and production modes.

### 8. Contact Razorpay Support

If payment methods are still not working after:
1. ✅ Enabling in dashboard
2. ✅ Updating code
3. ✅ Checking credentials

Contact Razorpay support:
- Email: support@razorpay.com
- Dashboard: Settings → Support

### 9. Alternative: Use Razorpay Checkout

If Payment Links don't support all methods, consider using Razorpay Checkout instead:

```typescript
// Checkout provides better control over payment methods
const options = {
  key: RAZORPAY_KEY_ID,
  amount: amountInPaise,
  currency: 'INR',
  name: 'Your Company',
  description: 'Payment Description',
  order_id: orderId,
  handler: function (response) {
    // Handle success
  },
  prefill: {
    name: customerName,
    email: customerEmail,
    contact: customerPhone,
  },
  notes: {
    // Additional notes
  },
  theme: {
    color: '#3399cc',
  },
  method: {
    netbanking: true,
    card: true,
    upi: true,
    wallet: true,
  },
};

const razorpay = new Razorpay(options);
razorpay.open();
```

## Summary

1. ✅ **Code Updated** - Payment methods explicitly enabled
2. ⚠️ **Dashboard Check Required** - Enable methods in Razorpay dashboard
3. ✅ **Test** - Verify all methods are working
4. 📞 **Support** - Contact Razorpay if issues persist

## Quick Checklist

- [ ] Razorpay dashboard → Settings → Payment Methods → All enabled
- [ ] Code updated with payment method options
- [ ] Environment variables configured
- [ ] Test payment link created
- [ ] All payment methods visible in test
- [ ] Test payments successful with different methods



