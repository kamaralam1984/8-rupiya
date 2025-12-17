# Payment Gateway Setup Guide

## Overview

This document describes the payment gateway integration for Razorpay and PhonePe in the 8Rupiya platform. The system allows:
- Shopkeepers to purchase plans online from anywhere
- Agents to collect online payments from shopkeepers
- Secure payment processing with webhook verification

## Features

✅ **Razorpay Integration**
- Payment order creation
- Payment verification
- Webhook support
- Multiple payment methods (Cards, UPI, Wallets)

✅ **PhonePe Integration**
- Payment order creation
- Payment verification
- Webhook support
- UPI and Card payments

✅ **Security Features**
- Signature verification
- Amount validation
- Payment status tracking
- Secure token-based authentication

## Environment Variables

Add the following environment variables to your `.env.local` file:

### Razorpay Configuration
```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

### PhonePe Configuration
```env
PHONEPE_MERCHANT_ID=your_merchant_id
PHONEPE_SALT_KEY=your_salt_key
PHONEPE_SALT_INDEX=1
PHONEPE_API_ENDPOINT=https://api-preprod.phonepe.com/apis/pg-sandbox
# For production: https://api.phonepe.com/apis/hermes
```

### Base URL
```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
# For production: https://yourdomain.com
```

## API Endpoints

### 1. Create Payment Order
**POST** `/api/payment/create-order`

Creates a payment order for Razorpay or PhonePe.

**Request Body:**
```json
{
  "shopId": "shop_id",
  "planType": "BASIC",
  "gateway": "RAZORPAY",
  "amount": 100,
  "customerName": "Owner Name",
  "customerEmail": "owner@example.com",
  "customerPhone": "9876543210",
  "agentId": "agent_id" // Optional, for agent-initiated payments
}
```

**Response:**
```json
{
  "success": true,
  "paymentId": "payment_id",
  "orderId": "order_id",
  "amount": 100,
  "currency": "INR",
  "gateway": "RAZORPAY",
  "gatewayResponse": { ... },
  "expiresAt": "2024-01-01T12:00:00Z"
}
```

### 2. Verify Razorpay Payment
**POST** `/api/payment/verify-razorpay`

Verifies Razorpay payment after successful payment.

**Request Body:**
```json
{
  "razorpay_order_id": "order_id",
  "razorpay_payment_id": "payment_id",
  "razorpay_signature": "signature"
}
```

### 3. Payment Status
**GET** `/api/payment/status/[paymentId]`

Get payment status by payment ID.

### 4. Webhooks

#### Razorpay Webhook
**POST** `/api/payment/webhook/razorpay`

Configure this URL in Razorpay dashboard:
- Go to Settings → Webhooks
- Add URL: `https://yourdomain.com/api/payment/webhook/razorpay`
- Select events: `payment.captured`

#### PhonePe Webhook
**POST** `/api/payment/webhook/phonepe`

Configure this URL in PhonePe dashboard:
- Go to Settings → Webhooks
- Add URL: `https://yourdomain.com/api/payment/webhook/phonepe`

## Usage

### For Shopkeepers

1. **Access Payment Page:**
   - Navigate to `/payment/[shopId]`
   - Select plan and payment gateway
   - Click "Pay ₹[amount]"

2. **Complete Payment:**
   - For Razorpay: Payment window opens automatically
   - For PhonePe: Redirects to PhonePe payment page
   - After payment, redirected to success page

### For Agents

1. **Collect Payment from Shopkeeper:**
   - Go to shop details page (`/agent/shops/[id]`)
   - Click "Collect Online Payment" button
   - Select plan and gateway
   - Generate payment link
   - Share link with shopkeeper or complete payment together

2. **View Payment History:**
   - Go to `/agent/payments`
   - View all payments with filters
   - See analytics and commission details

## Payment Flow

### Razorpay Flow:
1. Create payment order → Get order ID
2. Initialize Razorpay checkout
3. User completes payment
4. Payment verified via callback
5. Webhook confirms payment
6. Shop status updated to PAID

### PhonePe Flow:
1. Create payment order → Get redirect URL
2. Redirect user to PhonePe
3. User completes payment
4. Redirect to callback URL
5. Webhook confirms payment
6. Shop status updated to PAID

## Security Measures

1. **Signature Verification:**
   - All payments verified using gateway signatures
   - Prevents tampering and fraud

2. **Amount Validation:**
   - Amount verified against order amount
   - Prevents amount manipulation

3. **Token Authentication:**
   - Agent payments require valid JWT token
   - Shop ownership verified

4. **Payment Status Tracking:**
   - All payments tracked in database
   - Prevents duplicate processing

5. **Webhook Security:**
   - Webhook signatures verified
   - Only verified webhooks processed

## Database Models

### Payment Model
- Stores all payment orders
- Tracks payment status
- Links to shop and agent
- Expires after 30 minutes if not paid

### AgentShop Model
- Updated with payment status
- Payment mode set to ONLINE
- Commission calculated and assigned

## Error Handling

Common errors and solutions:

1. **"Payment gateway not configured"**
   - Check environment variables
   - Verify credentials are correct

2. **"Invalid signature"**
   - Check webhook secret/key
   - Verify signature generation

3. **"Payment not found"**
   - Check order ID is correct
   - Verify payment exists in database

4. **"Amount mismatch"**
   - Verify amount matches order
   - Check currency conversion

## Testing

### Test Mode (Razorpay):
- Use test API keys
- Test cards: 4111 1111 1111 1111
- Test UPI: success@razorpay

### Test Mode (PhonePe):
- Use sandbox environment
- Test with sandbox credentials
- Verify webhook callbacks

## Support

For issues or questions:
1. Check logs in console
2. Verify environment variables
3. Test with test credentials first
4. Check webhook configuration

## Notes

- Payment orders expire after 30 minutes
- Failed payments can be retried
- Webhooks are processed asynchronously
- All payments are logged for audit


