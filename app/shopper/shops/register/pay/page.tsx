'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useShopperAuth } from '@/app/contexts/ShopperAuthContext';
import RazorpayPayment from '@/app/components/RazorpayPayment';
import { PRICING_PLANS, PlanType } from '@/app/utils/pricing';
import toast from 'react-hot-toast';

export default function ShopperRegisterShopPayment() {
  const router = useRouter();
  const { shopper, isAuthenticated, loading: authLoading } = useShopperAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Get form data from sessionStorage
  const [formData, setFormData] = useState<{
    planType: PlanType;
    amount: number;
    ownerName: string;
    mobile: string;
    shopName?: string;
    category?: string;
    pincode?: string;
    area?: string;
    address?: string;
    photoUrl?: string;
    additionalPhotos?: string[];
    latitude?: number | null;
    longitude?: number | null;
    receiptNo?: string;
    sendSmsReceipt?: boolean;
  } | null>(null);

  useEffect(() => {
    // Check authentication
    if (!authLoading && !isAuthenticated) {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('shopper_token') : null;
      if (!storedToken) {
        router.push('/shopper/login');
        return;
      }
    }
    
    // Get form data from sessionStorage
    const storedFormData = sessionStorage.getItem('shopper_shop_registration_data');
    if (storedFormData) {
      try {
        const parsed = JSON.parse(storedFormData);
        setFormData({
          planType: parsed.planType || 'BASIC',
          amount: parsed.amount || PRICING_PLANS.BASIC.amount,
          ownerName: parsed.ownerName || '',
          mobile: parsed.mobile || '',
          shopName: parsed.shopName,
          category: parsed.category,
          pincode: parsed.pincode,
          area: parsed.area,
          address: parsed.address,
          photoUrl: parsed.photoUrl,
          additionalPhotos: parsed.additionalPhotos || [],
          latitude: parsed.latitude,
          longitude: parsed.longitude,
          receiptNo: parsed.receiptNo,
          sendSmsReceipt: parsed.sendSmsReceipt || false,
        });
        
        // If payment was already successful, enable submit button
        if (parsed.paymentStatus === 'PAID') {
          setPaymentSuccess(true);
        }
      } catch (error) {
        console.error('Error parsing form data:', error);
        toast.error('Invalid form data. Please start registration again.');
        router.push('/shopper/shops/register');
        return;
      }
    } else {
      toast.error('No registration data found. Please start registration again.');
      router.push('/shopper/shops/register');
      return;
    }
    
    setLoading(false);
  }, [router, isAuthenticated, authLoading]);

  const handlePaymentSuccess = (response: any) => {
    console.log('✅ Payment successful:', response);
    setPaymentSuccess(true);
    toast.success('✅ Payment successful! You can now submit the shop.');
    
    // Update sessionStorage
    const storedFormData = sessionStorage.getItem('shopper_shop_registration_data');
    if (storedFormData) {
      try {
        const parsed = JSON.parse(storedFormData);
        parsed.paymentStatus = 'PAID';
        parsed.paymentMode = 'UPI';
        sessionStorage.setItem('shopper_shop_registration_data', JSON.stringify(parsed));
      } catch (error) {
        console.error('Error updating form data:', error);
      }
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    toast.error('Payment failed. Please try again.');
  };

  const handleSubmit = async () => {
    if (!formData) {
      toast.error('Form data not found. Please start registration again.');
      router.push('/shopper/shops/register');
      return;
    }

    // Validate required fields
    if (!formData.shopName || !formData.ownerName || !formData.mobile || 
        !formData.category || !formData.pincode || 
        !formData.address || !formData.photoUrl) {
      toast.error('Please fill all required fields in registration form');
      return;
    }

    if (formData.latitude === null || formData.longitude === null) {
      toast.error('Please capture location in registration form');
      return;
    }

    if (!paymentSuccess) {
      toast.error('Please complete the online payment first');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('shopper_token');
      
      // Auto-generate receipt number if not provided
      let receiptNo = formData.receiptNo;
      if (!receiptNo) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        receiptNo = `REC${timestamp}${random}`.slice(0, 10);
      }

      const submitData = {
        shopName: formData.shopName.trim(),
        ownerName: formData.ownerName.trim(),
        mobile: formData.mobile.trim(),
        email: shopper?.email,
        category: formData.category?.trim(),
        pincode: formData.pincode?.trim(),
        area: formData.area?.trim() || '',
        address: formData.address?.trim(),
        photoUrl: formData.photoUrl?.trim(),
        additionalPhotos: formData.additionalPhotos || [],
        latitude: formData.latitude,
        longitude: formData.longitude,
        paymentStatus: 'PAID',
        paymentMode: 'UPI',
        receiptNo: receiptNo,
        amount: formData.amount,
        planType: formData.planType,
        sendSmsReceipt: formData.sendSmsReceipt || false,
      };

      const response = await fetch('/api/shopper/shops/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to submit shop');
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('✅ Shop registered successfully!');
        sessionStorage.removeItem('shopper_shop_registration_data');
        setTimeout(() => {
          router.push('/shopper/shops');
        }, 1500);
      } else {
        throw new Error(data.error || 'Failed to submit shop');
      }
    } catch (error: any) {
      console.error('Shop submission error:', error);
      toast.error(error.message || 'Failed to submit shop. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !formData || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment page...</p>
        </div>
      </div>
    );
  }

  const planDetails = PRICING_PLANS[formData.planType] || PRICING_PLANS.BASIC;
  const amount = formData.amount || planDetails.amount;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/shopper/shops/register')}
              className="text-white hover:text-blue-200"
            >
              ← Back to Registration
            </button>
            <h1 className="text-xl font-bold">Complete Payment</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Payment</h1>
            <p className="text-gray-600">Pay securely via Razorpay to complete your shop registration</p>
          </div>

          {/* Plan Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan:</span>
                <span className="font-semibold text-gray-900">{planDetails.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="text-2xl font-bold text-blue-600">₹{amount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Validity:</span>
                <span className="text-gray-700">365 days</span>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Customer Details</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Name:</span> {formData.ownerName}</p>
              <p><span className="font-medium">Mobile:</span> {formData.mobile}</p>
              {shopper?.email && <p><span className="font-medium">Email:</span> {shopper.email}</p>}
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white rounded-xl shadow-md p-6 border-2 border-blue-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">💳 Payment Details</h2>
            
            <div className="mb-6">
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600">Selected Plan:</span>
                <span className="font-semibold text-gray-900">{planDetails.name}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600">Amount:</span>
                <span className="text-2xl font-bold text-blue-600">₹{amount}</span>
              </div>
            </div>

            {/* Razorpay Payment Button */}
            {!paymentSuccess && shopper && formData.ownerName && formData.mobile ? (
              <div className="mb-4">
                <RazorpayPayment
                  shopId="" // Empty for new shop registration
                  planType={formData.planType}
                  customerName={formData.ownerName}
                  customerEmail={shopper.email}
                  customerPhone={formData.mobile}
                  userType="shopper"
                  shopperId={shopper.id}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  buttonText={`💳 Pay ₹${amount} Securely via Razorpay`}
                  buttonClassName="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-lg hover:shadow-xl"
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  🔒 Secure payment powered by Razorpay
                </p>
              </div>
            ) : paymentSuccess ? (
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 text-center mb-4">
                <div className="text-4xl mb-2">✅</div>
                <h3 className="text-lg font-bold text-green-800 mb-2">Payment Completed</h3>
                <p className="text-green-700 mb-4">Your payment has been successfully processed. You can now submit the shop.</p>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Missing customer details. Please go back and fill in Owner Name and Mobile Number.
                </p>
              </div>
            )}

            {/* Submit Button */}
            {paymentSuccess ? (
              <div className="mt-6">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full px-6 py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {submitting ? 'Submitting Shop...' : '✅ Submit Shop'}
                </button>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Click to complete shop registration
                </p>
              </div>
            ) : (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 text-center">
                  ⚠️ Please complete the online payment first before submitting
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

