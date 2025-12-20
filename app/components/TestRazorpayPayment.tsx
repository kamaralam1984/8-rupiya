'use client';

import { useState } from 'react';
import { PRICING_PLANS, PlanType } from '@/app/utils/pricing';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface TestRazorpayPaymentProps {
  shopId?: string;
  shopName: string;
  ownerName: string;
  mobile: string;
  email?: string;
  agentId?: string;
}

export default function TestRazorpayPayment({
  shopId,
  shopName,
  ownerName,
  mobile,
  email,
  agentId,
}: TestRazorpayPaymentProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('BASIC');
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  const loadRazorpay = () => {
    if (typeof window !== 'undefined' && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        setRazorpayLoaded(true);
        toast.success('Razorpay loaded successfully');
      };
      script.onerror = () => {
        toast.error('Failed to load Razorpay');
      };
      document.body.appendChild(script);
    } else if (window.Razorpay) {
      setRazorpayLoaded(true);
    }
  };

  const handlePayment = async () => {
    if (!razorpayLoaded && typeof window !== 'undefined') {
      loadRazorpay();
      toast.error('Please wait for Razorpay to load');
      return;
    }

    // Get agentId from token if not provided
    let currentAgentId = agentId;
    if (!currentAgentId && typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('agent_token');
        if (token) {
          // Decode token to get agentId (simple base64 decode for JWT payload)
          const payload = JSON.parse(atob(token.split('.')[1]));
          currentAgentId = payload.agentId;
        }
      } catch (e) {
        console.error('Failed to get agentId from token:', e);
      }
    }

    if (!currentAgentId) {
      toast.error('Agent ID not found. Please login again.');
      return;
    }

    setLoading(true);
    try {
      const planDetails = PRICING_PLANS[selectedPlan];
      
      // Create order - shopId is optional for testing
      const orderBody: any = {
        planType: selectedPlan,
        customerName: ownerName,
        customerEmail: email || `${mobile}@test.com`,
        customerPhone: mobile,
        userType: 'agent',
        agentId: currentAgentId,
      };

      // Only add shopId if provided
      if (shopId) {
        orderBody.shopId = shopId;
      }
      
      // Get token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('agent_token') : null;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Create order
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderBody),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to create order');
      }

      // Initialize Razorpay checkout
      const options = {
        key: data.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: '8rupiya.com',
        description: `Payment for ${planDetails.name} Plan`,
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
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
              toast.success('Payment successful!');
              window.location.reload();
            } else {
              toast.error(verifyData.message || 'Payment verification failed');
            }
          } catch (error: any) {
            toast.error(error.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: ownerName,
          email: email || `${mobile}@test.com`,
          contact: mobile,
        },
        theme: {
          color: '#3B82F6',
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            toast.error('Payment cancelled');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setLoading(false);
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-yellow-50">
      <h3 className="text-lg font-semibold mb-3 text-yellow-900">
        🧪 Test Razorpay Online Payment
      </h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Plan
          </label>
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value as PlanType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            {Object.entries(PRICING_PLANS).map(([key, plan]) => (
              <option key={key} value={key}>
                {plan.name} - ₹{plan.amount}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Plan:</strong> {PRICING_PLANS[selectedPlan].name}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Amount:</strong> ₹{PRICING_PLANS[selectedPlan].amount}
          </p>
        </div>

        {!razorpayLoaded && (
          <button
            onClick={loadRazorpay}
            className="w-full bg-gray-600 text-white py-2 rounded-lg font-semibold hover:bg-gray-700"
          >
            Load Razorpay SDK
          </button>
        )}

        <button
          onClick={handlePayment}
          disabled={loading || !razorpayLoaded}
          className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Test Online Payment'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          This is a test component. Use test card: 4111 1111 1111 1111
        </p>
      </div>
    </div>
  );
}

