'use client';

import { useState } from 'react';
import Script from 'next/script';

interface RazorpayPaymentProps {
  shopId?: string; // Optional for new shop registration
  planType: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  userType: 'agent' | 'shopper';
  agentId?: string;
  shopperId?: string;
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  buttonText?: string;
  buttonClassName?: string;
}

// Declare Razorpay on window
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayPayment({
  shopId,
  planType,
  customerName,
  customerEmail,
  customerPhone,
  userType,
  agentId,
  shopperId,
  onSuccess,
  onError,
  buttonText = 'Pay Now',
  buttonClassName = '',
}: RazorpayPaymentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      alert('Payment gateway is loading. Please try again in a moment.');
      return;
    }

    try {
      setIsLoading(true);

      // Create order
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(shopId && { shopId }), // Only include shopId if provided
          planType,
          customerName,
          customerEmail,
          customerPhone,
          userType,
          agentId,
          shopperId,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      // Razorpay options
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: '8-Rupiya Business Listing',
        description: `${orderData.planName} - Shop Listing Payment`,
        image: '/logo.png', // Add your logo here
        order_id: orderData.orderId,
        prefill: {
          name: customerName,
          email: customerEmail || '',
          contact: customerPhone,
        },
        notes: {
          shopId,
          planType,
          userType,
        },
        theme: {
          color: '#3399cc',
        },
        handler: async function (response: any) {
          try {
            // Verify payment (keep loading state from button click)
            const verifyResponse = await fetch('/api/payment/verify', {
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
              setIsLoading(false); // Stop loading on success
              if (onSuccess) {
                onSuccess(verifyData);
              }
            } else {
              setIsLoading(false); // Stop loading on failure
              throw new Error(verifyData.message || 'Payment verification failed');
            }
          } catch (error: any) {
            console.error('Payment verification error:', error);
            setIsLoading(false); // Stop loading on error
            alert(`Payment verification failed: ${error.message}`);
            if (onError) {
              onError(error);
            }
          }
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
            // If user closes modal, reset state
            if (onError) {
              onError({ message: 'Payment cancelled by user' });
            }
          },
        },
      };

      // Open Razorpay checkout
      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response.error);
        alert(`Payment failed: ${response.error.description}`);
        if (onError) {
          onError(response.error);
        }
        setIsLoading(false);
      });

      rzp.open();
    } catch (error: any) {
      console.error('Payment error:', error);
      alert(`Payment error: ${error.message}`);
      if (onError) {
        onError(error);
      }
      setIsLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
        onError={() => alert('Failed to load payment gateway')}
      />
      
      <button
        onClick={handlePayment}
        disabled={isLoading || !razorpayLoaded}
        className={
          buttonClassName ||
          `w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold ${
            isLoading ? 'opacity-50' : ''
          }`
        }
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing...
          </span>
        ) : (
          buttonText
        )}
      </button>
    </>
  );
}

