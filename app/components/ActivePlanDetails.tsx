'use client';

import { useEffect, useState } from 'react';
import { PRICING_PLANS, PlanType } from '@/app/utils/pricing';
import toast from 'react-hot-toast';

interface ActivePlanDetailsProps {
  shopId?: string;
  agentId?: string;
  shopperId?: string;
  onRefresh?: () => void;
}

interface Subscription {
  _id: string;
  planType: PlanType;
  planAmount: number;
  status: string;
  startDate: string;
  expiryDate: string;
  daysRemaining: number;
  isActive: boolean;
  shopId?: {
    shopName: string;
    ownerName: string;
    mobile: string;
    email?: string;
  };
  paymentId?: {
    orderId: string;
    receiptNo?: string;
    paidAt?: string;
  };
}

export default function ActivePlanDetails({
  shopId,
  agentId,
  shopperId,
  onRefresh,
}: ActivePlanDetailsProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveSubscription();
  }, [shopId, agentId, shopperId]);

  const fetchActiveSubscription = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (shopId) params.append('shopId', shopId);
      if (agentId) params.append('agentId', agentId);
      if (shopperId) params.append('shopperId', shopperId);

      const token = typeof window !== 'undefined' 
        ? localStorage.getItem('agent_token') || localStorage.getItem('shopper_token')
        : null;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/subscriptions/active?${params.toString()}`, {
        headers,
      });

      const data = await response.json();
      if (data.success) {
        setSubscription(data.subscription);
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Active Subscription
          </h3>
          <p className="text-gray-600 mb-4">
            You don't have an active subscription plan yet.
          </p>
          <button
            onClick={onRefresh}
            className="text-blue-600 hover:text-blue-800 font-semibold"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const plan = PRICING_PLANS[subscription.planType];
  const startDate = new Date(subscription.startDate);
  const expiryDate = new Date(subscription.expiryDate);
  const isExpiringSoon = subscription.daysRemaining <= 30;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Active Subscription</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            subscription.isActive
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {subscription.status}
        </span>
      </div>

      <div className="space-y-4">
        {/* Plan Details */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-lg font-bold text-gray-900">{plan.name}</h4>
            <span className="text-2xl font-bold text-blue-600">
              ₹{subscription.planAmount}
            </span>
          </div>
          <p className="text-sm text-gray-600">Annual Subscription</p>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Start Date</p>
            <p className="font-semibold text-gray-900">
              {startDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Expiry Date</p>
            <p className="font-semibold text-gray-900">
              {expiryDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Days Remaining */}
        <div
          className={`rounded-lg p-4 ${
            isExpiringSoon
              ? 'bg-yellow-50 border-2 border-yellow-200'
              : 'bg-green-50 border-2 border-green-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Days Remaining</p>
              <p
                className={`text-2xl font-bold ${
                  isExpiringSoon ? 'text-yellow-700' : 'text-green-700'
                }`}
              >
                {subscription.daysRemaining}
              </p>
            </div>
            {isExpiringSoon && (
              <div className="text-right">
                <p className="text-xs text-yellow-700 font-semibold">
                  ⚠️ Expiring Soon
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Details */}
        {subscription.paymentId && (
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-2">Payment Details</p>
            <div className="space-y-1">
              {subscription.paymentId.receiptNo && (
                <p className="text-sm">
                  <span className="text-gray-600">Receipt No:</span>{' '}
                  <span className="font-semibold text-gray-900">
                    {subscription.paymentId.receiptNo}
                  </span>
                </p>
              )}
              {subscription.paymentId.paidAt && (
                <p className="text-sm">
                  <span className="text-gray-600">Paid On:</span>{' '}
                  <span className="font-semibold text-gray-900">
                    {new Date(subscription.paymentId.paidAt).toLocaleDateString('en-IN')}
                  </span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="border-t pt-4">
          <p className="text-sm font-semibold text-gray-900 mb-2">Plan Features</p>
          <ul className="space-y-1">
            {plan.features.slice(0, 5).map((feature, idx) => (
              <li key={idx} className="text-sm text-gray-600 flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Refresh Button */}
        <button
          onClick={fetchActiveSubscription}
          className="w-full mt-4 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
        >
          Refresh Details
        </button>
      </div>
    </div>
  );
}







