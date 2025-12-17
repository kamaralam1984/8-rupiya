'use client';

import { useState } from 'react';
import PaymentCheckout from './PaymentCheckout';
import { PRICING_PLANS, PlanType } from '@/app/utils/pricing';
import toast from 'react-hot-toast';

interface AgentPaymentButtonProps {
  shopId: string;
  shopName: string;
  ownerName: string;
  mobile: string;
  email?: string;
  currentPlan?: PlanType;
  agentId: string;
  onPaymentSuccess?: () => void;
}

export default function AgentPaymentButton({
  shopId,
  shopName,
  ownerName,
  mobile,
  email,
  currentPlan = 'BASIC',
  agentId,
  onPaymentSuccess,
}: AgentPaymentButtonProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(currentPlan);
  const [gateway, setGateway] = useState<'RAZORPAY' | 'PHONEPE'>('RAZORPAY');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  const handleCreateOrder = async () => {
    setCreatingOrder(true);
    try {
      const token = localStorage.getItem('agent_token');
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          shopId,
          planType: selectedPlan,
          gateway,
          customerName: ownerName,
          customerEmail: email,
          customerPhone: mobile,
          agentId,
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
    toast.success('Payment successful! Shop plan activated.');
    setShowPaymentModal(false);
    setPaymentData(null);
    onPaymentSuccess?.();
  };

  const handlePaymentFailure = (error: string) => {
    toast.error(error || 'Payment failed');
  };

  if (paymentData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold">Complete Payment</h3>
            <button
              onClick={() => {
                setPaymentData(null);
                setShowPaymentModal(false);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="p-4">
            <PaymentCheckout
              paymentId={paymentData.paymentId}
              orderId={paymentData.orderId}
              amount={paymentData.amount}
              currency={paymentData.currency}
              gateway={paymentData.gateway}
              gatewayResponse={paymentData.gatewayResponse}
              shopName={shopName}
              planName={PRICING_PLANS[selectedPlan].name}
              onSuccess={handlePaymentSuccess}
              onFailure={handlePaymentFailure}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!showPaymentModal) {
    return (
      <button
        onClick={() => setShowPaymentModal(true)}
        className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
      >
        Collect Online Payment
      </button>
    );
  }

  const selectedPlanDetails = PRICING_PLANS[selectedPlan];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Collect Payment</h2>
            <button
              onClick={() => setShowPaymentModal(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Shop Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="font-semibold text-gray-900">{shopName}</p>
            <p className="text-sm text-gray-600">Owner: {ownerName}</p>
            <p className="text-sm text-gray-600">Mobile: {mobile}</p>
          </div>

          {/* Plan Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Plan
            </label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value as PlanType)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(PRICING_PLANS).map(([key, plan]) => (
                <option key={key} value={key}>
                  {plan.name} - ₹{plan.amount}
                </option>
              ))}
            </select>
          </div>

          {/* Plan Details */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 font-medium">Amount:</span>
              <span className="text-2xl font-bold text-blue-600">₹{selectedPlanDetails.amount}</span>
            </div>
            <p className="text-sm text-gray-600">Validity: 1 Year</p>
          </div>

          {/* Gateway Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Gateway
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setGateway('RAZORPAY')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  gateway === 'RAZORPAY'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900">Razorpay</div>
                <div className="text-xs text-gray-600 mt-1">Cards, UPI, Wallets</div>
              </button>
              <button
                onClick={() => setGateway('PHONEPE')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  gateway === 'PHONEPE'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900">PhonePe</div>
                <div className="text-xs text-gray-600 mt-1">UPI, Cards</div>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateOrder}
              disabled={creatingOrder}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {creatingOrder ? 'Creating Order...' : `Generate Payment Link`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


