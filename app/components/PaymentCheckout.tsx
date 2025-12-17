'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentCheckoutProps {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  gateway: 'RAZORPAY' | 'PHONEPE';
  gatewayResponse: any;
  shopName: string;
  planName: string;
  onSuccess?: () => void;
  onFailure?: (error: string) => void;
}

export default function PaymentCheckout({
  paymentId,
  orderId,
  amount,
  currency,
  gateway,
  gatewayResponse,
  shopName,
  planName,
  onSuccess,
  onFailure,
}: PaymentCheckoutProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');

  useEffect(() => {
    if (gateway === 'RAZORPAY') {
      // Check if Razorpay key is valid
      if (!gatewayResponse?.key || gatewayResponse.key.includes('your_key')) {
        toast.error('Razorpay credentials not configured');
        setPaymentStatus('failed');
        onFailure?.('Payment gateway not configured. Please contact support.');
        return;
      }

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        initializeRazorpay();
      };
      script.onerror = () => {
        toast.error('Failed to load Razorpay checkout');
        setPaymentStatus('failed');
        onFailure?.('Failed to load payment gateway');
      };
      document.body.appendChild(script);

      return () => {
        // Only remove if script was added
        const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
        if (existingScript) {
          document.body.removeChild(existingScript);
        }
      };
    } else if (gateway === 'PHONEPE') {
      // PhonePe redirect will be handled automatically
      if (gatewayResponse?.redirectUrl) {
        window.location.href = gatewayResponse.redirectUrl;
      } else if (gatewayResponse?.deeplink) {
        // Try deeplink first, fallback to redirect URL
        window.location.href = gatewayResponse.deeplink;
      } else {
        toast.error('PhonePe redirect URL not available');
        setPaymentStatus('failed');
        onFailure?.('Payment gateway configuration error');
      }
    }
  }, [gateway, gatewayResponse]);

  const initializeRazorpay = () => {
    if (!window.Razorpay) {
      toast.error('Razorpay SDK not loaded');
      setPaymentStatus('failed');
      onFailure?.('Payment gateway not available');
      return;
    }

    const options = {
      key: gatewayResponse.key,
      amount: gatewayResponse.amount,
      currency: gatewayResponse.currency,
      name: gatewayResponse.name,
      description: gatewayResponse.description,
      order_id: gatewayResponse.orderId,
      prefill: gatewayResponse.prefill,
      theme: gatewayResponse.theme,
      handler: async function (response: any) {
        setPaymentStatus('processing');
        setLoading(true);

        try {
          // Verify payment with backend
          const verifyResponse = await fetch('/api/payment/verify-razorpay', {
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

          if (verifyData.success) {
            setPaymentStatus('success');
            toast.success('Payment successful!');
            onSuccess?.();
            
            // Redirect after 2 seconds
            setTimeout(() => {
              router.push(`/payment/success?paymentId=${paymentId}`);
            }, 2000);
          } else {
            setPaymentStatus('failed');
            toast.error(verifyData.error || 'Payment verification failed');
            onFailure?.(verifyData.error || 'Payment verification failed');
          }
        } catch (error: any) {
          console.error('Payment verification error:', error);
          setPaymentStatus('failed');
          toast.error('Payment verification failed');
          onFailure?.(error.message || 'Payment verification failed');
        } finally {
          setLoading(false);
        }
      },
      modal: {
        ondismiss: function () {
          setPaymentStatus('failed');
          toast.error('Payment cancelled');
          onFailure?.('Payment cancelled by user');
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  const handleManualPayment = async () => {
    setLoading(true);
    try {
      // Check payment status
      const response = await fetch(`/api/payment/status/${paymentId}`);
      const data = await response.json();

      if (data.success && data.payment.status === 'SUCCESS') {
        setPaymentStatus('success');
        toast.success('Payment verified!');
        onSuccess?.();
        router.push(`/payment/success?paymentId=${paymentId}`);
      } else {
        toast.error('Payment not verified yet');
      }
    } catch (error: any) {
      toast.error('Failed to check payment status');
    } finally {
      setLoading(false);
    }
  };

  if (gateway === 'PHONEPE') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Redirecting to PhonePe...</h3>
          <p className="text-sm text-gray-600">Please complete the payment on PhonePe</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h2>
        <p className="text-gray-600">{shopName}</p>
        <p className="text-sm text-gray-500">{planName}</p>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-700 font-medium">Amount:</span>
          <span className="text-2xl font-bold text-blue-600">₹{amount}</span>
        </div>
      </div>

      {paymentStatus === 'pending' && (
        <div className="text-center">
          <p className="text-gray-600 mb-4">Razorpay payment window will open shortly...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      )}

      {paymentStatus === 'processing' && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying payment...</p>
        </div>
      )}

      {paymentStatus === 'success' && (
        <div className="text-center">
          <div className="text-green-500 text-4xl mb-4">✓</div>
          <p className="text-green-600 font-semibold mb-2">Payment Successful!</p>
          <p className="text-sm text-gray-600">Redirecting...</p>
        </div>
      )}

      {paymentStatus === 'failed' && (
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">✗</div>
          <p className="text-red-600 font-semibold mb-4">Payment Failed</p>
          <button
            onClick={handleManualPayment}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Payment Status'}
          </button>
        </div>
      )}
    </div>
  );
}

