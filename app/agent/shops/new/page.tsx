'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AgentRouteGuard from '@/app/components/AgentRouteGuard';
import Image from 'next/image';
import { PRICING_PLANS, PlanType } from '@/app/utils/pricing';
import SEOModal from '@/app/components/SEOModal';
import RazorpayPayment from '@/app/components/RazorpayPayment';
import toast from 'react-hot-toast';

interface FormData {
  // Step 1
  shopName: string;
  ownerName: string;
  mobile: string;
  email: string;
  category: string;
  pincode: string;
  area: string;
  address: string;
  // Step 2
  photoUrl: string; // Main photo (required)
  additionalPhotos: string[]; // Additional photos (optional, max 9 more = total 10)
  // Step 3
  latitude: number | null;
  longitude: number | null;
  paymentStatus: 'PAID' | 'PENDING';
  paymentMode: 'CASH' | 'UPI' | 'NONE';
  receiptNo: string;
  amount: number;
  planType: 'BASIC' | 'PREMIUM' | 'FEATURED' | 'LEFT_BAR' | 'RIGHT_SIDE' | 'BOTTOM_RAIL' | 'BANNER' | 'HERO';
  paymentScreenshot?: string;
  sendSmsReceipt: boolean;
}

export default function AddNewShopPage() {
  const router = useRouter();
  
  // OTP Disabled for 3 days - Automatically calculates 3 days from today
  const today = new Date();
  const OTP_DISABLE_END_DATE = new Date(today);
  OTP_DISABLE_END_DATE.setDate(today.getDate() + 3); // 3 days from today
  OTP_DISABLE_END_DATE.setHours(23, 59, 59, 999); // End of day
  const isOTPDisabled = new Date() <= OTP_DISABLE_END_DATE;
  
  const [step, setStep] = useState(1); // Step 1: Plan Selection (pehle plan select karo)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [locationError, setLocationError] = useState('');
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [emailOTP, setEmailOTP] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(isOTPDisabled); // Auto-verify if OTP is disabled
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showSEOModal, setShowSEOModal] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    shopName: '',
    ownerName: '',
    mobile: '',
    email: '',
    category: '',
    pincode: '',
    area: '',
    address: '',
    photoUrl: '', // Main photo (required)
    additionalPhotos: [], // Additional photos (optional, max 9 more = total 10)
    latitude: null,
    longitude: null,
    paymentStatus: 'PENDING',
    paymentMode: 'NONE',
    receiptNo: '',
    amount: 100,
    planType: 'BASIC', // Default plan, lekin pehle step mein select karna hoga
    sendSmsReceipt: false,
  });
  
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);

  const [categories, setCategories] = useState<Array<{ _id: string; name: string; slug: string }>>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch categories from admin
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success && data.categories) {
          setCategories(data.categories);
        } else {
          // Fallback to default categories if API fails
          setCategories([
            { _id: '1', name: 'Grocery', slug: 'grocery' },
            { _id: '2', name: 'Clothes', slug: 'clothes' },
            { _id: '3', name: 'Electronics', slug: 'electronics' },
            { _id: '4', name: 'Restaurant', slug: 'restaurant' },
            { _id: '5', name: 'Medical', slug: 'medical' },
            { _id: '6', name: 'Others', slug: 'others' },
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Fallback to default categories
        setCategories([
          { _id: '1', name: 'Grocery', slug: 'grocery' },
          { _id: '2', name: 'Clothes', slug: 'clothes' },
          { _id: '3', name: 'Electronics', slug: 'electronics' },
          { _id: '4', name: 'Restaurant', slug: 'restaurant' },
          { _id: '5', name: 'Medical', slug: 'medical' },
          { _id: '6', name: 'Others', slug: 'others' },
        ]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Step 1: Plan Selection (pehle plan select karo)
  const handleStep1Next = () => {
    if (!formData.planType) {
      setError('Please select a plan');
      return;
    }
    setError('');
    setStep(2); // Ab Step 2: Basic Info
  };

  // Send OTP to email
  const handleSendOTP = async () => {
    if (!formData.email) {
      setError('Please enter email address');
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setSendingOTP(true);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          type: 'email-verification',
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        const text = await response.text();
        throw new Error(`Server returned invalid response: ${text.substring(0, 200)}`);
      }

      if (!response.ok) {
        // Handle HTTP errors
        const errorMessage = data?.error || data?.details || `Server error (${response.status})`;
        console.error('OTP API Error:', {
          status: response.status,
          error: data?.error,
          details: data?.details,
          fullResponse: data
        });
        throw new Error(errorMessage);
      }

      if (data.success) {
        setOtpSent(true);
        setIsEmailVerified(false);
        setEmailOTP('');
        toast.success('OTP sent to your email!');
      } else {
        throw new Error(data.error || 'Failed to send OTP');
      }
    } catch (err: any) {
      console.error('OTP send error:', err);
      let errorMessage = err.message || 'Failed to send OTP.';
      
      // Provide more helpful error messages
      if (errorMessage.includes('Email service not configured')) {
        errorMessage = 'Email service is not configured. Please contact administrator.';
      } else if (errorMessage.includes('Failed to send OTP email')) {
        errorMessage = 'Failed to send email. Please check email configuration or try again later.';
      } else if (errorMessage.includes('500') || errorMessage.includes('Internal server error')) {
        errorMessage = 'Server error occurred. Please check server logs or try again later.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSendingOTP(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (!emailOTP || emailOTP.length !== 6) {
      setError('Please enter 6-digit OTP');
      return;
    }

    setError('');
    setVerifyingOTP(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          otp: emailOTP,
          type: 'email-verification',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsEmailVerified(true);
        toast.success('Email verified successfully!');
      } else {
        throw new Error(data.error || 'Invalid OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
      toast.error(err.message || 'Invalid OTP');
    } finally {
      setVerifyingOTP(false);
    }
  };

  // Step 2: Basic Info
  const handleStep2Next = () => {
    // Area is now optional - removed from required fields
    if (!formData.shopName || !formData.ownerName || !formData.mobile || !formData.email || !formData.category || !formData.pincode || !formData.address) {
      setError('Please fill all required fields');
      return;
    }
    // Skip OTP verification if disabled
    if (!isOTPDisabled && !isEmailVerified) {
      setError('Please verify your email address with OTP');
      return;
    }
    setError('');
    setStep(3); // Ab Step 3: Photo Upload
  };

  // Compress and resize image: 1200x800px, WebP format, max 200KB
  const compressImage = (file: File, targetWidth: number = 1200, targetHeight: number = 800, maxSizeKB: number = 200): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Calculate scaling to fill 1200x800 while maintaining aspect ratio (crop if needed)
          const imgAspect = img.width / img.height;
          const targetAspect = targetWidth / targetHeight;
          
          let drawWidth = targetWidth;
          let drawHeight = targetHeight;
          let drawX = 0;
          let drawY = 0;

          if (imgAspect > targetAspect) {
            // Image is wider - fit height and crop width
            drawHeight = targetHeight;
            drawWidth = img.width * (targetHeight / img.height);
            drawX = (targetWidth - drawWidth) / 2;
          } else {
            // Image is taller - fit width and crop height
            drawWidth = targetWidth;
            drawHeight = img.height * (targetWidth / img.width);
            drawY = (targetHeight - drawHeight) / 2;
          }

          // Fill background with white (optional, can be transparent)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetWidth, targetHeight);

          // Draw image centered
          ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

          // Try to compress to WebP format, reducing quality if needed
          const tryCompress = (quality: number): void => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Failed to compress image'));
                  return;
                }

                const sizeInKB = blob.size / 1024;
                if (sizeInKB > maxSizeKB && quality > 0.1) {
                  // Reduce quality and try again
                  tryCompress(quality - 0.05);
                } else {
                  // Create a new File object with WebP format
                  const fileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
                  const compressedFile = new File([blob], fileName, {
                    type: 'image/webp',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                }
              },
              'image/webp', // Always convert to WebP
              quality
            );
          };

          // Start with quality 0.85 (85%)
          tryCompress(0.85);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  // Main Photo Upload
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Plan-based validation: BASIC plan mein sirf 1 photo allowed
    const currentPlan = PRICING_PLANS[formData.planType];
    if (currentPlan.maxPhotos === 1 && formData.photoUrl) {
      setError(`This plan (${currentPlan.name}) allows only 1 photo. Please remove existing photo first or upgrade plan.`);
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Always compress and resize image: 1200x800px, WebP format, max 200KB
      setError('Processing image (resizing to 1200x800px, converting to WebP)...');
      const fileToUpload = await compressImage(file, 1200, 800, 200);
      setError(''); // Clear compression message

      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(fileToUpload);

      // Upload
      const uploadFormData = new FormData();
      uploadFormData.append('file', fileToUpload);

      const token = localStorage.getItem('agent_token');
      const uploadResponse = await fetch('/api/agent/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      const uploadData = await uploadResponse.json();
      if (uploadData.success) {
        setFormData({ ...formData, photoUrl: uploadData.photoUrl });
        toast.success('Main photo uploaded successfully!');
      } else {
        throw new Error(uploadData.error || 'Upload failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
      toast.error(err.message || 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  // Additional Photos Upload (for plans with maxPhotos > 1)
  const handleAdditionalImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentPlan = PRICING_PLANS[formData.planType];
    
    // Only allow for plans with maxPhotos > 1
    if (currentPlan.maxPhotos <= 1) {
      setError('Additional photos are only available for plans with multiple photo uploads.');
      return;
    }

    // Check total photos limit (1 main + remaining additional)
    const maxAdditionalPhotos = currentPlan.maxPhotos - 1;
    const remainingSlots = maxAdditionalPhotos - formData.additionalPhotos.length;
    if (files.length > remainingSlots) {
      setError(`You can only add ${remainingSlots} more photo(s). Maximum ${currentPlan.maxPhotos} photos allowed (1 main + ${maxAdditionalPhotos} additional).`);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`);
        }
        // Always compress and resize image: 1200x800px, WebP format, max 200KB
        const fileToUpload = await compressImage(file, 1200, 800, 200);

        const uploadFormData = new FormData();
        uploadFormData.append('file', fileToUpload);

        const token = localStorage.getItem('agent_token');
        const uploadResponse = await fetch('/api/agent/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: uploadFormData,
        });

        const uploadData = await uploadResponse.json();
        if (!uploadData.success) {
          throw new Error(uploadData.error || `Failed to upload ${file.name}`);
        }

        return uploadData.photoUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const newAdditionalPhotos = [...formData.additionalPhotos, ...uploadedUrls];
      
      // Create previews
      const newPreviews = await Promise.all(
        Array.from(files).map((file) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        })
      );

      setFormData({ ...formData, additionalPhotos: newAdditionalPhotos });
      setAdditionalImagePreviews([...additionalImagePreviews, ...newPreviews]);
      toast.success(`${uploadedUrls.length} additional photo(s) uploaded successfully!`);
    } catch (err: any) {
      setError(err.message || 'Failed to upload additional images');
      toast.error(err.message || 'Failed to upload additional images');
    } finally {
      setLoading(false);
      // Reset input
      e.target.value = '';
    }
  };

  // Remove additional photo
  const handleRemoveAdditionalPhoto = (index: number) => {
    const newPhotos = formData.additionalPhotos.filter((_, i) => i !== index);
    const newPreviews = additionalImagePreviews.filter((_, i) => i !== index);
    setFormData({ ...formData, additionalPhotos: newPhotos });
    setAdditionalImagePreviews(newPreviews);
    toast.success('Photo removed');
  };

  // Step 3: Photo Upload
  const handleStep3Next = () => {
    if (!formData.photoUrl) {
      setError('Please upload a shop photo');
      return;
    }
    setError('');
    setStep(4); // Ab Step 4: Location & Payment
  };

  // Step 3: Location & Payment
  const handleCaptureLocation = () => {
    setLocationError('');
    setLoading(true);

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser. Please enter coordinates manually.');
      setLoading(false);
      return;
    }

    // Check if we're on a secure origin (HTTPS or localhost)
    const isSecureOrigin = window.location.protocol === 'https:' || 
                          window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname === '[::1]';
    
    if (!isSecureOrigin) {
      setLocationError('Location capture requires HTTPS or localhost. Please access the site via https:// or use localhost instead of IP address.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationError('');
        setLoading(false);
      },
      (error) => {
        let errorMessage = 'Failed to get location. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location permission denied. Please allow location access or enter coordinates manually.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information unavailable. Please enter coordinates manually.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again or enter coordinates manually.';
            break;
          default:
            if (error.message.includes('secure origins')) {
              errorMessage = 'Location capture requires HTTPS or localhost. Please access the site via https:// or use localhost instead of IP address.';
            } else {
              errorMessage += error.message || 'Unknown error occurred. Please try again.';
            }
        }
        
        setLocationError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const handleSubmit = async () => {
    // Trim all fields first for validation
    // Ensure area is always a string (handle null/undefined)
    // IMPORTANT: Get area value directly from formData, don't use optional chaining that might return undefined
    const areaValue = formData.area ? String(formData.area) : '';
    const trimmedShopName = (formData.shopName || '').trim();
    const trimmedOwnerName = (formData.ownerName || '').trim();
    const trimmedMobile = (formData.mobile || '').trim();
    const trimmedEmail = (formData.email || '').trim();
    const trimmedCategory = (formData.category || '').trim();
    const trimmedPincode = (formData.pincode || '').trim();
    const trimmedArea = areaValue.trim(); // Trim the area value
    const trimmedAddress = (formData.address || '').trim();
    const trimmedPhotoUrl = (formData.photoUrl || '').trim();

    // Validate all required fields before submission (Area is now optional)
    if (!trimmedShopName || !trimmedOwnerName || !trimmedMobile || 
        !trimmedEmail || !trimmedCategory || !trimmedPincode || 
        !trimmedAddress || !trimmedPhotoUrl) {
      // Show specific error for missing fields
      let missingFields = [];
      if (!trimmedShopName) missingFields.push('Shop Name');
      if (!trimmedOwnerName) missingFields.push('Owner Name');
      if (!trimmedMobile) missingFields.push('Mobile');
      if (!trimmedEmail) missingFields.push('Email');
      if (!trimmedCategory) missingFields.push('Category');
      if (!trimmedPincode) missingFields.push('Pincode');
      // Area is optional - removed from required fields
      if (!trimmedAddress) missingFields.push('Address');
      if (!trimmedPhotoUrl) missingFields.push('Photo');
      
      const errorMsg = `Please fill all required fields: ${missingFields.join(', ')}`;
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (formData.latitude === null || formData.longitude === null) {
      setError('Please capture location');
      return;
    }

    if (formData.paymentStatus === 'PAID' && !formData.receiptNo) {
      // Auto-generate receipt number
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      formData.receiptNo = `REC${timestamp}${random}`.slice(0, 10);
    }

    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('agent_token');
      
      // Prepare data with trimmed values - area is now optional
      const submitData = {
        shopName: trimmedShopName,
        ownerName: trimmedOwnerName,
        mobile: trimmedMobile,
        email: trimmedEmail,
        category: trimmedCategory,
        pincode: trimmedPincode,
        area: trimmedArea, // Explicitly set area - CRITICAL - must be non-empty at this point
        address: trimmedAddress,
        photoUrl: trimmedPhotoUrl,
        // Include other formData fields
        additionalPhotos: formData.additionalPhotos || [],
        latitude: formData.latitude,
        longitude: formData.longitude,
        paymentStatus: formData.paymentStatus,
        paymentMode: formData.paymentMode,
        receiptNo: formData.receiptNo,
        amount: formData.amount,
        planType: formData.planType,
        paymentScreenshot: formData.paymentScreenshot,
        sendSmsReceipt: formData.sendSmsReceipt,
      };
      
      // Log what we're sending (area is optional)
      console.log('📤 Sending shop data:', {
        shopName: submitData.shopName,
        area: submitData.area || '(Optional - not provided)',
        photoUrl: submitData.photoUrl ? '✅ Present' : '❌ Missing',
        latitude: submitData.latitude,
        longitude: submitData.longitude,
      });
      
      const response = await fetch('/api/agent/shops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      // Check if response is ok
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `Server error (HTTP ${response.status})`;
        
        // Clone the response to read it twice
        const responseClone = response.clone();
        const responseText = await responseClone.text();
        console.error('📥 Raw response body:', responseText);
        
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            console.error('Shop creation error:', errorData);
            console.error('Error status:', response.status);
            console.error('Error data keys:', Object.keys(errorData));
            
            // Handle empty object or extract error message
            if (Object.keys(errorData).length === 0) {
              errorMessage = `Server error (HTTP ${response.status}): Empty error response`;
            } else {
              // Extract error message from various possible fields
              const errorMsg = errorData.details || errorData.error || errorData.message;
              if (errorMsg) {
                // Make error message more user-friendly
                if (errorData.field) {
                  const fieldName = errorData.field.charAt(0).toUpperCase() + errorData.field.slice(1);
                  errorMessage = `${fieldName} field is required. Please fill in the ${fieldName} field and try again.`;
                } else {
                  errorMessage = errorMsg;
                }
              } else {
                // If no standard error field, show the whole object
                errorMessage = `Validation error: ${JSON.stringify(errorData)}`;
              }
            }
          } else {
            const text = await response.text();
            if (text && text.trim().length > 0) {
              console.error('Non-JSON error response:', text.substring(0, 200));
              // Try to parse as JSON even if content-type says otherwise
              try {
                const parsed = JSON.parse(text);
                errorMessage = parsed.error || parsed.details || errorMessage;
              } catch {
                errorMessage = `Server error (HTTP ${response.status}): ${text.substring(0, 100)}`;
              }
            } else {
              errorMessage = `Server error (HTTP ${response.status}): Empty response`;
            }
          }
        } catch (parseError: any) {
          console.error('Error parsing error response:', parseError);
          errorMessage = `Server error (HTTP ${response.status}): Failed to parse error response`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (data.success) {
        // Success - show success screen
        router.push(`/agent/shops/new/success?id=${data.shop._id}`);
      } else {
        throw new Error(data.error || 'Failed to create shop');
      }
    } catch (err: any) {
      console.error('Shop submission error:', err);
      setError(err.message || 'Failed to submit shop. Please check all fields and try again.');
      toast.error(err.message || 'Failed to submit shop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AgentRouteGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-blue-600 text-white shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="text-white hover:text-blue-200"
              >
                ← Back
              </button>
              <h1 className="text-xl font-bold">Add New Shop</h1>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-xs ${
                    step >= s ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {s}
                </div>
                {s < 4 && (
                  <div
                    className={`w-12 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-300'}`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Plan Selection (Pehle Plan Select Karo) */}
          {step === 1 && (
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Select Plan (योजना चुनें)</h2>
              <p className="text-gray-600 text-sm">Pehle apna plan select karein, phir shop details fill karein</p>

              {/* Plan Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Plan <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.planType}
                  onChange={(e) => {
                    const selectedPlan = e.target.value as PlanType;
                    const planDetails = PRICING_PLANS[selectedPlan];
                    
                    // Plan change par automatically features set karo
                    setFormData({ 
                      ...formData, 
                      planType: selectedPlan,
                      amount: planDetails.amount,
                    });
                    
                    // Plan ke hisab se info show karo
                    toast.success(`${planDetails.name} selected!`);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg"
                  required
                >
                  <option value="BASIC">Basic Plan - ₹100/year (1 Photo)</option>
                  <option value="LEFT_BAR">Left Bar Plan - ₹100/year (1 slot, 1 Photo)</option>
                  <option value="BOTTOM_RAIL">Bottom Rail Plan - ₹200/year (1 big size slot, 1 Photo)</option>
                  <option value="RIGHT_SIDE">Right Side Plan - ₹300/year (3x size slot, 1 Photo + SEO)</option>
                  <option value="HERO">Hero Plan - ₹500/year (Hero Section, 3 Photos + SEO)</option>
                  <option value="FEATURED">Featured Plan - ₹2388/year (8 Photos + 4 Offers + 1 Page Hosting)</option>
                  <option value="PREMIUM">Premium Plan - ₹2999/year (12 Photos + 8 Offers + 2 Page Hosting)</option>
                  <option value="BANNER">Banner Plan - ₹4788/year (20 Photos + 10 Offers + 3 Page Hosting)</option>
                </select>
                
                {/* Plan Features Preview */}
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-2">
                    {PRICING_PLANS[formData.planType].name} Features:
                  </p>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>✓ Price: ₹{formData.amount}/year</li>
                    <li>✓ Photos: {PRICING_PLANS[formData.planType].maxPhotos} photo{PRICING_PLANS[formData.planType].maxPhotos > 1 ? 's' : ''}</li>
                    {PRICING_PLANS[formData.planType].maxOffers > 0 && <li>✓ Offers Card: {PRICING_PLANS[formData.planType].maxOffers}</li>}
                    {PRICING_PLANS[formData.planType].hasHosting && <li>✓ Page Hosting: {PRICING_PLANS[formData.planType].hostingPages} page{PRICING_PLANS[formData.planType].hostingPages > 1 ? 's' : ''}</li>}
                    {PRICING_PLANS[formData.planType].hasSEO && <li>✓ SEO Configuration</li>}
                    {PRICING_PLANS[formData.planType].hasOffers && <li>✓ Offers/Discount Section</li>}
                    {PRICING_PLANS[formData.planType].hasWhatsApp && <li>✓ WhatsApp Button</li>}
                    {PRICING_PLANS[formData.planType].hasLogo && <li>✓ Shop Logo</li>}
                    <li>✓ Priority Rank: {PRICING_PLANS[formData.planType].priorityRank}</li>
                    {PRICING_PLANS[formData.planType].canBeHomePageBanner && <li>✓ Homepage Banner</li>}
                    {PRICING_PLANS[formData.planType].canBeTopSlider && <li>✓ Top Slider</li>}
                    {PRICING_PLANS[formData.planType].canBeLeftBar && <li>✓ Left Sidebar</li>}
                    {PRICING_PLANS[formData.planType].canBeRightBar && <li>✓ Right Sidebar</li>}
                    {PRICING_PLANS[formData.planType].canBeHero && <li>✓ Hero Section</li>}
                  </ul>
                </div>
              </div>

              <button
                onClick={handleStep1Next}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Next: Fill Shop Details
              </button>
            </div>
          )}

          {/* Step 2: Basic Info */}
          {step === 2 && (
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                  {PRICING_PLANS[formData.planType].name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shop Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter shop name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter owner name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter mobile number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email ID <span className="text-red-500">*</span>
                  {isEmailVerified && (
                    <span className="ml-2 text-green-600 text-xs">✓ Verified</span>
                  )}
                  {isOTPDisabled && (
                    <span className="ml-2 text-orange-600 text-xs">(OTP Temporarily Disabled)</span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      // Only reset verification if OTP is enabled
                      if (!isOTPDisabled) {
                        setIsEmailVerified(false);
                        setOtpSent(false);
                        setEmailOTP('');
                      }
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                    disabled={!isOTPDisabled && isEmailVerified}
                    required
                  />
                  {!isOTPDisabled && !isEmailVerified && (
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={sendingOTP || !formData.email}
                      className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {sendingOTP ? 'Sending...' : 'Send OTP'}
                    </button>
                  )}
                </div>
                {isOTPDisabled && (
                  <p className="mt-2 text-sm text-orange-600">
                    ⚠️ Email OTP verification is temporarily disabled. You can proceed without verification.
                  </p>
                )}
                {!isOTPDisabled && otpSent && !isEmailVerified && (
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={emailOTP}
                        onChange={(e) => setEmailOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOTP}
                        disabled={verifyingOTP || emailOTP.length !== 6}
                        className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {verifyingOTP ? 'Verifying...' : 'Verify OTP'}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={sendingOTP}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Resend OTP
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                {loadingCategories ? (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-500">Loading categories...</span>
                  </div>
                ) : (
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter 6-digit pincode"
                  maxLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => {
                    setFormData({ ...formData, area: e.target.value });
                    // Clear error when user starts typing
                    if (error && error.includes('Area')) {
                      setError('');
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter area/locality (e.g., Kankarbagh, Patna) - Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full address"
                  rows={3}
                  required
                />
              </div>

              {/* SEO Button */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    // Area is optional - removed from required fields
                    if (!formData.shopName || !formData.category || !formData.pincode || !formData.email) {
                      toast.error('Please fill all required fields before adding SEO');
                      return;
                    }
                    // Skip OTP verification if disabled
                    if (!isOTPDisabled && !isEmailVerified) {
                      toast.error('Please verify your email address before adding SEO');
                      return;
                    }
                    setShowSEOModal(true);
                  }}
                  disabled={!formData.shopName || !formData.category || !formData.pincode || !formData.email || (!isOTPDisabled && !isEmailVerified)}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span>🔍</span>
                  <span>Add SEO</span>
                </button>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Add SEO entry to improve search visibility (Shop Name, Category, Pincode, Email)
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleStep2Next}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Next: Upload Photo
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Shop Photo */}
          {step === 3 && (
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Shop Photo</h2>
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                  {PRICING_PLANS[formData.planType].name}
                </div>
              </div>

              {/* Plan-based Photo Limit Info */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Current Plan:</strong> {PRICING_PLANS[formData.planType].name} - 
                  {PRICING_PLANS[formData.planType].maxPhotos === 1 
                    ? ' 1 photo allowed' 
                    : ` Maximum ${PRICING_PLANS[formData.planType].maxPhotos} photos allowed`}
                </p>
                {PRICING_PLANS[formData.planType].maxPhotos > 1 && (
                  <p className="text-xs text-blue-600 mt-1">
                    ✓ You can upload 1 main photo + up to {PRICING_PLANS[formData.planType].maxPhotos - 1} additional photos (total {PRICING_PLANS[formData.planType].maxPhotos})
                  </p>
                )}
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                {imagePreview ? (
                  <div className="space-y-4">
                    <div className="relative w-full max-w-md mx-auto h-64">
                      <Image
                        src={imagePreview}
                        alt="Shop preview"
                        fill
                        className="object-contain rounded-lg"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setImagePreview(null);
                        setFormData({ ...formData, photoUrl: '' });
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove Photo
                    </button>
                    {PRICING_PLANS[formData.planType].maxPhotos > 1 && (
                      <p className="text-sm text-green-600">
                        ✓ Main photo uploaded. You can add up to {PRICING_PLANS[formData.planType].maxPhotos - 1} more photos below.
                      </p>
                    )}
                  </div>
                ) : (
                      <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-gray-700 font-semibold mb-2">Upload Shop Photo (Required)</p>
                      <p className="text-gray-500 text-sm mb-4">Maximum size: 3MB</p>
                          {PRICING_PLANS[formData.planType].maxPhotos === 1 && (
                        <p className="text-xs text-orange-600 mb-4">
                              ⚠️ This plan allows only 1 photo
                            </p>
                          )}
                    </div>
                    
                    {/* Two Options: Camera and File Upload */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Camera Option */}
                      <label className="cursor-pointer">
                        <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 hover:bg-blue-50 transition-colors">
                          <div className="space-y-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                              <span className="text-2xl">📷</span>
                            </div>
                            <div>
                              <p className="text-gray-700 font-semibold text-sm">Camera</p>
                              <p className="text-gray-500 text-xs mt-1">Take Photo</p>
                            </div>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        capture="environment"
                      />
                    </label>

                      {/* File Upload Option */}
                      <label className="cursor-pointer">
                        <div className="border-2 border-dashed border-green-300 rounded-lg p-6 hover:bg-green-50 transition-colors">
                          <div className="space-y-3">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                              <span className="text-2xl">📁</span>
                            </div>
                            <div>
                              <p className="text-gray-700 font-semibold text-sm">Gallery</p>
                              <p className="text-gray-500 text-xs mt-1">Upload Image</p>
                            </div>
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Photos Section (for plans with maxPhotos > 1) */}
              {PRICING_PLANS[formData.planType].maxPhotos > 1 && formData.photoUrl && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Additional Photos (Optional)</h3>
                    <span className="text-sm text-gray-600">
                      {formData.additionalPhotos.length}/{PRICING_PLANS[formData.planType].maxPhotos - 1} additional photos
                    </span>
                  </div>
                  
                  {/* Additional Photos Grid */}
                  {additionalImagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {additionalImagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                            <Image
                              src={preview}
                              alt={`Additional photo ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <button
                            onClick={() => handleRemoveAdditionalPhoto(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add More Photos Button */}
                  {formData.additionalPhotos.length < (PRICING_PLANS[formData.planType].maxPhotos - 1) && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <label className="cursor-pointer">
                        <div className="space-y-2">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                            <span className="text-2xl">➕</span>
                          </div>
                          <div>
                            <p className="text-gray-700 font-semibold text-sm">Add More Photos</p>
                            <p className="text-gray-500 text-xs mt-1">
                              You can add {(PRICING_PLANS[formData.planType].maxPhotos - 1) - formData.additionalPhotos.length} more photo(s)
                            </p>
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleAdditionalImageSelect}
                          className="hidden"
                          disabled={loading}
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleStep3Next}
                  disabled={!formData.photoUrl || loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Next: Location & Payment
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Location & Payment */}
          {step === 4 && (
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Location & Payment</h2>
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                  {PRICING_PLANS[formData.planType].name}
                </div>
              </div>

              {/* Shop Details Summary */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Shop Details Summary</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Shop Name:</span>
                    <span className="ml-2 font-medium text-gray-900">{formData.shopName || 'Not filled'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Owner:</span>
                    <span className="ml-2 font-medium text-gray-900">{formData.ownerName || 'Not filled'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Category:</span>
                    <span className="ml-2 font-medium text-gray-900">{formData.category || 'Not filled'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Pincode:</span>
                    <span className="ml-2 font-medium text-gray-900">{formData.pincode || 'Not filled'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Area:</span>
                    <span className={`ml-2 font-medium ${formData.area?.trim() ? 'text-gray-900' : 'text-gray-500'}`}>
                      {formData.area?.trim() || '(Optional - Not filled)'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Address:</span>
                    <span className={`ml-2 font-medium ${formData.address?.trim() ? 'text-gray-900' : 'text-red-600'}`}>
                      {formData.address?.trim() || 'Not filled'}
                    </span>
                  </div>
                </div>
                {!formData.address?.trim() && (
                  <button
                    onClick={() => setStep(2)}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    ← Go back to Step 2 to fill missing fields
                  </button>
                )}
              </div>

              {/* Location Capture */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleCaptureLocation}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Capturing...' : 'Capture Current Location'}
                </button>
                {locationError && (
                  <p className="text-red-600 text-sm mt-2">{locationError}</p>
                )}
                {formData.latitude !== null && formData.longitude !== null && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Latitude:</strong> {formData.latitude.toFixed(6)}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Longitude:</strong> {formData.longitude.toFixed(6)}
                    </p>
                    <p className="text-xs text-green-600 mt-2">✓ Location captured successfully</p>
                  </div>
                )}
              </div>

              {/* Plan Info Display (Read-only, already selected in Step 1) */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Selected Plan: {PRICING_PLANS[formData.planType].name}
                </p>
                <p className="text-xs text-blue-700">
                  Amount: ₹{formData.amount}/year
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Change Plan
                </button>
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status
                </label>
                <div className="flex gap-4">
                  <label className="flex-1">
                    <input
                      type="radio"
                      value="PAID"
                      checked={formData.paymentStatus === 'PAID'}
                      onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as 'PAID' | 'PENDING' })}
                      className="mr-2"
                    />
                    Paid (₹{formData.amount})
                  </label>
                  <label className="flex-1">
                    <input
                      type="radio"
                      value="PENDING"
                      checked={formData.paymentStatus === 'PENDING'}
                      onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as 'PAID' | 'PENDING' })}
                      className="mr-2"
                    />
                    Pending
                  </label>
                </div>
              </div>

              {/* Payment Mode Selection */}
              {formData.paymentStatus === 'PAID' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Mode
                    </label>
                    <select
                      value={formData.paymentMode}
                      onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as 'CASH' | 'UPI' | 'NONE' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="NONE">None</option>
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI (Online Payment)</option>
                    </select>
                  </div>

                  {/* Online Payment via Razorpay for UPI Mode */}
                  {formData.paymentMode === 'UPI' && (
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        💳 Pay Online via Razorpay
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Secure online payment via UPI, Cards, Net Banking, or Wallets
                      </p>
                      {formData.ownerName && formData.mobile ? (
                        <RazorpayPayment
                          shopId="" // Empty for new shop - API will handle this
                          planType={formData.planType}
                          customerName={formData.ownerName}
                          customerEmail={formData.email}
                          customerPhone={formData.mobile}
                          userType="agent"
                          agentId={(() => {
                            // Get agentId from token
                            if (typeof window !== 'undefined') {
                              try {
                                const token = localStorage.getItem('agent_token');
                                if (token) {
                                  const payload = JSON.parse(atob(token.split('.')[1]));
                                  return payload.agentId;
                                }
                              } catch (e) {
                                console.error('Failed to get agentId from token:', e);
                              }
                            }
                            return undefined;
                          })()}
                          onSuccess={(response) => {
                            // Payment successful, update form data
                            setFormData({ 
                              ...formData, 
                              paymentStatus: 'PAID',
                              paymentMode: 'UPI'
                            });
                            toast.success('✅ Payment successful! You can now submit the shop.');
                          }}
                          onError={(error) => {
                            console.error('Payment error:', error);
                            // Don't block the form, just show error
                          }}
                          buttonText={`💳 Pay ₹${formData.amount} Securely`}
                          buttonClassName="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-lg hover:shadow-xl"
                        />
                      ) : (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            Please fill in Owner Name and Mobile Number in Step 2 to proceed with online payment.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => {
                        const amount = parseFloat(e.target.value) || 0;
                        const minAmount = PRICING_PLANS[formData.planType].amount;
                        setFormData({ 
                          ...formData, 
                          amount: amount >= minAmount ? amount : minAmount 
                        });
                      }}
                      min={PRICING_PLANS[formData.planType].amount}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={`Minimum ₹${PRICING_PLANS[formData.planType].amount}/year`}
                    />
                    <p className="text-xs text-gray-500 mt-1">All plans are yearly (365 days validity)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Receipt No (Auto-generated if empty)
                    </label>
                    <input
                      type="text"
                      value={formData.receiptNo}
                      onChange={(e) => setFormData({ ...formData, receiptNo: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Leave empty to auto-generate"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.sendSmsReceipt}
                    onChange={(e) => setFormData({ ...formData, sendSmsReceipt: e.target.checked })}
                    className="mr-2"
                  />
                  Send SMS Receipt
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || formData.latitude === null || formData.longitude === null}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Shop'}
                </button>
              </div>
            </div>
          )}
        </main>

        {/* SEO Modal */}
        <SEOModal
          isOpen={showSEOModal}
          onClose={() => setShowSEOModal(false)}
          shopName={formData.shopName}
          area={formData.area}
          category={formData.category}
          pincode={formData.pincode}
          email={formData.email}
          onSave={(seoData) => {
            console.log('SEO saved:', seoData);
            // SEO data is already saved via API, just close modal
          }}
        />
      </div>
    </AgentRouteGuard>
  );
}
