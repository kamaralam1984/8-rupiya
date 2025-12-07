'use client';

/**
 * Example: How to use LocationBanner component in your Next.js pages
 * 
 * This is just an example file showing usage.
 * You can import and use LocationBanner in any page like this.
 */

import LocationBanner from '../components/LocationBanner';
import { useUserLocation } from '../hooks/useUserLocation';

export default function LocationExample() {
  // Hook use karke location data access karo (optional - agar banner se alag data chahiye)
  const { location, isLoading, error, refreshLocation } = useUserLocation();

  return (
    <div className="min-h-screen">
      {/* LocationBanner component ko page ke top par add karo */}
      <LocationBanner />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Location Example Page</h1>

        {/* Example: Location data ko directly use karo */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Location Data</h2>
          
          {isLoading ? (
            <p className="text-gray-600">Loading location...</p>
          ) : error ? (
            <p className="text-red-600">Error: {error}</p>
          ) : location ? (
            <div className="space-y-2">
              <p><strong>City:</strong> {location.city}</p>
              <p><strong>State:</strong> {location.state}</p>
              {location.pincode && <p><strong>Pincode:</strong> {location.pincode}</p>}
              <p><strong>Coordinates:</strong> {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
              {location.fullAddress && <p><strong>Address:</strong> {location.fullAddress}</p>}
              <p><strong>Source:</strong> {location.source}</p>
            </div>
          ) : (
            <p className="text-gray-600">No location set</p>
          )}

          <button
            onClick={refreshLocation}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Location
          </button>
        </div>

        {/* Your other page content here */}
        <div className="bg-gray-50 rounded-lg p-6">
          <p className="text-gray-700">
            This is an example page showing how to use the LocationBanner component
            and the useUserLocation hook.
          </p>
        </div>
      </main>
    </div>
  );
}

/**
 * USAGE INSTRUCTIONS:
 * 
 * 1. Simple Usage (just show the banner):
 *    - Import LocationBanner in your page
 *    - Add <LocationBanner /> at the top of your page
 * 
 * 2. Advanced Usage (access location data):
 *    - Use the useUserLocation hook to get location data
 *    - Use location data in your components
 * 
 * 3. Example in app/page.tsx:
 * 
 *    import LocationBanner from './components/LocationBanner';
 *    
 *    export default function Home() {
 *      return (
 *        <div>
 *          <LocationBanner />
 *          // Rest of your page content
 *        </div>
 *      );
 *    }
 */

