'use client';

import { useState, useEffect } from 'react';
import { useSearch } from '../contexts/SearchContext';
import { useLocation } from '../contexts/LocationContext';

/**
 * Business Directory - Top Search Bar
 * 
 * Comprehensive search system with:
 * - Shop name search
 * - Category filter
 * - Pincode filter
 * - Current location detection
 * - Real-time results
 */
export default function DigitalShopDirectory() {
  const { setSearchParams } = useSearch();
  const { location, setLocation } = useLocation();
  
  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState('');
  const [pincode, setPincode] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [pincodes, setPincodes] = useState<string[]>([]);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch search options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [searchRes, catRes] = await Promise.all([
          fetch('/api/shops/search-options'),
          fetch('/api/categories'),
        ]);

        const searchData = await searchRes.json();
        const catData = await catRes.json();

        if (searchData.success) {
          setPincodes(searchData.pincodes || []);
          if (searchData.categories?.length > 0) {
            setCategories(searchData.categories);
          } else if (catData.success && catData.categories) {
            setCategories(catData.categories.map((c: any) => c.displayName || c.name || c.slug));
          }
        }
      } catch (error) {
        console.error('Error fetching options:', error);
      }
    };
    fetchOptions();
  }, []);

  // Detect current location
  const handleCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('❌ Geolocation not supported');
      return;
    }

    setIsDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Update location context
        setLocation({
          id: `location-${Date.now()}`,
          city: 'Current Location',
          country: 'India',
          displayName: 'Current Location',
          latitude,
          longitude,
          source: 'browser',
        });

        // Try to get pincode
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await res.json();
          if (data?.address?.postcode) {
            setPincode(data.address.postcode);
          }
        } catch (err) {
          // Silent error - pincode detection is optional
        }

        // Clear search params to show all nearby shops
        setShopName('');
        setCategory('');
        setSearchParams({});
        
        alert('📍 Location detected! Showing nearby shops.');
        setIsDetectingLocation(false);
      },
      (error) => {
        // Silent error - user will see alert
        setIsDetectingLocation(false);
        alert('❌ Could not detect location. Please try again or enter pincode manually.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Handle search
  const handleSearch = () => {
    const searchData: any = {};
    if (shopName.trim()) searchData.shopName = shopName.trim();
    if (category.trim()) searchData.category = category.trim();
    if (pincode.trim()) searchData.pincode = pincode.trim();

    if (shopName.trim() || category.trim() || pincode.trim()) {
      setSearchParams(searchData);
    } else {
      setSearchParams({});
    }
  };

  // Clear search
  const handleClear = () => {
    setShopName('');
    setCategory('');
    setPincode('');
    setSearchParams({});
  };

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col">
      <div className="w-full h-full px-3 sm:px-4 py-3 sm:py-3.5 flex flex-col">
        {/* Search Form - Optimized spacing */}
        <div className="flex-1 flex flex-col space-y-2.5">
          {/* Main Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search shop name..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder-gray-400 text-gray-900 shadow-sm hover:border-gray-400"
            />
          </div>

          {/* Filters Row - Professional side by side layout */}
          <div className="grid grid-cols-2 gap-2">
            {/* Category Dropdown */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <select
                value={category}
                onChange={(e) => {
                  const selectedCategory = e.target.value;
                  setCategory(selectedCategory);
                  // Automatically trigger search when category is selected
                  if (selectedCategory.trim()) {
                    const searchData: any = {};
                    if (shopName.trim()) searchData.shopName = shopName.trim();
                    if (pincode.trim()) searchData.pincode = pincode.trim();
                    searchData.category = selectedCategory.trim();
                    setSearchParams(searchData);
                  } else {
                    // If category is cleared, search with remaining filters
                    const searchData: any = {};
                    if (shopName.trim()) searchData.shopName = shopName.trim();
                    if (pincode.trim()) searchData.pincode = pincode.trim();
                    if (shopName.trim() || pincode.trim()) {
                      setSearchParams(searchData);
                    } else {
                      setSearchParams({});
                    }
                  }
                }}
                className="w-full pl-10 pr-8 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer text-gray-900 appearance-none shadow-sm hover:border-gray-400"
              >
                <option value="">Category</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Pincode Dropdown */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <select
                value={pincode}
                onChange={(e) => {
                  const selectedPincode = e.target.value;
                  setPincode(selectedPincode);
                  // Automatically trigger search when pincode is selected
                  if (selectedPincode.trim()) {
                    const searchData: any = {};
                    if (shopName.trim()) searchData.shopName = shopName.trim();
                    if (category.trim()) searchData.category = category.trim();
                    searchData.pincode = selectedPincode.trim();
                    setSearchParams(searchData);
                  } else {
                    // If pincode is cleared, search with remaining filters
                    const searchData: any = {};
                    if (shopName.trim()) searchData.shopName = shopName.trim();
                    if (category.trim()) searchData.category = category.trim();
                    if (shopName.trim() || category.trim()) {
                      setSearchParams(searchData);
                    } else {
                      setSearchParams({});
                    }
                  }
                }}
                disabled={isDetectingLocation}
                className="w-full pl-10 pr-8 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer text-gray-900 appearance-none shadow-sm hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300"
              >
                <option value="">Pincode</option>
                {pincodes.map((pc, idx) => (
                  <option key={idx} value={pc}>{pc}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Action Buttons - Professional layout */}
          <div className="flex gap-2 pt-1">
            {/* Location Button */}
            <button
              onClick={handleCurrentLocation}
              disabled={isDetectingLocation}
              className="px-3 py-2.5 sm:px-4 sm:flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-xs sm:text-sm"
              title="Current Location"
            >
              {isDetectingLocation ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="hidden sm:inline">Location</span>
                </>
              )}
            </button>

            {/* Search Button - Primary action */}
            <button
              onClick={handleSearch}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search</span>
            </button>

            {/* Clear Button */}
            <button
              onClick={handleClear}
              className="px-3 py-2.5 sm:px-4 bg-gray-50 hover:bg-gray-100 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs sm:text-sm shadow-sm"
              title="Clear"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>

          {/* Active Filters - Compact and professional */}
          {(shopName || category || pincode) && (
            <div className="pt-2 border-t border-gray-200 mt-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {shopName && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-200">
                    <span>{shopName}</span>
                    <button 
                      onClick={() => setShopName('')} 
                      className="hover:text-blue-900 transition-colors p-0.5 rounded"
                      aria-label="Remove shop filter"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {category && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-md border border-purple-200">
                    <span>{category}</span>
                    <button 
                      onClick={() => setCategory('')} 
                      className="hover:text-purple-900 transition-colors p-0.5 rounded"
                      aria-label="Remove category filter"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {pincode && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-md border border-green-200">
                    <span>{pincode}</span>
                    <button 
                      onClick={() => setPincode('')} 
                      className="hover:text-green-900 transition-colors p-0.5 rounded"
                      aria-label="Remove pincode filter"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

