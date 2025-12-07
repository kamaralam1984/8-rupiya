'use client';

import { useState } from 'react';
import { useUserLocation } from '../hooks/useUserLocation';
import type { UserLocation } from '../types';

export default function LocationBanner() {
  const { location, isLoading, error, refreshLocation, setManualLocation } = useUserLocation();
  const [showManualForm, setShowManualForm] = useState(false);
  const [formData, setFormData] = useState({
    city: '',
    state: '',
    pincode: '',
    area: '',
  });

  // Manual location form submit karna
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Agar pincode hai to usse lat/lng estimate karo (optional - ya to API call karo ya default use karo)
    // Simple approach: Patna ke center coordinates use karo agar pincode se match nahi karta
    const defaultLat = 25.5941; // Patna center
    const defaultLng = 85.1376;

    setManualLocation({
      lat: defaultLat,
      lng: defaultLng,
      city: formData.city || 'Patna',
      state: formData.state || 'Bihar',
      pincode: formData.pincode || undefined,
      fullAddress: `${formData.area ? formData.area + ', ' : ''}${formData.city}, ${formData.state}${formData.pincode ? ' - ' + formData.pincode : ''}`,
    });

    setShowManualForm(false);
    setFormData({ city: '', state: '', pincode: '', area: '' });
  };

  // Location detect karne ke liye button click
  const handleDetectLocation = () => {
    refreshLocation();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <p className="text-sm text-blue-700">Detecting your location...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state - manual form dikhao
  if (error && !location) {
    return (
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          {!showManualForm ? (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-yellow-800">{error}</p>
              </div>
              <button
                onClick={() => setShowManualForm(true)}
                className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Set Location Manually
              </button>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-yellow-900">Enter Your Location</h3>
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="text-yellow-700 hover:text-yellow-900"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="px-3 py-2 border border-yellow-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
                <input
                  type="text"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="px-3 py-2 border border-yellow-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Pincode (optional)"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  maxLength={6}
                  className="px-3 py-2 border border-yellow-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <input
                  type="text"
                  placeholder="Area/Locality (optional)"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="px-3 py-2 border border-yellow-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Save Location
                </button>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  className="px-4 py-2 bg-white border border-yellow-300 text-yellow-700 text-sm font-medium rounded-lg hover:bg-yellow-50 transition-colors"
                >
                  Try GPS Again
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Location set hai - display karo
  if (location) {
    return (
      <div className="bg-green-50 border-b border-green-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-900">
                Your current location: <span className="font-semibold">{location.city}</span>
                {location.pincode && <span>, PIN {location.pincode}</span>}
                {location.state && <span>, {location.state}</span>}
              </p>
              {location.fullAddress && (
                <p className="text-xs text-green-700 mt-0.5">{location.fullAddress}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowManualForm(true)}
              className="px-3 py-1.5 text-sm font-medium text-green-700 hover:text-green-900 hover:bg-green-100 rounded-lg transition-colors"
            >
              Change Location
            </button>
            <button
              onClick={handleDetectLocation}
              className="px-3 py-1.5 text-sm font-medium text-green-700 hover:text-green-900 hover:bg-green-100 rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Manual form modal (agar location set hai par user change karna chahta hai) */}
        {showManualForm && (
          <div className="mt-3 pt-3 border-t border-green-200">
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-green-900">Change Your Location</h3>
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="text-green-700 hover:text-green-900"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="px-3 py-2 border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <input
                  type="text"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="px-3 py-2 border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Pincode (optional)"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  maxLength={6}
                  className="px-3 py-2 border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="text"
                  placeholder="Area/Locality (optional)"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="px-3 py-2 border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save Location
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="px-4 py-2 bg-white border border-green-300 text-green-700 text-sm font-medium rounded-lg hover:bg-green-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // No location - show set location button
  return (
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <p className="text-sm text-gray-700">Set your location to see nearby shops</p>
        <button
          onClick={() => setShowManualForm(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Set Location
        </button>
      </div>
    </div>
  );
}

