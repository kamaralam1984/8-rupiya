import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// Plan configurations with amounts in INR
export const PAYMENT_PLANS = {
  BASIC: { amount: 100, name: 'Basic Plan' },
  PREMIUM: { amount: 300, name: 'Premium Plan' },
  FEATURED: { amount: 500, name: 'Featured Plan' },
  LEFT_BAR: { amount: 700, name: 'Left Bar Plan' },
  RIGHT_SIDE: { amount: 700, name: 'Right Side Plan' },
  BOTTOM_RAIL: { amount: 1000, name: 'Bottom Rail Plan' },
  BANNER: { amount: 1200, name: 'Banner Plan' },
  HERO: { amount: 1500, name: 'Hero Plan' },
} as const;

export type PlanType = keyof typeof PAYMENT_PLANS;

/**
 * Convert Rupees to Paise (Razorpay uses smallest currency unit)
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Convert Paise to Rupees
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Get plan details by plan type
 */
export function getPlanDetails(planType: PlanType) {
  return PAYMENT_PLANS[planType];
}

/**
 * Generate Razorpay order
 */
export async function createRazorpayOrder({
  amount,
  currency = 'INR',
  receipt,
  notes = {},
}: {
  amount: number; // Amount in paise
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}) {
  try {
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
      notes,
      payment_capture: true, // Auto capture payment
    });
    return { success: true, order };
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create Razorpay order' 
    };
  }
}

/**
 * Verify Razorpay payment signature
 */
export function verifyPaymentSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  try {
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return generatedSignature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Fetch payment details from Razorpay
 */
export async function fetchPaymentDetails(paymentId: string) {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return { success: true, payment };
  } catch (error: any) {
    console.error('Razorpay payment fetch error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch payment details' 
    };
  }
}

/**
 * Fetch order details from Razorpay
 */
export async function fetchOrderDetails(orderId: string) {
  try {
    const order = await razorpay.orders.fetch(orderId);
    return { success: true, order };
  } catch (error: any) {
    console.error('Razorpay order fetch error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch order details' 
    };
  }
}

/**
 * Generate receipt number
 */
export function generateReceiptNumber(prefix: string = 'RCPT'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}_${timestamp}_${random}`;
}

