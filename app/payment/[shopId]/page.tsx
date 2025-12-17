'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PaymentCheckout from '@/app/components/PaymentCheckout';
import { PRICING_PLANS, PlanType } from '@/app/utils/pricing';
import toast from 'react-hot-toast';

interface Shop {
  _id: string;
  shopName: string;
  ownerName: string;
  mobile: string;
  email?: string;
  planType: PlanType;
  paymentStatus: 'PAID' | 'PENDING';
  shopUrl?: string;
}

export default function ShopkeeperPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.shopId as string;
  
  const [shop, setShop] = useState<Shop | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('BASIC');
  const [gateway, setGateway] = useState<'RAZORPAY' | 'PHONEPE'>('RAZORPAY');
  const [loading, setLoading] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    if (shopId) {
      fetchShop();
    }
  }, [shopId]);

  const fetchShop = async () => {
    try {
      const response = await fetch(`/api/shops/${shopId}`);
      const data = await response.json();

      if (data.success && data.shop) {
        setShop(data.shop);
        setSelectedPlan(data.shop.planType || 'BASIC');
      } else {
        toast.error('Shop not found');
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to load shop:', error);
      toast.error('Failed to load shop details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!shop) return;

    setCreatingOrder(true);
    try {
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopId: shop._id,
          planType: selectedPlan,
          gateway,
          customerName: shop.ownerName,
          customerEmail: shop.email,
          customerPhone: shop.mobile,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPaymentData(data);
      } else {
        toast.error(data.error || 'Failed to create payment order');
      }
    } catch (error: any) {
      console.error('Payment order creation error:', error);
      toast.error('Failed to create payment order');
    } finally {
      setCreatingOrder(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast.success('Payment successful! Your plan has been activated.');
    setTimeout(() => {
      router.push(`/shop/${(shop as any)?.shopUrl || shopId}`);
    }, 2000);
  };

  const handlePaymentFailure = (error: string) => {
    toast.error(error || 'Payment failed');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Shop not found</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <PaymentCheckout
            paymentId={paymentData.paymentId}
            orderId={paymentData.orderId}
            amount={paymentData.amount}
            currency={paymentData.currency}
            gateway={paymentData.gateway}
            gatewayResponse={paymentData.gatewayResponse}
            shopName={shop.shopName}
            planName={PRICING_PLANS[selectedPlan].name}
            onSuccess={handlePaymentSuccess}
            onFailure={handlePaymentFailure}
          />
        </div>
      </div>
    );
  }

  const currentPlan = PRICING_PLANS[shop.planType || 'BASIC'];
  const selectedPlanDetails = PRICING_PLANS[selectedPlan];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Purchase Plan</h1>
          <p className="text-gray-600">{shop.shopName}</p>
          <p className="text-sm text-gray-500">Owner: {shop.ownerName}</p>
        </div>

        {/* Current Plan Status */}
        {shop.paymentStatus === 'PAID' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-semibold">✓</span>
              <span className="text-green-800 font-medium">
                Current Plan: {currentPlan.name} (Active)
              </span>
            </div>
          </div>
        )}

        {/* Plan Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(PRICING_PLANS).map(([key, plan]) => (
              <button
                key={key}
                onClick={() => setSelectedPlan(key as PlanType)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedPlan === key
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-2xl font-bold text-blue-600 mb-2">₹{plan.amount}</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {plan.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx}>✓ {feature}</li>
                    ))}
                    {plan.features.length > 3 && (
                      <li className="text-blue-600">+{plan.features.length - 3} more</li>
                    )}
                  </ul>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Plan Details */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Plan Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Plan Name:</span>
              <span className="font-semibold">{selectedPlanDetails.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="text-2xl font-bold text-blue-600">₹{selectedPlanDetails.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Validity:</span>
              <span className="font-semibold">1 Year</span>
            </div>
            <div className="pt-4 border-t">
              <h3 className="font-semibold text-gray-900 mb-2">Features:</h3>
              <ul className="space-y-2">
                {selectedPlanDetails.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-green-600">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Payment Gateway Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Gateway</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setGateway('RAZORPAY')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                gateway === 'RAZORPAY'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="font-semibold text-gray-900">Razorpay</div>
                <div className="text-xs text-gray-600 mt-1">Cards, UPI, Wallets</div>
              </div>
            </button>
            <button
              onClick={() => setGateway('PHONEPE')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                gateway === 'PHONEPE'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="font-semibold text-gray-900">PhonePe</div>
                <div className="text-xs text-gray-600 mt-1">UPI, Cards</div>
              </div>
            </button>
          </div>
        </div>

        {/* Proceed Button */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <button
            onClick={handleCreateOrder}
            disabled={creatingOrder}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {creatingOrder ? 'Creating Order...' : `Pay ₹${selectedPlanDetails.amount}`}
          </button>
          <p className="text-xs text-gray-500 text-center mt-3">
            Secure payment powered by {gateway === 'RAZORPAY' ? 'Razorpay' : 'PhonePe'}
          </p>
        </div>
      </div>
    </div>
  );
}


