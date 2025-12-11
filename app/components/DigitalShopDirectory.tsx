'use client';

import { useState, useEffect } from 'react';
import { useSearch } from '../contexts/SearchContext';
import { useLocation } from '../contexts/LocationContext';

/**
 * Search Pitara - Top Search Bar
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
    console.log('🌍 Detecting location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('✅ Location detected:', { latitude, longitude });

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
          console.log('⚠️ Could not get pincode');
        }

        // Clear search params to show all nearby shops
        setShopName('');
        setCategory('');
        setSearchParams({});
        
        alert('📍 Location detected! Showing nearby shops.');
        setIsDetectingLocation(false);
      },
      (error) => {
        console.error('❌ Location error:', error);
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
      console.log('🔍 Searching:', searchData);
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
    <div className="w-full h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl shadow-lg">
      <div className="w-full h-full px-2 sm:px-3 py-1.5 sm:py-2">
        {/* Main Search Bar */}
        <div className="flex flex-col gap-2">
          {/* Title */}
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Search Pitara
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden px-2 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-all"
            >
              {showFilters ? 'Hide Filters' : 'Filters'}
            </button>
          </div>

          {/* Search Box + Filters */}
          <div className={`flex flex-col gap-1.5 sm:gap-2 ${!showFilters ? 'hidden md:flex' : 'flex'}`}>
            {/* Shop Name Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search shop name..."
                  className="w-full px-3 py-1.5 pl-9 text-xs sm:text-sm border-2 border-white/30 rounded-lg bg-white/95 focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all placeholder-gray-500"
                />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Category & Pincode Dropdowns Row */}
            <div className="flex gap-1.5">
              {/* Category Dropdown */}
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs border-2 border-white/30 rounded-lg bg-white/95 focus:bg-white focus:ring-2 focus:ring-yellow-400 cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Pincode Dropdown */}
              <select
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                disabled={isDetectingLocation}
                className="flex-1 px-2 py-1.5 text-xs border-2 border-white/30 rounded-lg bg-white/95 focus:bg-white focus:ring-2 focus:ring-yellow-400 cursor-pointer disabled:opacity-50"
              >
                <option value="">All Pincodes</option>
                {pincodes.map((pc, idx) => (
                  <option key={idx} value={pc}>{pc}</option>
                ))}
              </select>
            </div>

            {/* Action Buttons Row */}
            <div className="flex gap-1.5">
              {/* Current Location Button */}
              <button
                onClick={handleCurrentLocation}
                disabled={isDetectingLocation}
                className="flex-1 px-2 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 whitespace-nowrap"
              >
                {isDetectingLocation ? (
                  <>
                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-xs">...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs">Location</span>
                  </>
                )}
              </button>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                className="flex-1 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-xs font-bold rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                Search
              </button>

              {/* Clear Button */}
              <button
                onClick={handleClear}
                className="flex-1 px-2 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-all"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Active Filters Display */}
          {(shopName || category || pincode) && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-white/80 text-xs">Active filters:</span>
              {shopName && (
                <span className="px-1.5 py-0.5 bg-white/20 text-white text-xs rounded-full flex items-center gap-1">
                  Shop: {shopName}
                  <button onClick={() => setShopName('')} className="hover:text-red-300">×</button>
                </span>
              )}
              {category && (
                <span className="px-1.5 py-0.5 bg-white/20 text-white text-xs rounded-full flex items-center gap-1">
                  Category: {category}
                  <button onClick={() => setCategory('')} className="hover:text-red-300">×</button>
                </span>
              )}
              {pincode && (
                <span className="px-1.5 py-0.5 bg-white/20 text-white text-xs rounded-full flex items-center gap-1">
                  Pincode: {pincode}
                  <button onClick={() => setPincode('')} className="hover:text-red-300">×</button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

