'use client';

import { useState, useEffect } from 'react';
import { PRICING_PLANS, PlanType } from '@/app/utils/pricing';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';

interface AgentRazorpayQRPaymentProps {
  shopId?: string;
  shopName: string;
  ownerName: string;
  mobile: string;
  email?: string;
  agentId?: string;
}

export default function AgentRazorpayQRPayment({
  shopId,
  shopName,
  ownerName,
  mobile,
  email,
  agentId,
}: AgentRazorpayQRPaymentProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('BASIC');
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [paymentLinkUrl, setPaymentLinkUrl] = useState<string>('');
  const [paymentLinkId, setPaymentLinkId] = useState<string>('');
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Get agentId from token if not provided
  useEffect(() => {
    if (!agentId && typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('agent_token');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.agentId) {
            // agentId will be set via state if needed
          }
        }
      } catch (e) {
        console.error('Failed to get agentId from token:', e);
      }
    }
  }, [agentId]);

  // Poll for payment status
  useEffect(() => {
    if (!paymentLinkId || !checkingPayment) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payment/check-payment-link?paymentLinkId=${paymentLinkId}`);
        const data = await response.json();

        if (data.success && data.paymentLink?.status === 'paid') {
          setCheckingPayment(false);
          toast.success('Payment successful!');
          setQrCodeUrl('');
          setPaymentLinkUrl('');
          setPaymentLinkId('');
          window.location.reload();
        }
      } catch (error) {
        console.error('Error checking payment:', error);
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [paymentLinkId, checkingPayment]);

  const generateQRCode = async () => {
    if (!paymentLinkUrl) return;

    try {
      const qrDataUrl = await QRCode.toDataURL(paymentLinkUrl, {
        width: 400,
        margin: 3,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      });
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  const handleCreatePaymentLink = async () => {
    // Get agentId from token if not provided
    let currentAgentId = agentId;
    if (!currentAgentId && typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('agent_token');
        if (token) {
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

      const requestBody: any = {
        planType: selectedPlan,
        customerName: ownerName,
        customerEmail: email || `${mobile}@test.com`,
        customerPhone: mobile,
        agentId: currentAgentId,
      };

      // Only add shopId if provided
      if (shopId) {
        requestBody.shopId = shopId;
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

      const response = await fetch('/api/payment/create-payment-link', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment link');
      }

      if (!data.success) {
        throw new Error('Invalid response from server');
      }

      // API returns paymentLinkUrl directly, not nested in paymentLink
      setPaymentLinkUrl(data.paymentLinkUrl || data.paymentLink?.short_url || '');
      setPaymentLinkId(data.paymentLinkId || data.paymentLink?.id || '');
      setCheckingPayment(true);
      toast.success('Payment link created! QR code generating...');

      // Generate QR code from payment link URL
      await generateQRCode();
    } catch (error: any) {
      console.error('Payment link error:', error);
      toast.error(error.message || 'Failed to create payment link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-white">
      <h3 className="text-lg font-semibold mb-3 text-gray-900">
        📱 Razorpay QR Code Payment
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Plan
          </label>
          <select
            value={selectedPlan}
            onChange={(e) => {
              setSelectedPlan(e.target.value as PlanType);
              setQrCodeUrl('');
              setPaymentLinkUrl('');
              setPaymentLinkId('');
              setCheckingPayment(false);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            disabled={loading || !!qrCodeUrl}
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

        {!qrCodeUrl && !paymentLinkUrl && (
          <button
            onClick={handleCreatePaymentLink}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Payment Link...' : 'Generate QR Code'}
          </button>
        )}

        {qrCodeUrl && (
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="text-md font-semibold text-gray-900 mb-2">
                Scan QR Code to Pay
              </h4>
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <img
                    src={qrCodeUrl}
                    alt="Payment QR Code"
                    className="w-64 h-64"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Scan this QR code with any UPI app (Google Pay, PhonePe, Paytm, etc.)
              </p>
            </div>

            {paymentLinkUrl && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Payment Link:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={paymentLinkUrl}
                    readOnly
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(paymentLinkUrl);
                      toast.success('Link copied!');
                    }}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            {checkingPayment && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-800 text-center">
                  ⏳ Waiting for payment... (Checking every 3 seconds)
                </p>
              </div>
            )}

            <button
              onClick={() => {
                setQrCodeUrl('');
                setPaymentLinkUrl('');
                setPaymentLinkId('');
                setCheckingPayment(false);
              }}
              className="w-full bg-gray-600 text-white py-2 rounded-lg font-semibold hover:bg-gray-700"
            >
              Cancel / Generate New
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

