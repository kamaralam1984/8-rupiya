'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAgentAuth } from '@/app/contexts/AgentAuthContext';
import AgentRouteGuard from '@/app/components/AgentRouteGuard';
import AgentHeader from '@/app/components/AgentHeader';
import RazorpayPayment from '@/app/components/RazorpayPayment';

interface Shop {
  _id: string;
  shopName: string;
  ownerName: string;
  mobile: string;
  email?: string;
  category: string;
  planType: string;
  amount: number;
  paymentStatus: string;
  photoUrl?: string;
}

const PLANS = [
  { value: 'BASIC', label: 'Basic Plan', amount: 100, features: ['Basic listing', 'Visible in search', '1 photo', '365 days'] },
  { value: 'PREMIUM', label: 'Premium Plan', amount: 300, features: ['Premium listing', 'Higher priority', '3 photos', '365 days'] },
  { value: 'FEATURED', label: 'Featured Plan', amount: 500, features: ['Featured listing', 'Top priority', '5 photos', '365 days'] },
  { value: 'LEFT_BAR', label: 'Left Bar Plan', amount: 700, features: ['Left sidebar display', 'Prime visibility', '5 photos', '365 days'] },
  { value: 'RIGHT_SIDE', label: 'Right Side Plan', amount: 700, features: ['Right sidebar display', 'Prime visibility', '5 photos', '365 days'] },
  { value: 'BOTTOM_RAIL', label: 'Bottom Rail Plan', amount: 1000, features: ['Bottom rail display', 'Maximum visibility', '10 photos', '365 days'] },
  { value: 'BANNER', label: 'Banner Plan', amount: 1200, features: ['Banner display', 'Top visibility', 'Unlimited photos', '365 days'] },
  { value: 'HERO', label: 'Hero Plan', amount: 1500, features: ['Hero section display', 'Maximum impact', 'Unlimited photos', '365 days'] },
];

export default function AgentShopPayment() {
  const { agent } = useAgentAuth();
  const router = useRouter();
  const params = useParams();
  const shopId = params.id as string;
  
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('BASIC');

  useEffect(() => {
    if (shopId) {
      fetchShop();
    }
  }, [shopId]);

  const fetchShop = async () => {
    try {
      const token = localStorage.getItem('agent_token');
      const response = await fetch(`/api/agent/shops/${shopId}`, {
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
    // Redirect to shops page after successful payment
    setTimeout(() => {
      router.push('/agent/shops');
    }, 2000);
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
  };

  if (loading) {
    return (
      <AgentRouteGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </AgentRouteGuard>
    );
  }

  if (!shop) {
    return (
      <AgentRouteGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Shop Not Found</h2>
            <button
              onClick={() => router.push('/agent/shops')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Shops
            </button>
          </div>
        </div>
      </AgentRouteGuard>
    );
  }

  const selectedPlanDetails = PLANS.find((p) => p.value === selectedPlan);

  return (
    <AgentRouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
        <AgentHeader />

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Back
          </button>

          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Shop Payment</h1>
            <p className="text-gray-600">Complete payment to activate your shop listing</p>
          </div>

          {/* Shop Details Card */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Shop Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shop.photoUrl && (
                <div className="md:col-span-2">
                  <img
                    src={shop.photoUrl}
                    alt={shop.shopName}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Shop Name</p>
                <p className="font-semibold text-gray-900">{shop.shopName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Owner Name</p>
                <p className="font-semibold text-gray-900">{shop.ownerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Mobile</p>
                <p className="font-semibold text-gray-900">{shop.mobile}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-semibold text-gray-900">{shop.category}</p>
              </div>
            </div>
          </div>

          {/* Plan Selection */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PLANS.map((plan) => (
                <div
                  key={plan.value}
                  onClick={() => setSelectedPlan(plan.value)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPlan === plan.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{plan.label}</h3>
                    <span className="text-2xl font-bold text-blue-600">₹{plan.amount}</span>
                  </div>
                  <ul className="space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center">
                        <span className="text-green-600 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Details</h2>
            
            {selectedPlanDetails && (
              <div className="mb-6">
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Selected Plan:</span>
                  <span className="font-semibold text-gray-900">{selectedPlanDetails.label}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Amount:</span>
                  <span className="text-2xl font-bold text-blue-600">₹{selectedPlanDetails.amount}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600">Agent Commission (20%):</span>
                  <span className="font-semibold text-green-600">₹{(selectedPlanDetails.amount * 0.2).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Payment Button */}
            {agent && (
              <RazorpayPayment
                shopId={shop._id}
                planType={selectedPlan}
                customerName={shop.ownerName}
                customerEmail={shop.email}
                customerPhone={shop.mobile}
                userType="agent"
                agentId={agent.id}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                buttonText={`Pay ₹${selectedPlanDetails?.amount} via Razorpay`}
              />
            )}

            <p className="text-sm text-gray-500 mt-4 text-center">
              Secure payment powered by Razorpay
            </p>
          </div>
        </div>
      </div>
    </AgentRouteGuard>
  );
}

