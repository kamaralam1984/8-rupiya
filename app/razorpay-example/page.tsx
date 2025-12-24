'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

/**
 * Razorpay Payment Integration Example
 * 
 * This is a complete working example of Razorpay payment integration
 * following the requirements:
 * 1. ✅ Pay Now button in frontend
 * 2. ✅ Razorpay checkout opens on button click
 * 3. ✅ Backend API route creates Razorpay order
 * 4. ✅ Uses RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET from .env
 * 5. ✅ Handles both success and failure scenarios
 * 6. ✅ Clean, beginner-friendly code
 * 7. ✅ Step-by-step explanation included
 */

export default function RazorpayExample() {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

  /**
   * Step 1: Load Razorpay Script
   * This function loads the Razorpay checkout script dynamically
   */
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      // Check if script is already loaded
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      // Create and load script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        console.log('✅ Razorpay script loaded successfully');
        resolve(true);
      };
      script.onerror = () => {
        console.error('❌ Failed to load Razorpay script');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  /**
   * Step 2: Handle Pay Now Button Click
   * This function is called when user clicks the "Pay Now" button
   */
  const handlePayNow = async () => {
    try {
      setLoading(true);
      setPaymentStatus('processing');

      // Step 2.1: Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load Razorpay. Please try again.');
        setLoading(false);
        setPaymentStatus('idle');
        return;
      }

      // Step 2.2: Create order via API
      // This calls our backend API route to create a Razorpay order
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 10000, // Amount in paise (₹100 = 10000 paise)
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create order');
      }

      // Step 2.3: Open Razorpay Checkout
      // This opens the Razorpay payment popup
      const options = {
        key: data.keyId, // Razorpay Key ID from backend
        amount: data.amount, // Amount in paise
        currency: data.currency,
        name: '8 Rupiya', // Your business name
        description: 'Test Payment', // Payment description
        order_id: data.orderId, // Order ID from Razorpay
        handler: async function (response: any) {
          // Step 3: Handle Payment Success
          // This function is called when payment is successful
          console.log('✅ Payment successful:', response);
          
          setPaymentStatus('success');
          setLoading(false);
          
          // Verify payment with backend
          const verifyResponse = await fetch('/api/razorpay/verify-payment', {
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
            toast.success('Payment successful! ✅');
            console.log('Payment verified:', verifyData);
          } else {
            toast.error('Payment verification failed');
            setPaymentStatus('failed');
          }
        },
        prefill: {
          name: 'John Doe', // Pre-fill customer name
          email: 'john@example.com', // Pre-fill email
          contact: '9999999999', // Pre-fill contact number
        },
        theme: {
          color: '#3B82F6', // Button color
        },
        modal: {
          ondismiss: function () {
            // Step 4: Handle Payment Cancellation
            // This function is called when user closes the payment popup
            console.log('Payment cancelled by user');
            setLoading(false);
            setPaymentStatus('idle');
            toast('Payment cancelled', { icon: 'ℹ️' });
          },
        },
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        // Step 5: Handle Payment Failure
        // This function is called when payment fails
        console.error('❌ Payment failed:', response);
        setPaymentStatus('failed');
        setLoading(false);
        toast.error(`Payment failed: ${response.error.description || 'Unknown error'}`);
      });

      razorpay.open();
    } catch (error: any) {
      // Step 6: Handle Errors
      console.error('Payment error:', error);
      setLoading(false);
      setPaymentStatus('failed');
      toast.error(error.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Razorpay Payment Example
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Complete working example with step-by-step explanation
        </p>

        {/* Payment Details */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold text-gray-900">₹100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Currency:</span>
              <span className="font-semibold text-gray-900">INR</span>
            </div>
          </div>
        </div>

        {/* Pay Now Button */}
        <button
          onClick={handlePayNow}
          disabled={loading || paymentStatus === 'processing'}
          className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {loading || paymentStatus === 'processing' ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : (
            '💳 Pay Now'
          )}
        </button>

        {/* Payment Status */}
        {paymentStatus === 'success' && (
          <div className="mt-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-green-800 font-semibold">Payment Successful!</p>
            <p className="text-green-700 text-sm mt-1">Your payment has been processed successfully.</p>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="mt-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg text-center">
            <div className="text-4xl mb-2">❌</div>
            <p className="text-red-800 font-semibold">Payment Failed</p>
            <p className="text-red-700 text-sm mt-1">Please try again or contact support.</p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Click "Pay Now" button</li>
            <li>Razorpay checkout popup opens</li>
            <li>Enter payment details</li>
            <li>Payment is processed and verified</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

