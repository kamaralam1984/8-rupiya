'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useShopperAuth } from '@/app/contexts/ShopperAuthContext';
import Image from 'next/image';
import { PRICING_PLANS, PlanType } from '@/app/utils/pricing';
import AgentRazorpayQRPayment from '@/app/components/AgentRazorpayQRPayment';
import toast from 'react-hot-toast';

interface FormData {
  shopName: string;
  ownerName: string;
  mobile: string;
  address: string;
  area: string;
  city: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  photoUrl: string;
  planType: PlanType;
  amount: number;
  paymentStatus: 'PAID' | 'PENDING';
}

export default function RegisterShopPage() {
  const router = useRouter();
  const { shopper, isAuthenticated, token, loading: authLoading } = useShopperAuth();
  const [step, setStep] = useState(1); // 1: Plan Selection, 2: Shop Details, 3: Payment
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [locationError, setLocationError] = useState('');
  const [categories, setCategories] = useState<Array<{ _id: string; name: string }>>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [demoPaymentEnabled, setDemoPaymentEnabled] = useState(false);
  const [demoPaymentUntil, setDemoPaymentUntil] = useState<Date | null>(null);

  const [formData, setFormData] = useState<FormData>({
    shopName: '',
    ownerName: '',
    mobile: '',
    address: '',
    area: '',
    city: '',
    pincode: '',
    latitude: null,
    longitude: null,
    photoUrl: '',
    planType: 'BASIC',
    amount: PRICING_PLANS.BASIC.amount,
    paymentStatus: 'PENDING',
  });

  useEffect(() => {
    // Wait for auth context to load before checking
    if (!authLoading && !isAuthenticated) {
      // Check localStorage as fallback
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('shopper_token') : null;
      if (!storedToken) {
        router.push('/shopper/login');
      }
    }
  }, [isAuthenticated, authLoading, router]);

  // Demo payment is always enabled (no time restriction)
  useEffect(() => {
    setDemoPaymentEnabled(true);
    // Demo payment is permanently available
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories', {
          next: { revalidate: 600 },
        });
        const data = await res.json();
        if (data.success && data.categories) {
          setCategories(data.categories);
          // Set default category if not already set and categories are loaded
          if (!selectedCategory && data.categories.length > 0) {
            setSelectedCategory(data.categories[0].name);
            setFormData(prev => ({ ...prev, category: data.categories[0].name }));
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Don't show error toast for categories - it's not critical
      }
    };
    // Only fetch if authenticated
    if (isAuthenticated || !loading) {
      fetchCategories();
    }
  }, [isAuthenticated, loading]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Get token from context first, then localStorage
    let shopperToken = token;
    if (!shopperToken && typeof window !== 'undefined') {
      shopperToken = localStorage.getItem('shopper_token');
    }
    
    if (!shopperToken) {
      toast.error('Please login to upload images');
      setTimeout(() => {
        router.push('/shopper/login');
      }, 1000);
      return;
    }
    
    // Verify token is not empty
    if (shopperToken.trim() === '') {
      toast.error('Invalid authentication token. Please login again.');
      setTimeout(() => {
        router.push('/shopper/login');
      }, 1000);
      return;
    }

    const uploadFormData = new FormData(); // Renamed to avoid conflict with state formData
    uploadFormData.append('file', file);

    setLoading(true);
    const uploadToast = toast.loading('Uploading image...');

    try {
      // Ensure token is properly formatted
      const authHeader = `Bearer ${shopperToken.trim()}`;
      console.log('Uploading image with token:', authHeader.substring(0, 20) + '...');
      
      const response = await fetch('/api/shopper/upload', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
        },
        body: uploadFormData, // Use renamed variable
      });

      const data = await response.json();
      
      if (!response.ok) {
        toast.dismiss(uploadToast);
        if (response.status === 401) {
          toast.error('Authentication failed. Please login again.');
          router.push('/shopper/login');
          return;
        }
        toast.error(data.error || 'Failed to upload image');
        return;
      }
      
      if (data.success && data.url) {
        // Use functional update to preserve existing formData state
        setFormData((prevFormData) => ({
          ...prevFormData,
          photoUrl: data.url,
        }));
        setImagePreview(data.url);
        toast.dismiss(uploadToast);
        toast.success('Image uploaded successfully');
      } else {
        toast.dismiss(uploadToast);
        toast.error(data.error || 'Failed to upload image');
      }
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.dismiss(uploadToast);
      toast.error(error.message || 'Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        toast.success('Location captured successfully');
      },
      (error) => {
        setLocationError('Failed to get location: ' + error.message);
      }
    );
  };

  const handlePlanSelect = (planType: PlanType) => {
    const plan = PRICING_PLANS[planType];
    if (plan) {
      setFormData({ ...formData, planType, amount: plan.amount });
      setStep(2);
    } else {
      toast.error('Invalid plan selected. Please try again.');
    }
  };

  const handleSubmit = async () => {
    // Validation with trim to check for empty strings
    const trimmedShopName = (formData.shopName || '').trim();
    const trimmedOwnerName = (formData.ownerName || '').trim();
    const trimmedMobile = (formData.mobile || '').trim();
    const trimmedAddress = (formData.address || '').trim();
    const trimmedPincode = (formData.pincode || '').trim();

    if (!trimmedShopName || !trimmedOwnerName || !trimmedMobile || !trimmedAddress || !trimmedPincode) {
      const missingFields = [];
      if (!trimmedShopName) missingFields.push('Shop Name');
      if (!trimmedOwnerName) missingFields.push('Owner Name');
      if (!trimmedMobile) missingFields.push('Mobile Number');
      if (!trimmedAddress) missingFields.push('Address');
      if (!trimmedPincode) missingFields.push('Pincode');
      toast.error(`Please fill: ${missingFields.join(', ')}`);
      return;
    }

    if (!formData.photoUrl || formData.photoUrl.trim() === '') {
      toast.error('Please upload shop image');
      return;
    }

    if (formData.latitude === null || formData.latitude === undefined || 
        formData.longitude === null || formData.longitude === undefined ||
        typeof formData.latitude !== 'number' || typeof formData.longitude !== 'number') {
      toast.error('Please capture location');
      return;
    }

    if (!selectedCategory || selectedCategory.trim() === '') {
      toast.error('Please select a category');
      return;
    }

    // Demo payment check is handled in payment step, not here

    if (formData.paymentStatus === 'PENDING') {
      toast.error('Please complete payment first');
      return;
    }

    setLoading(true);
    setError('');

    // Get token with fallback
    let shopperToken = token;
    if (!shopperToken && typeof window !== 'undefined') {
      shopperToken = localStorage.getItem('shopper_token');
    }

    if (!shopperToken) {
      toast.error('Please login to submit shop registration');
      router.push('/shopper/login');
      return;
    }

    try {
      const requestBody = {
        shopName: trimmedShopName,
        ownerName: trimmedOwnerName,
        mobile: trimmedMobile,
        email: shopper?.email,
        address: trimmedAddress,
        area: (formData.area || '').trim() || undefined,
        city: (formData.city || '').trim() || undefined,
        pincode: trimmedPincode,
        category: selectedCategory.trim(),
        photoUrl: formData.photoUrl.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        planType: formData.planType,
        amount: formData.amount,
        paymentStatus: formData.paymentStatus,
      };

      console.log('📤 Submitting shop registration:', {
        shopName: requestBody.shopName,
        category: requestBody.category,
        paymentStatus: requestBody.paymentStatus,
        hasPhotoUrl: !!requestBody.photoUrl,
        hasLatitude: requestBody.latitude !== null,
        hasLongitude: requestBody.longitude !== null,
      });

      const response = await fetch('/api/shopper/shops/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${shopperToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Registration failed:', data);
        throw new Error(data.error || data.details || 'Failed to register shop');
      }

      if (data.success) {
        toast.success(data.message || 'Shop registered successfully! Awaiting verification.');
        setTimeout(() => {
          router.push('/shopper/dashboard');
        }, 1000);
      }
    } catch (err: any) {
      console.error('❌ Registration error:', err);
      const errorMessage = err.message || 'Failed to register shop';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't redirect during render - useEffect handles this
  // Just return null if not authenticated (useEffect will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Register Your Shop</h1>

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <div className={`w-24 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <div className={`w-24 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Plan Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Choose Your Plan</h2>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Valid Plans:</strong> All plans are valid for 1 year from the date of payment. Choose the plan that best fits your business needs.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  <strong>💡 Note:</strong> All plans include basic shop listing on 8rupiya.com. Higher plans offer more features like additional photos, offers, hosting pages, and premium placements.
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(() => {
                  // Filter plans by specific amounts: 100, 200, 300, 500, 2388, 2999, 4788
                  const allowedAmounts = [100, 200, 300, 500, 2388, 2999, 4788];
                  const allowedPlans = (Object.keys(PRICING_PLANS) as PlanType[]).filter(
                    (planType) => allowedAmounts.includes(PRICING_PLANS[planType].amount)
                  );
                  
                  // Color mapping for each plan card
                  const planColors: Record<PlanType, { bg: string; border: string; text: string; hover: string }> = {
                    BASIC: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', hover: 'hover:border-blue-400' },
                    BOTTOM_RAIL: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', hover: 'hover:border-green-400' },
                    RIGHT_SIDE: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', hover: 'hover:border-purple-400' },
                    HERO: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', hover: 'hover:border-pink-400' },
                    FEATURED: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', hover: 'hover:border-yellow-400' },
                    PREMIUM: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', hover: 'hover:border-indigo-400' },
                    BANNER: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', hover: 'hover:border-orange-400' },
                    LEFT_BAR: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', hover: 'hover:border-gray-400' },
                  };

                  return allowedPlans.map((planType) => {
                    const plan = PRICING_PLANS[planType];
                    const colors = planColors[planType] || planColors.BASIC;
                    const isSelected = formData.planType === planType;
                    
                    return (
                      <div
                        key={planType}
                        onClick={() => handlePlanSelect(planType)}
                        className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                          isSelected
                            ? `${colors.bg} ${colors.border} shadow-md border-4`
                            : `bg-white ${colors.border} ${colors.hover}`
                        }`}
                      >
                        <h3 className={`text-xl font-bold mb-2 ${isSelected ? colors.text : 'text-gray-900'}`}>{plan.name}</h3>
                        <p className={`text-3xl font-bold mb-4 ${isSelected ? colors.text : 'text-gray-800'}`}>
                          ₹{plan.amount}<span className="text-sm font-normal text-gray-500">/year</span>
                        </p>
                      <div className="mt-4">
                        <ul className="space-y-1.5 text-sm text-gray-700">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-green-600 mr-2 mt-0.5">✓</span>
                              <span className="flex-1">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        {plan.maxPhotos > 1 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                            📸 {plan.maxPhotos} Photos | {plan.maxOffers > 0 ? `🎁 ${plan.maxOffers} Offers` : 'No Offers'} | {plan.hostingPages > 0 ? `🌐 ${plan.hostingPages} Hosting Pages` : 'No Hosting'}
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  });
                })()}
              </div>
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>✅ All plans are valid for 1 year</strong> from the date of payment. Your shop will be listed on 8rupiya.com after admin verification.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Shop Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Shop Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Shop Name *
                  </label>
                  <input
                    type="text"
                    value={formData.shopName || ''}
                    onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Owner Name *
                  </label>
                  <input
                    type="text"
                    value={formData.ownerName || ''}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile || ''}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Address *
                  </label>
                  <textarea
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Area
                  </label>
                  <input
                    type="text"
                    value={formData.area || ''}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    value={formData.pincode || ''}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Shop Image *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  {imagePreview && (
                    <div className="mt-4">
                      <Image
                        src={imagePreview}
                        alt="Shop preview"
                        width={200}
                        height={200}
                        className="rounded-lg object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Location (Latitude, Longitude) *
                  </label>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                  >
                    📍 Get Current Location
                  </button>
                  {locationError && (
                    <p className="text-red-600 text-sm mt-2">{locationError}</p>
                  )}
                  {formData.latitude !== null && formData.latitude !== undefined && 
                   formData.longitude !== null && formData.longitude !== undefined && 
                   typeof formData.latitude === 'number' && typeof formData.longitude === 'number' && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Latitude:</strong> {formData.latitude.toFixed(6)}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Longitude:</strong> {formData.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (() => {
            // Ensure planType is valid, default to BASIC if not
            const validPlanType = (formData.planType && PRICING_PLANS[formData.planType as PlanType]) 
              ? formData.planType as PlanType 
              : 'BASIC' as PlanType;
            const currentPlan = PRICING_PLANS[validPlanType];
            
            // Check if required shop details are filled
            // If payment is already PAID (via demo payment), allow proceeding
            const hasRequiredDetails = formData.paymentStatus === 'PAID' || 
              (formData.shopName && formData.ownerName && formData.mobile && formData.address && formData.pincode);
            
            return (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Payment</h2>
              <p className="text-gray-600">
                Plan: <strong>{currentPlan.name}</strong> - ₹{currentPlan.amount}
              </p>

              {!hasRequiredDetails && formData.paymentStatus !== 'PAID' && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <h3 className="font-semibold text-yellow-800 mb-1">Shop Details Required</h3>
                      <p className="text-sm text-yellow-700 mb-3">
                        Please go back and fill in all required shop details (Shop Name, Owner Name, Mobile Number, Address, Pincode) before proceeding with payment.
                      </p>
                      <button
                        onClick={() => setStep(2)}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
                      >
                        ← Go Back to Shop Details
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Demo Payment Option - Always Available */}
              {demoPaymentEnabled && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-300 rounded-xl p-6 mb-6">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🧪</div>
                    <h3 className="text-xl font-bold text-blue-800 mb-2">Demo Payment Available</h3>
                    <p className="text-blue-700 mb-4">
                      Demo payment option is available for testing. Click below to simulate payment completion.
                    </p>
                    <button
                      onClick={() => {
                        setFormData({ ...formData, paymentStatus: 'PAID' });
                        toast.success('Demo payment successful! You can now submit your shop.');
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      💳 Complete Demo Payment
                    </button>
                    <p className="text-xs text-blue-600 mt-3">
                      ⚠️ This is a demo payment for testing purposes only.
                    </p>
                  </div>
                </div>
              )}

              {/* Regular Razorpay Payment - Always Enabled */}
              {formData.paymentStatus !== 'PAID' ? (
                <AgentRazorpayQRPayment
                  shopName={formData.shopName.trim() || 'Shop'}
                  ownerName={formData.ownerName.trim() || ''}
                  mobile={formData.mobile.trim() || ''}
                  email={shopper?.email}
                  planType={validPlanType}
                  amount={formData.amount || currentPlan.amount}
                  onPaymentSuccess={() => {
                    setFormData({ ...formData, paymentStatus: 'PAID' });
                    toast.success('Payment successful! You can now submit your shop.');
                  }}
                />
              ) : (
                <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-2">✅</div>
                  <h3 className="text-lg font-bold text-green-800 mb-2">Payment Completed</h3>
                  <p className="text-green-700">Your payment has been successfully processed. You can now submit your shop for verification.</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || formData.paymentStatus === 'PENDING'}
                  className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </div>
            </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

