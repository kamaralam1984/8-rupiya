'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * Interface for upload response when GPS is found
 */
interface UploadResponseWithGPS {
  success: true;
  gpsFound: true;
  imageUrl: string;
  imagePublicId: string;
  imageBufferBase64: string;
  latitude: number;
  longitude: number;
  area: string;
  address: string;
}

/**
 * Interface for upload response when GPS is NOT found
 */
interface UploadResponseWithoutGPS {
  success: true;
  gpsFound: false;
  imageUrl: string;
  imagePublicId: string;
  imageBufferBase64: string;
}

type UploadResponse = UploadResponseWithGPS | UploadResponseWithoutGPS;

/**
 * Admin page for creating a new shop
 * 
 * Two-step process:
 * 1. Upload image (with EXIF GPS extraction)
 * 2. Fill shop details form (pre-filled with location if GPS found)
 */
export default function NewShopPage() {
  const { token } = useAuth();
  const router = useRouter();

  // Step 1: Image Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);

  // Step 2: Shop Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    latitude: '',
    longitude: '',
    area: '',
    address: '',
  });
  const [creating, setCreating] = useState(false);

  /**
   * Handle file selection
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null); // Reset previous upload result
    }
  };

  /**
   * Step 1: Upload image to API
   * Sends multipart/form-data to /api/admin/upload-shop-image
   */
  const handleImageUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    if (!token) {
      toast.error('Authentication required');
      router.push('/login');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/admin/upload-shop-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload image');
      }

      setUploadResult(data as UploadResponse);

      // Pre-fill form if GPS was found
      if (data.gpsFound) {
        setFormData({
          name: '',
          category: '',
          latitude: data.latitude.toString(),
          longitude: data.longitude.toString(),
          area: data.area || '',
          address: data.address || '',
        });
        toast.success('Image uploaded! GPS location detected and pre-filled.');
      } else {
        toast.success('Image uploaded! Please enter location manually.');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  /**
   * Step 2: Create shop
   * Sends POST request to /api/admin/shops
   */
  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadResult) {
      toast.error('Please upload an image first');
      return;
    }

    if (!formData.name || !formData.category) {
      toast.error('Shop name and category are required');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      toast.error('Latitude and longitude are required');
      return;
    }

    if (!token) {
      toast.error('Authentication required');
      router.push('/login');
      return;
    }

    setCreating(true);

    try {
      const response = await fetch('/api/admin/shops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          imageUrl: uploadResult.imageUrl,
          iconUrl: uploadResult.imageUrl, // Use same as imageUrl for now
          imagePublicId: uploadResult.imagePublicId,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          area: formData.area || undefined,
          address: formData.address || undefined,
          imageDataBase64: uploadResult.imageBufferBase64,
          iconDataBase64: uploadResult.imageBufferBase64, // Use same for now
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create shop');
      }

      toast.success('Shop created successfully!');
      
      // Optionally redirect to shops list
      setTimeout(() => {
        router.push('/admin/shops');
      }, 1500);
    } catch (error: any) {
      console.error('Create shop error:', error);
      toast.error(error.message || 'Failed to create shop');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Shop</h1>

        {/* Step 1: Image Upload Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Step 1: Upload Shop Image</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={uploading}
              />
            </div>

            <button
              type="button"
              onClick={handleImageUpload}
              disabled={!selectedFile || uploading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>

            {/* Image Preview and Location Info */}
            {uploadResult && (
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Image Preview:</h3>
                  <img
                    src={uploadResult.imageUrl}
                    alt="Uploaded shop"
                    className="w-full max-w-md h-48 object-cover rounded-md border border-gray-200"
                  />
                </div>

                {uploadResult.gpsFound && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <h3 className="text-sm font-semibold text-green-800 mb-2">
                      ✓ GPS Location Detected
                    </h3>
                    <div className="text-sm text-green-700 space-y-1">
                      <p><strong>Latitude:</strong> {uploadResult.latitude}</p>
                      <p><strong>Longitude:</strong> {uploadResult.longitude}</p>
                      <p><strong>Area:</strong> {uploadResult.area}</p>
                      <p><strong>Address:</strong> {uploadResult.address}</p>
                    </div>
                  </div>
                )}

                {!uploadResult.gpsFound && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <p className="text-sm text-yellow-800">
                      ⚠ No GPS data found in image. Please enter location manually in the form below.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Shop Form Card (only show after upload success) */}
        {uploadResult && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Step 2: Shop Details</h2>
            
            <form onSubmit={handleCreateShop} className="space-y-4">
              {/* Shop Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shop Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter shop name"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Restaurant, Retail, Service"
                />
              </div>

              {/* Latitude */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 25.5941"
                />
              </div>

              {/* Longitude */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 85.1376"
                />
              </div>

              {/* Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area
                </label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Patna, Bihar"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Full address"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? 'Creating Shop...' : 'Create Shop'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}



