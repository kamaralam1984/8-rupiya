import crypto from 'crypto';

/**
 * PhonePe Payment Gateway Integration Utilities
 * 
 * PhonePe uses SHA256 HMAC for signature generation
 * Base64 encoding for request payload
 */

interface PhonePeConfig {
  merchantId: string;
  saltKey: string;
  saltIndex: number;
  apiEndpoint: string;
}

/**
 * Get PhonePe configuration from environment variables
 */
export function getPhonePeConfig(): PhonePeConfig {
  const merchantId = process.env.PHONEPE_MERCHANT_ID;
  const saltKey = process.env.PHONEPE_SALT_KEY;
  const saltIndex = parseInt(process.env.PHONEPE_SALT_INDEX || '1');
  const apiEndpoint = process.env.PHONEPE_API_ENDPOINT || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://api.phonepe.com/apis/hermes' 
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox');

  if (!merchantId || !saltKey) {
    throw new Error('PhonePe credentials not configured. Please set PHONEPE_MERCHANT_ID, PHONEPE_SALT_KEY, and PHONEPE_SALT_INDEX in environment variables.');
  }

  return {
    merchantId,
    saltKey,
    saltIndex,
    apiEndpoint,
  };
}

/**
 * Generate X-VERIFY header for PhonePe API requests
 */
export function generatePhonePeSignature(payload: string, saltKey: string, saltIndex: number): string {
  const signatureString = payload + `/pg/v1/pay` + saltKey;
  const hash = crypto.createHash('sha256').update(signatureString).digest('hex');
  return `${hash}###${saltIndex}`;
}

/**
 * Verify PhonePe callback signature
 */
export function verifyPhonePeSignature(
  payload: string,
  signature: string,
  saltKey: string,
  saltIndex: number
): boolean {
  try {
    const signatureString = payload + `/pg/v1/status/` + saltKey;
    const hash = crypto.createHash('sha256').update(signatureString).digest('hex');
    const expectedSignature = `${hash}###${saltIndex}`;
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('PhonePe signature verification error:', error);
    return false;
  }
}

/**
 * Create PhonePe payment request payload
 */
export interface PhonePePaymentRequest {
  merchantId: string;
  merchantTransactionId: string;
  amount: number; // Amount in paise
  merchantUserId: string;
  redirectUrl: string;
  redirectMode: 'POST' | 'REDIRECT';
  callbackUrl: string;
  mobileNumber?: string;
  paymentInstrument?: {
    type: 'PAY_PAGE';
  };
}

/**
 * Create PhonePe payment order
 */
export async function createPhonePeOrder(params: {
  merchantTransactionId: string;
  amount: number; // Amount in rupees
  merchantUserId: string;
  mobileNumber?: string;
  redirectUrl: string;
  callbackUrl: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const config = getPhonePeConfig();
    
    // Convert rupees to paise
    const amountInPaise = Math.round(params.amount * 100);

    const payload: PhonePePaymentRequest = {
      merchantId: config.merchantId,
      merchantTransactionId: params.merchantTransactionId,
      amount: amountInPaise,
      merchantUserId: params.merchantUserId,
      redirectUrl: params.redirectUrl,
      redirectMode: 'REDIRECT',
      callbackUrl: params.callbackUrl,
      mobileNumber: params.mobileNumber,
      paymentInstrument: {
        type: 'PAY_PAGE',
      },
    };

    // Base64 encode payload
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    
    // Generate signature
    const xVerify = generatePhonePeSignature(base64Payload, config.saltKey, config.saltIndex);

    // Make API request
    const response = await fetch(`${config.apiEndpoint}/pg/v1/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-VERIFY': xVerify,
      },
      body: JSON.stringify({
        request: base64Payload,
      }),
    });

    const responseData = await response.json();

    if (!response.ok || responseData.success === false) {
      return {
        success: false,
        error: responseData.message || 'Failed to create PhonePe order',
      };
    }

    return {
      success: true,
      data: responseData,
    };
  } catch (error: any) {
    console.error('PhonePe order creation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create PhonePe order',
    };
  }
}

/**
 * Check PhonePe payment status
 */
export async function checkPhonePeStatus(merchantTransactionId: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const config = getPhonePeConfig();
    const path = `/pg/v1/status/${config.merchantId}/${merchantTransactionId}`;
    
    // Generate signature for status check
    const signatureString = path + config.saltKey;
    const hash = crypto.createHash('sha256').update(signatureString).digest('hex');
    const xVerify = `${hash}###${config.saltIndex}`;

    const response = await fetch(`${config.apiEndpoint}${path}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-VERIFY': xVerify,
        'X-MERCHANT-ID': config.merchantId,
      },
    });

    const responseData = await response.json();

    if (!response.ok || responseData.success === false) {
      return {
        success: false,
        error: responseData.message || 'Failed to check PhonePe payment status',
      };
    }

    return {
      success: true,
      data: responseData,
    };
  } catch (error: any) {
    console.error('PhonePe status check error:', error);
    return {
      success: false,
      error: error.message || 'Failed to check PhonePe payment status',
    };
  }
}


