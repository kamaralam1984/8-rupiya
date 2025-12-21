'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PRICING_PLANS, PlanType } from '@/app/utils/pricing';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayPaymentProps {
  shopId?: string;
  planType: PlanType | string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  userType?: 'agent' | 'shopper';
  agentId?: string;
  shopperId?: string;
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  buttonText?: string;
  buttonClassName?: string;
}

export default function RazorpayPayment({
  shopId,
  planType,
  customerName,
  customerEmail,
  customerPhone,
  userType = 'agent',
  agentId,
  shopperId,
  onSuccess,
  onError,
  buttonText,
  buttonClassName,
}: RazorpayPaymentProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'creating' | 'processing' | 'success' | 'failed'>('idle');

  // Get plan amount
  const planDetails = PRICING_PLANS[planType as PlanType] || PRICING_PLANS.BASIC;
  const amount = planDetails.amount;

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ Razorpay script loaded');
    };
    script.onerror = () => {
      console.error('❌ Failed to load Razorpay script');
      toast.error('Failed to load payment gateway');
    };
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  const handlePayment = async () => {
    // Validate required fields before making API call
    if (!customerName || !customerPhone) {
      toast.error('Please fill in customer details first');
      return;
    }
    
    if (!planType) {
      toast.error('Please select a plan first');
      return;
    }
    
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setStatus('creating');

    try {
      // Get tokens
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agent_token') : null;
      const shopperToken = typeof window !== 'undefined' ? localStorage.getItem('shopper_token') : null;
      const token = agentToken || shopperToken;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Step 1: Create Razorpay Order
      const createOrderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          shopId,
          planType,
          amount,
          customerName,
          customerEmail: customerEmail || `${customerPhone}@test.com`,
          customerPhone,
          agentId,
          shopperId,
          gateway: 'RAZORPAY',
        }),
      });

      const orderData = await createOrderResponse.json();

      if (!createOrderResponse.ok || !orderData.success) {
        const errorMsg = orderData.error || 'Failed to create payment order';
        // Provide user-friendly message if Razorpay is not configured
        if (errorMsg.includes('not available') || errorMsg.includes('not configured')) {
          throw new Error('Razorpay online payment is not available. Please use UPI QR Code payment option or contact administrator.');
        }
        throw new Error(errorMsg);
      }

      const { gatewayResponse, paymentId } = orderData;

      if (!window.Razorpay) {
        throw new Error('Razorpay script not loaded');
      }

      // Step 2: Open Razorpay Checkout
      setStatus('processing');

      const razorpayOptions = {
        ...gatewayResponse,
        handler: async function (response: any) {
          try {
            setStatus('processing');

            // Step 3: Verify Payment
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment verification failed');
            }

            // Step 4: Payment Success
            setStatus('success');
            toast.success('Payment successful! Subscription activated.');
            
            if (onSuccess) {
              onSuccess(response);
            }
          } catch (error: any) {
            console.error('Payment verification error:', error);
            setStatus('failed');
            toast.error(error.message || 'Payment verification failed');
            
            if (onError) {
              onError(error);
            }
          }
        },
        modal: {
          ondismiss: function () {
            setStatus('failed');
            toast.error('Payment cancelled by user');
            
            // Redirect to agent dashboard if payment is cancelled
            if (userType === 'agent') {
              setTimeout(() => {
                router.push('/agent/dashboard');
              }, 1500); // Wait 1.5 seconds to show the error message
            }
            
            if (onError) {
              onError(new Error('Payment cancelled'));
            }
          },
        },
      };

      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.open();
    } catch (error: any) {
      console.error('Payment error:', error);
      setStatus('failed');
      
      const errorMessage = error.message || 'Failed to initiate payment';
      
      // Show user-friendly error message
      if (errorMessage.includes('not available') || errorMessage.includes('not configured')) {
        toast.error('Razorpay online payment is not available. Please use UPI QR Code payment option below.', {
          duration: 6000,
        });
      } else {
        toast.error(errorMessage, {
          duration: 5000,
        });
      }
      
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={loading || status === 'processing' || status === 'success'}
        className={buttonClassName || `w-full py-3 rounded-lg font-semibold transition-colors ${
          status === 'success'
            ? 'bg-green-600 text-white cursor-not-allowed'
            : status === 'failed'
            ? 'bg-red-600 text-white hover:bg-red-700'
            : loading || status === 'processing'
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {status === 'creating' && 'Creating Order...'}
        {status === 'processing' && 'Processing Payment...'}
        {status === 'success' && '✓ Payment Successful!'}
        {status === 'failed' && 'Retry Payment'}
        {status === 'idle' && (buttonText || `Pay ₹${amount} via Razorpay`)}
      </button>

      {/* Status Messages */}
      {status === 'success' && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-semibold text-center">
            ✅ Payment Successful! Your subscription has been activated.
          </p>
        </div>
      )}

      {status === 'failed' && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold text-center">
            ❌ Payment Failed
          </p>
          <p className="text-red-600 text-sm text-center mt-2">
            Please try again or contact support if the issue persists.
          </p>
        </div>
      )}
    </div>
  );
}
