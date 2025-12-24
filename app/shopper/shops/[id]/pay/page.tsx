'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import RazorpayPayment from '@/app/components/RazorpayPayment';
import { useShopperAuth } from '@/app/contexts/ShopperAuthContext';
import { PRICING_PLANS, PlanType } from '@/app/utils/pricing';
import toast from 'react-hot-toast';

interface Shop {
  _id: string;
  shopName: string;
  ownerName: string;
  mobile: string;
  email?: string;
  planType: PlanType;
  paymentStatus: string;
}

const PLANS = [
  { value: 'BASIC', label: 'Basic Plan', amount: PRICING_PLANS.BASIC.amount, validity: '365 days' },
  { value: 'PREMIUM', label: 'Premium Plan', amount: PRICING_PLANS.PREMIUM.amount, validity: '365 days' },
  { value: 'FEATURED', label: 'Featured Plan', amount: PRICING_PLANS.FEATURED.amount, validity: '365 days' },
  { value: 'LEFT_BAR', label: 'Left Bar Plan', amount: PRICING_PLANS.LEFT_BAR.amount, validity: '365 days' },
  { value: 'RIGHT_SIDE', label: 'Right Side Plan', amount: PRICING_PLANS.RIGHT_SIDE.amount, validity: '365 days' },
  { value: 'BOTTOM_RAIL', label: 'Bottom Rail Plan', amount: PRICING_PLANS.BOTTOM_RAIL.amount, validity: '365 days' },
  { value: 'BANNER', label: 'Banner Plan', amount: PRICING_PLANS.BANNER.amount, validity: '365 days' },
  { value: 'HERO', label: 'Hero Plan', amount: PRICING_PLANS.HERO.amount, validity: '365 days' },
];

export default function ShopperShopPayment() {
  const { shopper, token } = useShopperAuth();
  const router = useRouter();
  const params = useParams();
  const shopId = params.id as string;
  
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('BASIC');

  useEffect(() => {
    if (!shopper) {
      router.push('/shopper/login');
      return;
    }
    
    if (shopId) {
      fetchShop();
    }
  }, [shopper, shopId]);

  const fetchShop = async () => {
    try {
      const response = await fetch(`/api/shopper/shops/${shopId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.shop) {
        setShop(data.shop);
        setSelectedPlan(data.shop.planType || 'BASIC');
      }
    } catch (error) {
      console.error('Error fetching shop:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (response: any) => {
    console.log('Payment successful:', response);
    // Redirect to dashboard after successful payment
    setTimeout(() => {
      router.push('/shopper/dashboard');
    }, 2000);
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
  };

  const selectedPlanDetails = PLANS.find(p => p.value === selectedPlan);

  if (!shopper) {
    return null;
  }

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
          <p className="text-gray-600">Shop not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-white hover:text-blue-200"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold">Shop Payment</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Payment</h2>
            <p className="text-gray-600">Activate your shop listing with secure online payment</p>
          </div>

          {/* Shop Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Shop Details</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Shop Name:</span> {shop.shopName}</p>
              <p><span className="font-medium">Owner:</span> {shop.ownerName}</p>
              <p><span className="font-medium">Mobile:</span> {shop.mobile}</p>
              {shop.email && <p><span className="font-medium">Email:</span> {shop.email}</p>}
            </div>
          </div>

          {/* Plan Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Plan
            </label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value as PlanType)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {PLANS.map((plan) => (
                <option key={plan.value} value={plan.value}>
                  {plan.label} - ₹{plan.amount} ({plan.validity})
                </option>
              ))}
            </select>
          </div>

        {/* Payment Section */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Payment Summary</h3>
          
          {selectedPlanDetails && (
            <div className="mb-6">
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600">Selected Plan:</span>
                <span className="font-semibold text-gray-900">{selectedPlanDetails.label}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">Amount:</span>
                <span className="text-2xl font-bold text-blue-600">₹{selectedPlanDetails.amount}</span>
              </div>
            </div>
          )}

          {/* Payment Button */}
          <RazorpayPayment
            shopId={shop._id}
            planType={selectedPlan}
            customerName={shop.ownerName}
            customerEmail={shop.email}
            customerPhone={shop.mobile}
            userType="shopper"
            shopperId={shopper.id}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            buttonText={`Pay ₹${selectedPlanDetails?.amount} via Razorpay`}
          />

          <p className="text-sm text-gray-500 mt-4 text-center">
            🔒 Secure payment powered by Razorpay
          </p>
        </div>
        </div>
      </main>
    </div>
  );
}

