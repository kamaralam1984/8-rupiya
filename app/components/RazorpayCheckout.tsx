'use client';

import { useState, useEffect } from 'react';
import { PRICING_PLANS, PlanType } from '@/app/utils/pricing';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayCheckoutProps {
  shopId?: string;
  shopName: string;
  ownerName: string;
  mobile: string;
  email?: string;
  agentId?: string;
  shopperId?: string;
  planType: PlanType;
  amount: number;
  onPaymentSuccess?: () => void;
  onPaymentFailure?: () => void;
}

export default function RazorpayCheckout({
  shopId,
  shopName,
  ownerName,
  mobile,
  email,
  agentId,
  shopperId,
  planType,
  amount,
  onPaymentSuccess,
  onPaymentFailure,
}: RazorpayCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'creating' | 'processing' | 'success' | 'failed'>('idle');

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
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  const handlePayment = async () => {
    if (!shopName || !ownerName || !mobile) {
      toast.error('Please fill in shop details first');
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
      const createOrderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          shopId,
          planType,
          amount,
          customerName: ownerName,
          customerEmail: email,
          customerPhone: mobile,
          agentId,
          shopperId,
          gateway: 'RAZORPAY',
        }),
      });

      const orderData = await createOrderResponse.json();

      if (!createOrderResponse.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
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
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
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
            
            if (onPaymentSuccess) {
              onPaymentSuccess();
            }

            // Refresh page after 2 seconds to show updated subscription
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } catch (error: any) {
            console.error('Payment verification error:', error);
            setStatus('failed');
            toast.error(error.message || 'Payment verification failed');
            
            if (onPaymentFailure) {
              onPaymentFailure();
            }
          }
        },
        modal: {
          ondismiss: function () {
            setStatus('failed');
            toast.error('Payment cancelled by user');
            if (onPaymentFailure) {
              onPaymentFailure();
            }
          },
        },
      };

      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.open();
    } catch (error: any) {
      console.error('Payment error:', error);
      setStatus('failed');
      toast.error(error.message || 'Failed to initiate payment');
      
      if (onPaymentFailure) {
        onPaymentFailure();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Plan Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-lg font-bold text-gray-900">{PRICING_PLANS[planType].name}</h4>
          <span className="text-2xl font-bold text-blue-600">₹{amount}</span>
        </div>
        <p className="text-sm text-gray-600">Annual Subscription</p>
      </div>

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={loading || status === 'processing' || status === 'success'}
        className={`w-full py-3 rounded-lg font-semibold transition-colors ${
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
        {status === 'idle' && `Pay ₹${amount} via Razorpay`}
      </button>

      {/* Status Messages */}
      {status === 'success' && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-semibold text-center">
            ✅ Payment Successful! Your subscription has been activated.
          </p>
          <p className="text-green-600 text-sm text-center mt-2">
            Redirecting to dashboard...
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

      {/* Payment Methods Info */}
      {status === 'idle' && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600 text-center mb-2">
            Supported Payment Methods:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="text-xs bg-white px-2 py-1 rounded border">💳 Cards</span>
            <span className="text-xs bg-white px-2 py-1 rounded border">📱 UPI</span>
            <span className="text-xs bg-white px-2 py-1 rounded border">🏦 Net Banking</span>
            <span className="text-xs bg-white px-2 py-1 rounded border">💰 Wallets</span>
          </div>
        </div>
      )}
    </div>
  );
}

