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
  planType?: PlanType; // Optional - if provided, use this instead of dropdown
  amount?: number; // Optional - if provided, use this instead of plan amount
  paymentMode?: 'CASH' | 'UPI' | 'ONLINE' | 'NONE'; // Payment mode - if UPI/ONLINE, show QR code immediately
  onPaymentSuccess?: () => void;
}

export default function AgentRazorpayQRPayment({
  shopId,
  shopName,
  ownerName,
  mobile,
  email,
  agentId,
  planType: propPlanType,
  amount: propAmount,
  paymentMode,
  onPaymentSuccess,
}: AgentRazorpayQRPaymentProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(propPlanType || 'BASIC');
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [paymentLinkUrl, setPaymentLinkUrl] = useState<string>('');
  const [paymentLinkId, setPaymentLinkId] = useState<string>('');
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Static Razorpay.me link
  const RAZORPAY_ME_LINK = 'https://razorpay.me/@8rupiya';

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
          if (onPaymentSuccess) {
            onPaymentSuccess();
          } else {
            window.location.reload();
          }
        }
      } catch (error) {
        console.error('Error checking payment:', error);
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [paymentLinkId, checkingPayment]);

  const generateQRCode = async (url?: string) => {
    const qrUrl = url || paymentLinkUrl || RAZORPAY_ME_LINK;
    if (!qrUrl) return;

    try {
      // Generate QR code with UPI format support
      // Use static Razorpay.me link or payment link URL
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 400,
        margin: 3,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
        type: 'image/png',
      });
      setQrCodeUrl(qrDataUrl);
      // Show success message only if not UPI mode (UPI mode auto-generates silently)
      if (paymentMode !== 'UPI') {
        toast.success('QR code generated successfully!');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  // Generate QR code immediately when paymentMode is UPI or ONLINE
  useEffect(() => {
    if (paymentMode === 'UPI' || paymentMode === 'ONLINE') {
      // Generate QR code with static Razorpay.me link immediately
      const generateQR = async () => {
        try {
          const qrDataUrl = await QRCode.toDataURL(RAZORPAY_ME_LINK, {
            width: 400,
            margin: 3,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
            errorCorrectionLevel: 'H',
            type: 'image/png',
          });
          setQrCodeUrl(qrDataUrl);
          setPaymentLinkUrl(RAZORPAY_ME_LINK);
        } catch (error) {
          console.error('Error generating QR code:', error);
          toast.error('Failed to generate QR code');
        }
      };
      
      // Always generate QR code when UPI/ONLINE mode is active
      generateQR();
    } else if (paymentMode && paymentLinkUrl === RAZORPAY_ME_LINK) {
      // Clear QR code if payment mode changes from UPI/ONLINE to something else
      setQrCodeUrl('');
      setPaymentLinkUrl('');
      setPaymentLinkId('');
      setCheckingPayment(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMode]);

  const handleCreatePaymentLink = async () => {
    // If UPI or ONLINE mode, generate QR code directly from static link
    if (paymentMode === 'UPI' || paymentMode === 'ONLINE') {
      setLoading(true);
      try {
        const qrDataUrl = await QRCode.toDataURL(RAZORPAY_ME_LINK, {
          width: 400,
          margin: 3,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'H',
          type: 'image/png',
        });
        setQrCodeUrl(qrDataUrl);
        setPaymentLinkUrl(RAZORPAY_ME_LINK);
        toast.success('QR code generated successfully!');
      } catch (error) {
        console.error('Error generating QR code:', error);
        toast.error('Failed to generate QR code');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Get agentId from token if not provided (optional for shopper panel)
    let currentAgentId = agentId;
    if (!currentAgentId && typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('agent_token');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          currentAgentId = payload.agentId;
        }
      } catch (e) {
        // Agent ID is optional for shopper panel
        console.log('No agent token found, proceeding without agentId');
      }
    }

    setLoading(true);
    try {
      const finalPlanType = propPlanType || selectedPlan;
      const finalAmount = propAmount || PRICING_PLANS[finalPlanType]?.amount;

      // Validate required fields with detailed error messages
      if (!finalPlanType) {
        toast.error('Please select a plan');
        setLoading(false);
        return;
      }

      if (!PRICING_PLANS[finalPlanType]) {
        toast.error(`Invalid plan type: ${finalPlanType}`);
        setLoading(false);
        return;
      }

      const trimmedOwnerName = (ownerName || '').trim();
      const trimmedMobile = (mobile || '').trim();

      if (!trimmedOwnerName) {
        toast.error('Owner name is required. Please fill in shop details first.');
        setLoading(false);
        return;
      }

      if (!trimmedMobile) {
        toast.error('Mobile number is required. Please fill in shop details first.');
        setLoading(false);
        return;
      }

      const requestBody: any = {
        planType: finalPlanType,
        amount: finalAmount,
        customerName: trimmedOwnerName,
        customerEmail: email || `${trimmedMobile}@test.com`,
        customerPhone: trimmedMobile,
      };

      console.log('Creating payment link with:', {
        planType: finalPlanType,
        customerName: trimmedOwnerName,
        customerPhone: trimmedMobile,
        amount: finalAmount,
      });

      // Only add agentId if it exists
      if (currentAgentId) {
        requestBody.agentId = currentAgentId;
      }

      // Only add shopId if provided
      if (shopId) {
        requestBody.shopId = shopId;
      }

      // Get token from localStorage (try both agent and shopper tokens)
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agent_token') : null;
      const shopperToken = typeof window !== 'undefined' ? localStorage.getItem('shopper_token') : null;
      const token = agentToken || shopperToken;
      
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
        // Show specific error message
        const errorMsg = data.error || 'Failed to create payment link';
        console.error('Payment link creation error:', {
          error: errorMsg,
          requestBody: {
            planType: finalPlanType,
            customerName: ownerName,
            customerPhone: mobile,
            amount: finalAmount,
          }
        });
        throw new Error(errorMsg);
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
      await generateQRCode(data.paymentLinkUrl || data.paymentLink?.short_url || '');
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
        {/* Only show plan selector if planType prop is not provided and not UPI/ONLINE mode */}
        {!propPlanType && paymentMode !== 'UPI' && paymentMode !== 'ONLINE' && (
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
        )}

        {/* Only show plan details if not UPI/ONLINE mode */}
        {paymentMode !== 'UPI' && paymentMode !== 'ONLINE' && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Plan:</strong> {PRICING_PLANS[propPlanType || selectedPlan].name}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Amount:</strong> ₹{propAmount || PRICING_PLANS[propPlanType || selectedPlan].amount}
            </p>
          </div>
        )}

        {/* Show Generate QR Code button - works for all modes */}
        {!qrCodeUrl && (
          <button
            onClick={handleCreatePaymentLink}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading 
              ? (paymentMode === 'UPI' || paymentMode === 'ONLINE' ? 'Generating QR Code...' : 'Creating Payment Link...') 
              : 'Generate QR Code'}
          </button>
        )}

        {/* Show loading message when UPI/ONLINE mode is active and QR code is generating */}
        {(paymentMode === 'UPI' || paymentMode === 'ONLINE') && !qrCodeUrl && (
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <p className="text-sm text-green-800">
              🔄 Generating {paymentMode === 'ONLINE' ? 'Online' : 'UPI'} QR Code...
            </p>
          </div>
        )}

        {qrCodeUrl && (
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="text-md font-semibold text-gray-900 mb-2">
                {paymentMode === 'ONLINE' ? 'Scan QR Code for Online Payment' : 'Scan QR Code to Pay via UPI'}
              </h4>
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-lg">
                  <img
                    src={qrCodeUrl}
                    alt="UPI Payment QR Code"
                    className="w-64 h-64 mx-auto"
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-center gap-4">
                <div className="text-xs text-gray-600 font-semibold">Supported Apps:</div>
                <div className="flex gap-2 items-center">
                  <span className="text-xs bg-blue-50 px-2 py-1 rounded">Google Pay</span>
                  <span className="text-xs bg-purple-50 px-2 py-1 rounded">PhonePe</span>
                  <span className="text-xs bg-blue-50 px-2 py-1 rounded">Paytm</span>
                  <span className="text-xs bg-green-50 px-2 py-1 rounded">BHIM UPI</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {paymentMode === 'ONLINE' 
                  ? 'Scan this QR code with any UPI app or payment app to complete online payment'
                  : 'Scan this QR code with any UPI app to complete payment'}
              </p>
              <div className="mt-2 bg-blue-50 p-2 rounded-lg">
                <p className="text-xs text-blue-800 font-semibold">
                  💡 Tip: Open any UPI app → Scan QR Code → Enter amount → Pay
                </p>
              </div>
            </div>

            {paymentLinkUrl && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">
                  {paymentMode === 'UPI' || paymentMode === 'ONLINE' 
                    ? `${paymentMode === 'ONLINE' ? 'Online' : 'UPI'} Payment Link:` 
                    : 'Payment Link:'}
                </p>
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
                {(paymentMode === 'UPI' || paymentMode === 'ONLINE') && (
                  <p className="text-xs text-blue-600 mt-2">
                    💡 Scan the QR code above or use this link to pay {paymentMode === 'ONLINE' ? 'online' : 'via UPI'}
                  </p>
                )}
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

