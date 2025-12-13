'use client';

import { useState, useEffect } from 'react';
import { useSearch } from '../contexts/SearchContext';
import { useLocation } from '../contexts/LocationContext';

export default function HomepageSearchFilter() {
  const { searchParams, setSearchParams, clearSearch, isSearchActive } = useSearch();
  const { location } = useLocation();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.shopName || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.category || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.city || '');
  const [selectedPincode, setSelectedPincode] = useState(searchParams.pincode || '');
  
  // Options for filters
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [pincodes, setPincodes] = useState<string[]>([]);

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch('/api/shops/search-options');
        const data = await response.json();
        
        console.log('🔍 Search Options API Response:', {
          success: data.success,
          citiesCount: data.cities?.length || 0,
          cities: data.cities || [],
          categoriesCount: data.categories?.length || 0,
          pincodesCount: data.pincodes?.length || 0,
        });
        
        if (data.success) {
          setCategories(data.categories || []);
          setCities(data.cities || []);
          setPincodes(data.pincodes || []);
          
          console.log('✅ Filter options set:', {
            cities: data.cities?.length || 0,
            categories: data.categories?.length || 0,
            pincodes: data.pincodes?.length || 0,
          });
        } else {
          console.error('❌ API returned success: false', data);
        }
      } catch (error) {
        console.error('❌ Error fetching filter options:', error);
      }
    };
    
    fetchFilterOptions();
  }, []);

  // Sync local state with search params
  useEffect(() => {
    setSearchQuery(searchParams.shopName || '');
    setSelectedCategory(searchParams.category || '');
    setSelectedCity(searchParams.city || '');
    setSelectedPincode(searchParams.pincode || '');
  }, [searchParams]);

  // Auto-update search params when dropdowns change (without form submit)
  // This ensures left rail, right rail, and bottom strip update immediately when filters change
  useEffect(() => {
    const newParams: any = {};
    // Include shop name if it exists (from previous search)
    if (searchQuery.trim()) newParams.shopName = searchQuery.trim();
    if (selectedCategory) newParams.category = selectedCategory;
    if (selectedCity) newParams.city = selectedCity;
    if (selectedPincode) newParams.pincode = selectedPincode;
    
    // Only update if params actually changed (avoid infinite loop)
    const paramsChanged = 
      (newParams.shopName || '') !== (searchParams.shopName || '') ||
      (newParams.category || '') !== (searchParams.category || '') ||
      (newParams.city || '') !== (searchParams.city || '') ||
      (newParams.pincode || '') !== (searchParams.pincode || '');
    
    if (paramsChanged) {
      console.log('🔄 HomepageSearchFilter: Auto-updating search params from dropdowns:', newParams);
      console.log('🔄 Previous params:', searchParams);
      setSearchParams(newParams);
    }
  }, [selectedCategory, selectedCity, selectedPincode]); // Dropdowns update immediately, searchQuery updates on form submit

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newParams: any = {};
    if (searchQuery.trim()) newParams.shopName = searchQuery.trim();
    if (selectedCategory) newParams.category = selectedCategory;
    if (selectedCity) newParams.city = selectedCity;
    if (selectedPincode) newParams.pincode = selectedPincode;
    
    console.log('🔍 HomepageSearchFilter: Setting search params:', newParams);
    setSearchParams(newParams);
    
    // Scroll to hero section (which contains left/right/bottom shops)
    setTimeout(() => {
      const heroSection = document.getElementById('businesses-section');
      if (heroSection) {
        heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedCity('');
    setSelectedPincode('');
    clearSearch();
  };

  return (
    <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 rounded-2xl shadow-xl border border-gray-100/50 backdrop-blur-sm p-6 sm:p-8 mb-8 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-400/10 to-pink-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="relative z-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6">
          <div className="mb-4 sm:mb-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                Search & Filter Shops
              </h2>
            </div>
            <p className="text-sm sm:text-base text-gray-600 ml-14">
              Discover shops by name, category, city, or pincode
            </p>
          </div>
          
          {isSearchActive && (
            <button
              onClick={handleClearFilters}
              className="group flex items-center gap-2 px-5 py-2.5 bg-white/80 hover:bg-white border border-gray-200 hover:border-red-300 text-gray-700 hover:text-red-600 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm"
            >
              <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear All
            </button>
          )}
        </div>

        {/* Active Filters Badges */}
        {isSearchActive && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedCategory && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {selectedCategory}
              </span>
            )}
            {selectedCity && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {selectedCity}
              </span>
            )}
            {selectedPincode && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {selectedPincode}
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                "{searchQuery}"
              </span>
            )}
          </div>
        )}

        <form onSubmit={handleSearch} className="space-y-5">
          {/* Search Bar - Enhanced */}
          <div className="relative">
            <label htmlFor="shop-search" className="block text-sm font-semibold text-gray-700 mb-2.5">
              Shop Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="shop-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by shop name..."
                className="w-full pl-12 pr-4 py-3.5 bg-white/90 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400"
              />
            </div>
          </div>

          {/* Filter Grid - Modern Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div className="group">
              <label htmlFor="category-filter" className="block text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Category
              </label>
              <div className="relative">
                <select
                  id="category-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-white/90 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg text-gray-700 font-medium"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat, idx) => (
                    <option key={`cat-${cat}-${idx}`} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* City Filter */}
            <div className="group">
              <label htmlFor="city-filter" className="block text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                City
              </label>
              <div className="relative">
                <select
                  id="city-filter"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-white/90 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg text-gray-700 font-medium"
                >
                  <option value="">All Cities</option>
                  {cities.map((city, idx) => (
                    <option key={`city-${city}-${idx}`} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Pincode Filter */}
            <div className="group">
              <label htmlFor="pincode-filter" className="block text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Pincode
              </label>
              <div className="relative">
                <select
                  id="pincode-filter"
                  value={selectedPincode}
                  onChange={(e) => setSelectedPincode(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-white/90 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg text-gray-700 font-medium"
                >
                  <option value="">All Pincodes</option>
                  {pincodes.map((pincode, idx) => (
                    <option key={`pincode-${pincode}-${idx}`} value={pincode}>
                      {pincode}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Enhanced */}
          <div className="flex flex-wrap gap-3 items-center pt-2">
            <button
              type="submit"
              className="group relative flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 hover:from-blue-700 hover:via-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-base"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Shops
            </button>
            
            {(searchQuery || selectedCategory || selectedCity || selectedPincode) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex items-center gap-2 px-6 py-3.5 bg-white/80 hover:bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md font-medium text-base"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            )}
            
            {isSearchActive && (
              <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-blue-700">Filters Active</span>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

