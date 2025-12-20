'use client';

import { useState } from 'react';
import { PRICING_PLANS, PlanType } from '@/app/utils/pricing';
import RazorpayCheckout from './RazorpayCheckout';
import toast from 'react-hot-toast';

interface SubscriptionPlanSelectorProps {
  shopId?: string;
  shopName: string;
  ownerName: string;
  mobile: string;
  email?: string;
  agentId?: string;
  shopperId?: string;
  currentPlan?: PlanType;
  onPaymentSuccess?: () => void;
}

export default function SubscriptionPlanSelector({
  shopId,
  shopName,
  ownerName,
  mobile,
  email,
  agentId,
  shopperId,
  currentPlan,
  onPaymentSuccess,
}: SubscriptionPlanSelectorProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(currentPlan || 'BASIC');
  const [showPayment, setShowPayment] = useState(false);

  const handlePlanSelect = (planType: PlanType) => {
    setSelectedPlan(planType);
    setShowPayment(false);
  };

  const handleProceedToPayment = () => {
    if (!shopName || !ownerName || !mobile) {
      toast.error('Please fill in shop details first');
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    if (onPaymentSuccess) {
      onPaymentSuccess();
    }
  };

  return (
    <div className="space-y-6">
      {/* Plan Selection */}
      {!showPayment && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Select Subscription Plan
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {Object.entries(PRICING_PLANS).map(([key, plan]) => {
              const planType = key as PlanType;
              const isSelected = selectedPlan === planType;
              const isCurrentPlan = currentPlan === planType;
              
              return (
                <div
                  key={key}
                  onClick={() => handlePlanSelect(planType)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-gray-900">{plan.name}</h4>
                    {isCurrentPlan && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mb-3">
                    ₹{plan.amount}
                    <span className="text-sm text-gray-500 font-normal">/year</span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1 mb-4">
                    {plan.features.slice(0, 4).map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                    {plan.features.length > 4 && (
                      <li className="text-gray-400 text-xs">
                        +{plan.features.length - 4} more features
                      </li>
                    )}
                  </ul>
                  {isSelected && (
                    <div className="mt-2 text-center">
                      <span className="text-xs font-semibold text-blue-600">
                        Selected
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected Plan Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Selected Plan</p>
                <p className="text-lg font-bold text-gray-900">
                  {PRICING_PLANS[selectedPlan].name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Amount</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{PRICING_PLANS[selectedPlan].amount}
                </p>
              </div>
            </div>
          </div>

          {/* Proceed to Payment Button */}
          <button
            onClick={handleProceedToPayment}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Proceed to Payment
          </button>
        </div>
      )}

      {/* Payment Component */}
      {showPayment && (
        <div>
          <button
            onClick={() => setShowPayment(false)}
            className="mb-4 text-blue-600 hover:text-blue-800 font-semibold"
          >
            ← Back to Plan Selection
          </button>
          <RazorpayCheckout
            shopId={shopId}
            shopName={shopName}
            ownerName={ownerName}
            mobile={mobile}
            email={email}
            agentId={agentId}
            shopperId={shopperId}
            planType={selectedPlan}
            amount={PRICING_PLANS[selectedPlan].amount}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={() => {
              // Optionally handle failure
            }}
          />
        </div>
      )}
    </div>
  );
}

