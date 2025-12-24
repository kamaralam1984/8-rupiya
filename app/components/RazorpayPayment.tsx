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

      console.log('🔍 Gateway response received:', {
        hasOrderId: !!gatewayResponse?.orderId,
        orderId: gatewayResponse?.orderId,
        hasKey: !!gatewayResponse?.key,
        gatewayResponseKeys: gatewayResponse ? Object.keys(gatewayResponse) : []
      });

      if (!window.Razorpay) {
        throw new Error('Razorpay script not loaded');
      }

      // Step 2: Open Razorpay Checkout
      setStatus('processing');

      const razorpayOptions = {
        ...gatewayResponse,
        order_id: gatewayResponse?.orderId || gatewayResponse?.order_id, // Ensure order_id is set
        handler: async function (response: any) {
          try {
            // Check if response has error (payment failed)
            if (response?.error) {
              console.warn('Payment failed with error:', response.error);
              setStatus('failed');
              setLoading(false);
              toast.error(response.error.description || response.error.reason || 'Payment failed. Please try again.');
              
              if (onError) {
                onError(new Error(response.error.description || 'Payment failed'));
              }
              return; // Exit early, don't try to verify
            }

            // Log full response for debugging
            console.log('🔍 Full Razorpay response:', JSON.stringify(response, null, 2));
            console.log('🔍 Response type:', typeof response);
            console.log('🔍 Response keys:', response ? Object.keys(response) : 'null');
            
            // Razorpay response might have different field names - normalize them
            const orderId = response.razorpay_order_id || response.order_id || response.razorpayOrderId || response.razorpayOrderId;
            const paymentId = response.razorpay_payment_id || response.payment_id || response.razorpayPaymentId || response.razorpayPaymentId;
            const signature = response.razorpay_signature || response.signature || response.razorpaySignature || response.razorpaySignature;
            
            console.log('🔍 Extracted values:', {
              orderId: orderId ? orderId.substring(0, 20) + '...' : 'MISSING',
              paymentId: paymentId ? paymentId.substring(0, 20) + '...' : 'MISSING',
              signature: signature ? signature.substring(0, 20) + '...' : 'MISSING'
            });
            
            // Validate response has all required fields
            if (!response || !orderId || !paymentId || !signature) {
              // User likely cancelled the payment - handle gracefully
              console.error('❌ Payment cancelled by user or incomplete response:', {
                hasResponse: !!response,
                hasOrderId: !!orderId,
                hasPaymentId: !!paymentId,
                hasSignature: !!signature,
                responseKeys: response ? Object.keys(response) : [],
                fullResponse: response
              });
              setStatus('idle');
              setLoading(false);
              
              // Show user-friendly message
              toast.error('Payment was cancelled or incomplete. Please try again.', {
                duration: 5000
              });
              
              if (onError) {
                onError(new Error('Payment cancelled or incomplete response'));
              }
              return; // Exit early
            }

            console.log('✅ Payment response received:', {
              orderId: orderId?.substring(0, 20) + '...',
              paymentId: paymentId?.substring(0, 20) + '...',
              hasSignature: !!signature
            });

            setStatus('processing');

            // Step 3: Verify Payment
            const verifyResponse = await fetch('/api/payment/verify-razorpay', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                razorpay_order_id: orderId,
                razorpay_payment_id: paymentId,
                razorpay_signature: signature,
              }),
            });

            let verifyData;
            try {
              verifyData = await verifyResponse.json();
            } catch (parseError: any) {
              console.error('Failed to parse verification response:', parseError);
              const responseText = await verifyResponse.text();
              console.error('Raw response:', responseText);
              throw new Error('Invalid response from payment verification server');
            }

            if (!verifyResponse.ok || !verifyData.success) {
              const errorMessage = verifyData.error || verifyData.details || 'Payment verification failed';
              console.error('❌ Payment verification failed:', {
                status: verifyResponse.status,
                error: verifyData.error,
                details: verifyData.details,
                fullResponse: verifyData,
                receivedOrderId: orderId,
              });
              
              // Check if payment was actually successful but verification failed due to technical issues
              if (verifyResponse.status === 404 && verifyData.error?.includes('Payment order not found')) {
                // Payment might have succeeded but payment record not found
                // This could happen if there's a database sync issue
                throw new Error('Payment record not found. Payment may have succeeded. Please check with support or try again.');
              }
              
              throw new Error(errorMessage);
            }

            // Step 4: Payment Success
            setStatus('success');
            toast.success('Payment successful! Subscription activated.');
            
            if (onSuccess) {
              onSuccess(response);
            }
          } catch (error: any) {
            console.error('❌ Payment verification error:', error);
            setStatus('failed');
            setLoading(false);
            
            // Show user-friendly error message
            const errorMessage = error.message || 'Payment verification failed';
            
            // Don't show error if it's just about incomplete response (already handled above)
            if (!errorMessage.includes('incomplete') && !errorMessage.includes('cancelled')) {
              // Show error with more context
              toast.error(errorMessage, {
                duration: 6000,
              });
              
              // If payment was successful in Razorpay but verification failed, show helpful message
              if (errorMessage.includes('Payment record not found') || errorMessage.includes('verification failed')) {
                toast('💡 Tip: Payment may have succeeded. Please check your payment history or contact support.', {
                  duration: 8000,
                  icon: 'ℹ️',
                });
              }
            }
            
            if (onError) {
              onError(error);
            }
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            // User closed the payment popup - handle gracefully
            console.log('Payment popup closed by user');
            setStatus('idle');
            setLoading(false);
            // Don't show error for cancellation - it's a user choice
            // toast.info('Payment cancelled. You can try again when ready.');
            
            // Don't call onError for cancellations - it's not really an error
            // Don't redirect - let user stay on the page to try again
          },
        },
        // Handle payment errors
        'onPaymentFailed': function (response: any) {
          console.error('Razorpay payment failed:', response);
          setStatus('failed');
          setLoading(false);
          toast.error(response.error?.description || 'Payment failed. Please try again.');
          
          if (onError) {
            onError(new Error(response.error?.description || 'Payment failed'));
          }
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
