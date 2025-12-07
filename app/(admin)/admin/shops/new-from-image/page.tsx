'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import Image from 'next/image';

/**
 * Multi-step form for creating a shop from an image with GPS data
 * 
 * Step 1: Basic Details (shopName, ownerName, category)
 * Step 2: Upload Image & Extract Location
 * Step 3: Confirm & Save
 */
export default function NewShopFromImagePage() {
  const { token } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Basic Details
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');

  // Step 2: Image Upload & Location
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<{
    latitude: number;
    longitude: number;
    fullAddress: string;
    area: string;
    city: string;
    pincode: string;
    photoUrl: string;
  } | null>(null);
  const [overlayText, setOverlayText] = useState(''); // For manual coordinate extraction

  // Editable location fields (pre-filled from extraction)
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');

  // Step 3: Mobile (optional)
  const [mobile, setMobile] = useState('');

  const categories = ['Grocery', 'Clothes', 'Electronics', 'Restaurant', 'Medical', 'Other'];

  // Helper function to parse coordinates and address from text (like image overlay text)
  const parseCoordinatesFromText = (text: string): { 
    latitude: number; 
    longitude: number; 
    address?: string;
    pincode?: string;
  } | null => {
    try {
      let lat: number | null = null;
      let lon: number | null = null;
      let address: string | undefined;
      let pincode: string | undefined;

      // Pattern 1: "Lat 25.593994° Long 85.106053°" or "Lat 25.593994 Long 85.106053"
      const pattern1 = /Lat[itude:]*\s*([+-]?\d+\.?\d*)[°\s]*Long[itude:]*\s*([+-]?\d+\.?\d*)[°]?/i;
      let match = text.match(pattern1);
      if (match) {
        lat = parseFloat(match[1]);
        lon = parseFloat(match[2]);
        if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
          // Extract pincode first (6 digits) - usually at the end
          const pincodeMatch = text.match(/\b(\d{6})\b/);
          if (pincodeMatch) {
            pincode = pincodeMatch[1];
          }

          // Extract full address - look for lines with multiple commas (address format)
          // Split by newlines and find the longest line with commas that's not coordinates or date
          const lines = text.split(/\n|\r/).filter(line => {
            const trimmed = line.trim();
            return trimmed.includes(',') && 
                   trimmed.length > 30 && // Addresses are usually longer
                   !trimmed.match(/Lat|Long|GPS|Thursday|Monday|Tuesday|Wednesday|Friday|Saturday|Sunday|GMT|\d{1,2}\/\d{1,2}\/\d{4}/i) &&
                   trimmed.split(',').length >= 4; // Should have multiple address parts
          });
          
          if (lines.length > 0) {
            // Use the longest line as it's likely the full address
            address = lines.sort((a, b) => b.length - a.length)[0].trim();
            
            // Clean up address - remove extra spaces
            address = address.replace(/\s+/g, ' ').trim();
          } else {
            // Fallback: try to extract address pattern from entire text
            // Pattern: "34, Ali Imam Path, H4v4+gig, Harding Rd, Rajbansi Nagar, Patna, Bihar 800014, India"
            const addressPattern = /([A-Za-z0-9\s,]+(?:Road|Rd|Street|St|Path|Lane|Ln|Nagar|Colony|Area|Locality)[A-Za-z0-9\s,]+(?:India|Bihar|Patna)[A-Za-z0-9\s,]*)/i;
            const addressMatch = text.match(addressPattern);
            if (addressMatch) {
              address = addressMatch[1].trim();
            }
          }

          return { latitude: lat, longitude: lon, address, pincode };
        }
      }

      // Pattern 2: "25.593994, 85.106053" or "25.593994,85.106053"
      const pattern2 = /([+-]?\d+\.\d+)[,\s]+([+-]?\d+\.\d+)/;
      match = text.match(pattern2);
      if (match) {
        lat = parseFloat(match[1]);
        lon = parseFloat(match[2]);
        // Check if values are in valid GPS range
        if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
          // For India, typical coordinates are around 8-37°N and 68-97°E
          if (lat > 0 && lat < 40 && lon > 0 && lon < 100) {
            // Extract pincode first
            const pincodeMatch = text.match(/\b(\d{6})\b/);
            if (pincodeMatch) {
              pincode = pincodeMatch[1];
            }

            // Extract full address - look for lines with multiple commas
            const lines = text.split(/\n|\r/).filter(line => {
              const trimmed = line.trim();
              return trimmed.includes(',') && 
                     trimmed.length > 30 &&
                     !trimmed.match(/Lat|Long|GPS|Thursday|Monday|Tuesday|Wednesday|Friday|Saturday|Sunday|GMT|\d{1,2}\/\d{1,2}\/\d{4}/i) &&
                     trimmed.split(',').length >= 4;
            });
            
            if (lines.length > 0) {
              address = lines.sort((a, b) => b.length - a.length)[0].trim();
              address = address.replace(/\s+/g, ' ').trim();
            } else {
              // Fallback pattern
              const addressPattern = /([A-Za-z0-9\s,]+(?:Road|Rd|Street|St|Path|Lane|Ln|Nagar|Colony|Area|Locality)[A-Za-z0-9\s,]+(?:India|Bihar|Patna)[A-Za-z0-9\s,]*)/i;
              const addressMatch = text.match(addressPattern);
              if (addressMatch) {
                address = addressMatch[1].trim();
              }
            }

            return { latitude: lat, longitude: lon, address, pincode };
          }
          // If first is smaller, might be lon,lat - swap them
          if (lat < lon && lat > 0 && lat < 100 && lon > 0 && lon < 40) {
            return { latitude: lon, longitude: lat, address, pincode };
          }
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  // Handle image selection - automatically extract data
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Automatically extract location data when image is selected
      toast('Image selected! Extracting location data...', { icon: '⏳', duration: 2000 });
      setLoading(true);
      
      try {
        const formData = new FormData();
        formData.append('image', file);

        const res = await fetch('/api/admin/shops/extract-meta', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await res.json();

        // Handle Cloudinary upload errors
        if (!data.success && data.error) {
          if (data.error.includes('Cloudinary') || data.error.includes('upload')) {
            toast.error(data.error, {
              duration: 7000,
              icon: '⚠️',
            });
            
            if (data.error.includes('credentials') || data.error.includes('configure')) {
              toast(
                'Please check your .env.local file and ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set correctly.',
                { duration: 10000, icon: '💡' }
              );
            }
          } else {
            toast.error(data.error || 'Failed to extract location data');
          }
          setLoading(false);
          return;
        }

        // Handle case where GPS is not found but image was uploaded
        if (!data.success && data.allowManualEntry && data.photoUrl) {
          toast('Image uploaded! GPS data not found in EXIF. Please enter location manually from the image overlay.', {
            icon: 'ℹ️',
            duration: 5000,
          });
          // Set photoUrl but allow manual entry
          setExtractedData({
            latitude: 0,
            longitude: 0,
            fullAddress: '',
            area: '',
            city: '',
            pincode: '',
            photoUrl: data.photoUrl,
          });
          // Clear location fields for manual entry
          setLatitude('');
          setLongitude('');
          setFullAddress('');
          setArea('');
          setCity('');
          setPincode('');
          setLoading(false);
          return;
        }

        if (!data.success) {
          toast.error(data.error || 'Failed to extract location data');
          setLoading(false);
          return;
        }

        // Success! Auto-fill all location fields
        setExtractedData(data);
        setLatitude(data.latitude?.toString() || '');
        setLongitude(data.longitude?.toString() || '');
        setFullAddress(data.fullAddress || '');
        setArea(data.area || '');
        setCity(data.city || '');
        setPincode(data.pincode || '');

        toast.success('Location data extracted successfully! All fields auto-filled.', {
          icon: '✅',
          duration: 3000,
        });
      } catch (error: any) {
        console.error('Error extracting location:', error);
        toast.error('Failed to extract location data. Please try manually.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Step 1: Validate and proceed to Step 2
  const handleStep1Next = () => {
    if (!shopName.trim()) {
      toast.error('Shop name is required');
      return;
    }
    if (!ownerName.trim()) {
      toast.error('Owner name is required');
      return;
    }
    const finalCategory = category === 'Other' ? customCategory.trim() : category;
    if (!finalCategory) {
      toast.error('Category is required');
      return;
    }
    setStep(2);
  };

  // Step 2: Extract location from image
  const handleExtractLocation = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const res = await fetch('/api/admin/shops/extract-meta', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      // Handle Cloudinary upload errors
      if (!data.success && data.error) {
        // Check if error message contains Cloudinary-related info
        if (data.error.includes('Cloudinary') || data.error.includes('upload')) {
          toast.error(data.error, {
            duration: 7000,
            icon: '⚠️',
          });
          
          // If it's a configuration error, show helpful message
          if (data.error.includes('credentials') || data.error.includes('configure')) {
            toast(
              'Please check your .env.local file and ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set correctly.',
              { duration: 10000, icon: '💡' }
            );
          }
        } else {
          toast.error(data.error || 'Failed to extract location data');
        }
        
        setLoading(false);
        return;
      }

      // Handle case where GPS is not found but image was uploaded
      if (!data.success && data.allowManualEntry && data.photoUrl) {
        toast('Image uploaded! GPS data not found in EXIF. Please enter location manually from the image overlay.', {
          icon: 'ℹ️',
          duration: 5000,
        });
        // Set photoUrl but allow manual entry
        setExtractedData({
          latitude: 0,
          longitude: 0,
          fullAddress: '',
          area: '',
          city: '',
          pincode: '',
          photoUrl: data.photoUrl,
        });
        // Clear location fields for manual entry
        setLatitude('');
        setLongitude('');
        setFullAddress('');
        setArea('');
        setCity('');
        setPincode('');
        setLoading(false);
        return;
      }

      if (!data.success) {
        toast.error(data.error || 'Failed to extract location data');
        setLoading(false);
        return;
      }

      // Set extracted data (GPS found successfully)
      setExtractedData(data);
      setLatitude(data.latitude?.toString() || '');
      setLongitude(data.longitude?.toString() || '');
      setFullAddress(data.fullAddress || '');
      setArea(data.area || '');
      setCity(data.city || '');
      setPincode(data.pincode || '');

      toast.success('Location extracted successfully!');
    } catch (error: any) {
      console.error('Error extracting location:', error);
      toast.error('Failed to extract location data');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Proceed to Step 3
  const handleStep2Next = () => {
    // Check if image is uploaded (either via extraction or manual)
    const hasImage = extractedData?.photoUrl || imagePreview;
    if (!hasImage) {
      toast.error('Please upload an image first');
      return;
    }
    
    // If GPS was extracted, use those values; otherwise require manual entry
    if (!extractedData?.photoUrl) {
      // Manual entry case - need to upload image first or use extracted photoUrl
      if (!imagePreview) {
        toast.error('Please extract location from image or upload image first');
        return;
      }
    }
    
    if (!latitude || !longitude) {
      toast.error('Latitude and longitude are required. Please enter them manually from the image overlay.');
      return;
    }
    
    // Validate coordinates
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      toast.error('Please enter valid latitude (-90 to 90) and longitude (-180 to 180) values');
      return;
    }
    
    if (!fullAddress.trim()) {
      toast.error('Full address is required');
      return;
    }
    
    // If we have image preview but no extractedData with photoUrl, we still allow proceeding
    // The image will be uploaded when saving (or user needs to click extract first)
    setStep(3);
  };

  // Step 3: Save shop
  const handleSaveShop = async () => {
    if (!shopName.trim() || !ownerName.trim()) {
      toast.error('Shop name and owner name are required');
      return;
    }

    const finalCategory = category === 'Other' ? customCategory.trim() : category;
    if (!finalCategory) {
      toast.error('Category is required');
      return;
    }

    // Ensure we have a photo URL (either from extraction or need to upload)
    let finalPhotoUrl = extractedData?.photoUrl;
    
    // If we have image preview but no photoUrl, we need to upload it first
    if (imagePreview && !finalPhotoUrl && selectedImage) {
      toast('Uploading image...', { icon: '⏳' });
      try {
        const formData = new FormData();
        formData.append('image', selectedImage);
        
        const uploadRes = await fetch('/api/admin/shops/extract-meta', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        
        const uploadData = await uploadRes.json();
        if (uploadData.photoUrl) {
          finalPhotoUrl = uploadData.photoUrl;
        } else {
          toast.error('Failed to upload image');
          setLoading(false);
          return;
        }
      } catch (uploadError) {
        toast.error('Failed to upload image');
        setLoading(false);
        return;
      }
    }
    
    if (!finalPhotoUrl) {
      toast.error('Photo URL is missing. Please upload an image first.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/shops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shopName: shopName.trim(),
          ownerName: ownerName.trim(),
          category: finalCategory,
          mobile: mobile.trim() || undefined,
          area: area.trim() || undefined,
          fullAddress: fullAddress.trim(),
          city: city.trim() || undefined,
          pincode: pincode.trim() || undefined,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          photoUrl: finalPhotoUrl || extractedData?.photoUrl,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || 'Failed to create shop');
        setLoading(false);
        return;
      }

      toast.success('New shop created successfully from image!');
      router.push(`/admin/shops`);
    } catch (error: any) {
      console.error('Error creating shop:', error);
      toast.error('Failed to create shop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">New Shop from Image</h1>
          <p className="text-gray-600">Create a shop by uploading an image with GPS data</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > s ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Basic Details</span>
            <span>Upload & Extract</span>
            <span>Confirm & Save</span>
          </div>
        </div>

        {/* Step 1: Basic Details */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Basic Details</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shop Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter owner name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {category === 'Other' && (
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter custom category"
                    required
                  />
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleStep1Next}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Upload Image & Extract Location */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload Image & Extract Location</h2>
            <p className="text-gray-600 mb-6">
              Select an image with GPS data - Location coordinates and address will be automatically extracted and filled in!
            </p>

            <div className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shop Photo (with GPS data) <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  📸 Select an image - Location data will be extracted automatically!
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {loading && (
                  <div className="mt-3 flex items-center gap-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Extracting location data from image...</span>
                  </div>
                )}
                {imagePreview && (
                  <div className="mt-4">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      width={400}
                      height={300}
                      className="rounded-md border border-gray-300"
                    />
                  </div>
                )}
              </div>

              {/* Re-extract Location Button (Optional) */}
              {imagePreview && extractedData?.photoUrl && (
                <div>
                  <button
                    onClick={handleExtractLocation}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Re-extracting...' : '🔄 Re-extract Location & Address'}
                  </button>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Use this if you want to re-extract location data
                  </p>
                </div>
              )}

              {/* Helper: Extract from Overlay Text */}
              {imagePreview && (!extractedData?.latitude || extractedData.latitude === 0) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-blue-900">
                    📋 Extract Coordinates from Image Overlay
                  </h4>
                  <p className="text-xs text-blue-700">
                    If GPS data is visible in the image overlay (like "Lat 25.593994° Long 85.106053°"), 
                    paste the text here to auto-extract coordinates:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={overlayText}
                      onChange={(e) => setOverlayText(e.target.value)}
                      placeholder='Paste overlay text, e.g., "Lat 25.593994° Long 85.106053°"'
                      className="flex-1 px-3 py-2 text-sm border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => {
                        const coords = parseCoordinatesFromText(overlayText);
                        if (coords) {
                          setLatitude(coords.latitude.toString());
                          setLongitude(coords.longitude.toString());
                          
                          // Use address from overlay text if available (more accurate)
                          if (coords.address) {
                            setFullAddress(coords.address);
                            toast.success('Coordinates and address extracted from overlay!', { icon: '✅' });
                            
                            // Extract area, city, and pincode from address
                            const addressParts = coords.address.split(',').map(part => part.trim());
                            
                            // Extract pincode (6 digits) - usually in format "Bihar 800014" or just "800014"
                            if (coords.pincode) {
                              setPincode(coords.pincode);
                            } else {
                              // Try to find pincode in address parts
                              const pincodePart = addressParts.find(part => /\b\d{6}\b/.test(part));
                              if (pincodePart) {
                                const pincodeMatch = pincodePart.match(/\b(\d{6})\b/);
                                if (pincodeMatch) {
                                  setPincode(pincodeMatch[1]);
                                }
                              }
                            }
                            
                            // Extract city - usually contains "Patna" or is before state
                            const cityPart = addressParts.find(part => 
                              part.toLowerCase().includes('patna') || 
                              part.toLowerCase().includes('city')
                            );
                            if (cityPart) {
                              setCity(cityPart.replace(/\d{6}/g, '').trim()); // Remove pincode if present
                            } else if (addressParts.length > 2) {
                              // City is usually 2nd or 3rd from last (before state)
                              const cityIndex = addressParts.length - 2;
                              if (cityIndex > 0) {
                                setCity(addressParts[cityIndex]?.replace(/\d{6}/g, '').trim() || '');
                              }
                            }
                            
                            // Extract area - usually contains "Nagar", "Colony", "Road", "Path" etc.
                            const areaPart = addressParts.find(part => 
                              part.toLowerCase().includes('nagar') ||
                              part.toLowerCase().includes('colony') ||
                              part.toLowerCase().includes('road') ||
                              part.toLowerCase().includes('rd') ||
                              part.toLowerCase().includes('path') ||
                              part.toLowerCase().includes('street') ||
                              part.toLowerCase().includes('area')
                            );
                            if (areaPart) {
                              setArea(areaPart.replace(/\d{6}/g, '').trim());
                            } else if (addressParts.length > 3) {
                              // Area is usually 3rd or 4th part
                              const areaIndex = addressParts.length - 4;
                              if (areaIndex >= 0 && areaIndex < addressParts.length) {
                                setArea(addressParts[areaIndex]?.replace(/\d{6}/g, '').trim() || '');
                              }
                            }
                            
                            // Still fetch additional details from reverse geocoding as fallback
                            fetch(
                              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1`,
                              {
                                headers: { 'User-Agent': 'DigitalIndiaShopDirectory/1.0' },
                              }
                            )
                              .then((res) => res.json())
                              .then((geoData) => {
                                const addrParts = geoData.address || {};
                                // Only update if we don't have better data
                                if (!coords.address || coords.address.length < 20) {
                                  setFullAddress(geoData.display_name || coords.address || '');
                                }
                                if (!area) {
                                  setArea(addrParts.suburb || addrParts.neighbourhood || addrParts.locality || '');
                                }
                                if (!city) {
                                  setCity(addrParts.city || addrParts.town || '');
                                }
                                if (!coords.pincode) {
                                  setPincode(addrParts.postcode || '');
                                }
                              })
                              .catch(() => {
                                // Ignore error, we already have address from overlay
                              });
                          } else {
                            // No address in overlay, fetch from reverse geocoding
                            toast.success('Coordinates extracted! Now fetching address...', { icon: '✅' });
                            fetch(
                              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1`,
                              {
                                headers: { 'User-Agent': 'DigitalIndiaShopDirectory/1.0' },
                              }
                            )
                              .then((res) => res.json())
                              .then((geoData) => {
                                const addrParts = geoData.address || {};
                                setFullAddress(geoData.display_name || '');
                                setArea(addrParts.suburb || addrParts.neighbourhood || addrParts.locality || '');
                                setCity(addrParts.city || addrParts.town || '');
                                setPincode(addrParts.postcode || '');
                                toast.success('Address fetched successfully!', { icon: '✅' });
                              })
                              .catch(() => {
                                toast.error('Failed to fetch address. Please enter manually.');
                              });
                          }
                        } else {
                          toast.error('Could not find coordinates in the text. Please check the format.');
                        }
                      }}
                      disabled={!overlayText.trim()}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Extract
                    </button>
                  </div>
                </div>
              )}

              {/* Location Fields (editable) - Show if image is uploaded */}
              {(extractedData || imagePreview) && (
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Location Details
                    {!extractedData?.photoUrl && (
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        (Enter manually from image overlay)
                      </span>
                    )}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Latitude <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Longitude <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={fullAddress}
                      onChange={(e) => setFullAddress(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Area</label>
                      <input
                        type="text"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        maxLength={6}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleStep2Next}
                disabled={(!extractedData?.photoUrl && !imagePreview) || loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm & Save */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Confirm & Save</h2>

            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Shop Details</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Shop Name</p>
                    <p className="font-medium text-gray-900">{shopName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Owner Name</p>
                    <p className="font-medium text-gray-900">{ownerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-medium text-gray-900">
                      {category === 'Other' ? customCategory : category}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Mobile</p>
                    <input
                      type="text"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full mt-1 px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Location</h4>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Address:</span> {fullAddress}
                    </p>
                    {area && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Area:</span> {area}
                      </p>
                    )}
                    {city && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">City:</span> {city}
                      </p>
                    )}
                    {pincode && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Pincode:</span> {pincode}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Coordinates:</span> {latitude}, {longitude}
                    </p>
                  </div>
                </div>

                {extractedData && extractedData.photoUrl && (
                  <div className="border-t pt-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Photo</h4>
                    <Image
                      src={extractedData.photoUrl}
                      alt="Shop photo"
                      width={400}
                      height={300}
                      className="rounded-md border border-gray-300"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSaveShop}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Shop'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

