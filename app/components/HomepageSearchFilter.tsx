'use client';

import { useState, useEffect } from 'react';
import { useSearch } from '../contexts/SearchContext';

/**
 * HomepageSearchFilter Component
 * 
 * Provides search filters on homepage with:
 * - Shop Name input
 * - Category dropdown
 * - City dropdown  
 * - Pincode dropdown
 * - Search and Clear buttons
 * 
 * Updates SearchContext which triggers HeroSection to fetch filtered results
 */
export default function HomepageSearchFilter() {
  const { searchParams, setSearchParams, clearSearch } = useSearch();
  
  // Local state for form inputs
  const [shopName, setShopName] = useState(searchParams.shopName || '');
  const [category, setCategory] = useState(searchParams.category || '');
  const [city, setCity] = useState(searchParams.area || ''); // Using area as city
  const [pincode, setPincode] = useState(searchParams.pincode || '');
  
  // Options for dropdowns
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [pincodes, setPincodes] = useState<string[]>([]);

  // Fetch search options
  useEffect(() => {
    const fetchSearchOptions = async () => {
      try {
        const res = await fetch('/api/shops/search-options');
        const data = await res.json();
        
        if (data.success) {
          setPincodes(data.pincodes || []);
          setCategories(data.categories || []);
          // Use areas as cities since the API returns areas
          setCities(data.areas || []);
        }
      } catch (error) {
        console.error('Error fetching search options:', error);
      }
    };
    
    fetchSearchOptions();
  }, []);

  // Sync local state with searchParams changes
  useEffect(() => {
    setShopName(searchParams.shopName || '');
    setCategory(searchParams.category || '');
    setCity(searchParams.area || '');
    setPincode(searchParams.pincode || '');
  }, [searchParams]);

  const handleSearch = () => {
    const params: any = {};
    
    if (shopName.trim()) {
      params.shopName = shopName.trim();
    }
    if (category.trim()) {
      params.category = category.trim();
    }
    if (city.trim()) {
      params.area = city.trim(); // API uses 'area' parameter
    }
    if (pincode.trim()) {
      params.pincode = pincode.trim();
    }
    
    console.log('🔍 Search Shops Panel - Search triggered:', params);
    setSearchParams(params);
    
    // Scroll to hero section to show results
    setTimeout(() => {
      const heroSection = document.getElementById('hero-section');
      if (heroSection) {
        heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  };

  const handleClear = () => {
    setShopName('');
    setCategory('');
    setCity('');
    setPincode('');
    clearSearch();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
        🔍 Search Shops
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Shop Name Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shop Name
          </label>
          <input
            type="text"
            placeholder="Enter shop name..."
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Category Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((cat, idx) => (
              <option key={`cat-${cat}-${idx}`} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* City Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">All Cities</option>
            {cities.map((cityOption, idx) => (
              <option key={`city-${cityOption}-${idx}`} value={cityOption}>
                {cityOption}
              </option>
            ))}
          </select>
        </div>

        {/* Pincode Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pincode
          </label>
          <select
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">All Pincodes</option>
            {pincodes.map((pin, idx) => (
              <option key={`pin-${pin}-${idx}`} value={pin}>
                {pin}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSearch}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search Shops
        </button>
        <button
          onClick={handleClear}
          className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}

