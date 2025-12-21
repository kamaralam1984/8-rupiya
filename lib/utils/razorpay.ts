import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance
export function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  // Validate credentials - check if they exist and are not placeholders
  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.');
  }
  
  // Check for placeholder values
  if (keyId.includes('your_key') || keySecret.includes('your_secret') || 
      keyId.trim() === '' || keySecret.trim() === '' ||
      !keyId.startsWith('rzp_')) {
    throw new Error('Razorpay online payment is currently not available. Please use UPI QR Code payment option or contact administrator.');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Create a Razorpay order
 */
export async function createRazorpayOrder(params: {
  amount: number; // Amount in rupees
  currency?: string;
  receipt: string;
  notes?: Record<string, any>;
}) {
  const razorpay = getRazorpayInstance();
  
  // Convert rupees to paise (Razorpay uses paise)
  const amountInPaise = Math.round(params.amount * 100);

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: params.currency || 'INR',
    receipt: params.receipt,
    notes: params.notes || {},
  });

  return order;
}

/**
 * Verify Razorpay payment signature
 */
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!keySecret) {
    throw new Error('Razorpay key secret not configured');
  }

  // Create signature string
  const signatureString = `${params.orderId}|${params.paymentId}`;
  
  // Generate expected signature
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(signatureString)
    .digest('hex');

  // Compare signatures securely
  return crypto.timingSafeEqual(
    Buffer.from(params.signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Fetch payment details from Razorpay
 */
export async function getPaymentDetails(paymentId: string) {
  const razorpay = getRazorpayInstance();
  return await razorpay.payments.fetch(paymentId);
}

/**
 * Fetch order details from Razorpay
 */
export async function getOrderDetails(orderId: string) {
  const razorpay = getRazorpayInstance();
  return await razorpay.orders.fetch(orderId);
}

/**
 * Create Razorpay Payment Link with QR code support
 */
export async function createPaymentLink(params: {
  amount: number; // Amount in rupees
  currency?: string;
  description: string;
  customer: {
    name: string;
    email?: string;
    contact: string;
  };
  notes?: Record<string, any>;
  callbackUrl?: string;
  callbackMethod?: 'get' | 'post';
}) {
  const razorpay = getRazorpayInstance();
  
  // Convert rupees to paise (Razorpay uses paise)
  const amountInPaise = Math.round(params.amount * 100);

  const paymentLink = await razorpay.paymentLink.create({
    amount: amountInPaise,
    currency: params.currency || 'INR',
    description: params.description,
    customer: {
      name: params.customer.name,
      email: params.customer.email,
      contact: params.customer.contact,
    },
    notify: {
      sms: false,
      email: false,
    },
    reminder_enable: false,
    notes: params.notes || {},
    callback_url: params.callbackUrl,
    callback_method: params.callbackMethod || 'post',
  });

  return paymentLink;
}

/**
 * Fetch Payment Link details
 */
export async function getPaymentLinkDetails(paymentLinkId: string) {
  const razorpay = getRazorpayInstance();
  return await razorpay.paymentLink.fetch(paymentLinkId);
}

