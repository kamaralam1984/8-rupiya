'use client';

import { useState, useEffect } from 'react';
import { useSearch } from '../../contexts/SearchContext';
import { useLocation } from '../../contexts/LocationContext';

/**
 * QuickSearch Component
 * 
 * Provides Pincode and Category search dropdowns on homepage.
 * 
 * DATA FLOW - Pincode/Category Search:
 * 1. User selects Pincode or Category
 * 2. QuickSearch updates SearchContext
 * 3. HeroSection detects search is active
 * 4. HeroSection calls /api/search with filters
 * 5. Filtered shops displayed with distance
 * 
 * DATA FLOW - Current Location (Like Page Load):
 * 1. User clicks "📍 Use Current Location"
 * 2. Browser Geolocation API detects coordinates
 * 3. QuickSearch updates LocationContext with new coords
 * 4. QuickSearch CLEARS SearchContext (no filters)
 * 5. HeroSection detects location change (location.id changed)
 * 6. HeroSection re-fetches like fresh page load
 * 7. ALL nearby shops shown (Hero, Left, Right, Bottom)
 * 8. Distance calculated from current location
 * 9. Shops sorted by distance (nearest first)
 * 
 * BEHAVIOR COMPARISON:
 * 
 * Page Load:
 * ├─ LocationContext: Default or detected location
 * ├─ SearchContext: Empty (no filters)
 * ├─ Result: All shop types displayed by plan
 * └─ Distance: From default/detected location
 * 
 * Current Location Button:
 * ├─ LocationContext: NEW detected coordinates + unique ID
 * ├─ SearchContext: CLEARED (empty)
 * ├─ Result: Same as page load - all shop types
 * └─ Distance: From newly detected location
 * 
 * Pincode/Category Search:
 * ├─ LocationContext: Existing location (for distance)
 * ├─ SearchContext: Has filters (pincode/category)
 * ├─ Result: Filtered shops matching criteria
 * └─ Distance: From existing location
 * 
 * DATABASE SOURCE:
 * - All shop data from AgentShop collection ONLY
 * - Model: AgentShop (lib/models/AgentShop.ts)
 * - Collection: agentshops (MongoDB)
 */
export default function QuickSearch() {
  const { setSearchParams } = useSearch();
  const { location, setLocation } = useLocation();
  const [pincode, setPincode] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [pincodes, setPincodes] = useState<string[]>([]);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Fetch search options
  useEffect(() => {
    const fetchSearchOptions = async () => {
      try {
        const [searchOptionsRes, categoriesRes] = await Promise.all([
          fetch('/api/shops/search-options'),
          fetch('/api/categories'),
        ]);

        const searchOptionsData = await searchOptionsRes.json();
        const categoriesData = await categoriesRes.json();

        if (searchOptionsData.success) {
          setPincodes(searchOptionsData.pincodes || []);
          if (searchOptionsData.categories && searchOptionsData.categories.length > 0) {
            setCategories(searchOptionsData.categories);
          } else if (categoriesData.success && categoriesData.categories) {
            setCategories(categoriesData.categories.map((cat: any) => cat.displayName || cat.name || cat.slug));
          }
        } else if (categoriesData.success && categoriesData.categories) {
          setCategories(categoriesData.categories.map((cat: any) => cat.displayName || cat.name || cat.slug));
        }
      } catch (error) {
        console.error('Error fetching search options:', error);
      }
    };
    fetchSearchOptions();
  }, []);

  // Detect current location and get pincode
  const handleCurrentLocation = async () => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      alert('❌ Geolocation is not supported by your browser. Please use a modern browser like Chrome, Firefox, or Safari.');
      return;
    }

    // Check if page is secure (HTTPS or localhost)
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    if (!isSecure) {
      console.warn('⚠️ Geolocation requires HTTPS or localhost');
    }

    setIsDetectingLocation(true);
    console.log('🌍 Detecting current location...');
    console.log('📱 Browser:', navigator.userAgent);
    console.log('🔒 Secure context:', isSecure);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('✅ Location detected successfully:', { latitude, longitude });
        
        try {
          // Update location context with new coordinates
          setLocation({
            id: `location-${Date.now()}`,
            city: 'Current Location',
            country: 'India',
            displayName: 'Current Location',
            latitude,
            longitude,
            source: 'browser',
          });

          // Try to get pincode (optional - for display only)
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            console.log('🗺️ Geocoding result:', data);
            
            if (data && data.address && data.address.postcode) {
              const detectedPincode = data.address.postcode;
              console.log('📮 Pincode detected:', detectedPincode);
              setPincode(detectedPincode);
            } else {
              console.log('⚠️ No pincode in geocoding result');
              setPincode('');
            }
          } catch (geocodeError) {
            console.log('⚠️ Could not get pincode, but location is set:', geocodeError);
            setPincode('');
          }

          // IMPORTANT: Clear search params to behave like page load
          // This will make HeroSection fetch ALL nearby shops (no filters)
          // Just like when page first loads
          setCategory('');
          setSearchParams({});
          
          console.log('✅ Location updated! Showing all nearby shops (like page load)');
          alert('📍 Location detected! Showing nearby shops.');
          
        } catch (error) {
          console.error('❌ Error in location detection:', error);
          setPincode('');
          setCategory('');
          setSearchParams({});
          alert('📍 Location set! Showing nearby shops.');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        // Enhanced error logging
        console.error('❌ Geolocation error occurred');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        
        setIsDetectingLocation(false);
        
        // Handle specific error codes
        let errorMessage = '';
        switch(error.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = '🚫 Location permission denied.\n\nPlease enable location access:\n1. Click the location icon in browser address bar\n2. Allow location access\n3. Try again';
            console.error('Permission denied by user');
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage = '⚠️ Location information is unavailable.\n\nPossible reasons:\n- GPS/Location services are off\n- Network issue\n- Browser limitation';
            console.error('Position unavailable');
            break;
          case 3: // TIMEOUT
            errorMessage = '⏱️ Location request timed out.\n\nPlease:\n1. Check your internet connection\n2. Enable GPS/Location services\n3. Try again';
            console.error('Timeout occurred');
            break;
          default:
            errorMessage = `❌ An error occurred while detecting location.\n\nError: ${error.message || 'Unknown error'}\n\nPlease try:\n1. Refresh the page\n2. Enable location in browser settings\n3. Use a different browser`;
            console.error('Unknown error:', error.message);
        }
        
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout to 15 seconds
        maximumAge: 0
      }
    );
  };

  const handlePincodeChange = (value: string) => {
    if (value === 'CURRENT_LOCATION') {
      handleCurrentLocation();
      return;
    }
    
    setPincode(value);
    if (value.trim()) {
      console.log('🔍 Pincode search:', value.trim());
      // Note: User coordinates will be automatically included by HeroSection from LocationContext
      setSearchParams({ 
        pincode: value.trim(), 
        category: category.trim() || undefined 
      });
    } else if (!category.trim()) {
      setSearchParams({});
    }
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    if (value.trim()) {
      console.log('🔍 Category search:', value.trim());
      // Note: User coordinates will be automatically included by HeroSection from LocationContext
      setSearchParams({ 
        category: value.trim(), 
        pincode: pincode.trim() || undefined 
      });
    } else if (!pincode.trim()) {
      setSearchParams({});
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-center px-3 sm:px-4 py-3 sm:py-4">
      {/* Dropdowns Container - Same Line */}
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Pincode Dropdown - 50% width */}
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            📍 Search by Pincode
          </label>
          <select
            value={pincode}
            onChange={(e) => handlePincodeChange(e.target.value)}
            disabled={isDetectingLocation}
            className="w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm hover:border-blue-400 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Select Pincode</option>
            <option value="CURRENT_LOCATION" className="font-bold bg-green-50 text-green-700">
              📍 Use Current Location
            </option>
            <option disabled>──────────────</option>
            {pincodes.map((pc, idx) => (
              <option key={idx} value={pc}>
                {pc}
              </option>
            ))}
          </select>
        </div>

        {/* Category Dropdown - 50% width */}
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            🏷️ Search by Category
          </label>
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm hover:border-purple-400 transition-all cursor-pointer"
          >
            <option value="">Select Category</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Message Below Dropdowns */}
      {isDetectingLocation ? (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-700 font-semibold flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Detecting your location...
          </p>
          <p className="text-[10px] text-green-600 mt-1">
            Please allow location access when prompted by your browser
          </p>
        </div>
      ) : (
        <p className="text-[10px] text-gray-500 mt-2 text-center">
          💡 Tip: Use "Current Location" or select Pincode/Category to find shops
        </p>
      )}
    </div>
  );
}

