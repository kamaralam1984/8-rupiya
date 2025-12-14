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
  
  // Minimize/Expand state - default to minimized, but auto-expand if search is active
  const [isMinimized, setIsMinimized] = useState(!isSearchActive);

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        console.log('🔍 Fetching search options from API...');
        const response = await fetch('/api/shops/search-options');
        
        if (!response.ok) {
          console.error('❌ API response not OK:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('❌ Error response body:', errorText);
          return;
        }
        
        const data = await response.json();
        
        console.log('🔍 Search Options API Response:', {
          success: data.success,
          citiesCount: data.cities?.length || 0,
          cities: data.cities || [],
          categoriesCount: data.categories?.length || 0,
          pincodesCount: data.pincodes?.length || 0,
          error: data.error,
          details: data.details,
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
          console.error('❌ API returned success: false', {
            error: data.error,
            details: data.details,
            errorName: data.errorName,
            fullData: data,
          });
          // Set empty arrays as fallback
          setCategories([]);
          setCities([]);
          setPincodes([]);
        }
      } catch (error: any) {
        console.error('❌ Error fetching filter options:', error);
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });
        // Set empty arrays as fallback
        setCategories([]);
        setCities([]);
        setPincodes([]);
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

  // Auto-expand if search becomes active
  useEffect(() => {
    if (isSearchActive) {
      setIsMinimized(false);
    }
  }, [isSearchActive]);

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
    <div className="relative bg-white rounded-lg sm:rounded-xl shadow-md border border-gray-200 mb-3 sm:mb-4 md:mb-6 overflow-hidden">
      <div className="relative z-10">
        {/* Dropdown Header - Clickable */}
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors duration-200 touch-manipulation"
          aria-label={isMinimized ? 'Expand search filters' : 'Collapse search filters'}
        >
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-sm shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">
                Search & Filter Shops
              </h2>
              {isSearchActive && !isMinimized && (
                <p className="text-xs text-gray-500 mt-0.5">Filters active</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isSearchActive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearFilters();
                }}
                className="group flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 text-red-600 hover:text-red-700 rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium touch-manipulation"
                aria-label="Clear all filters"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
            <svg 
              className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-400 transition-transform duration-200 ${isMinimized ? '' : 'rotate-180'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Active Filters Badges - Mobile Optimized */}
        {isSearchActive && !isMinimized && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 px-3 sm:px-4 pb-2 sm:pb-3">
            {selectedCategory && (
              <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-medium">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="truncate max-w-[120px] sm:max-w-none">{selectedCategory}</span>
              </span>
            )}
            {selectedCity && (
              <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs sm:text-sm font-medium">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate max-w-[120px] sm:max-w-none">{selectedCity}</span>
              </span>
            )}
            {selectedPincode && (
              <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-medium">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="truncate max-w-[100px] sm:max-w-none">{selectedPincode}</span>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs sm:text-sm font-medium">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="truncate max-w-[100px] sm:max-w-[200px]">"{searchQuery}"</span>
              </span>
            )}
          </div>
        )}

        {/* Collapsible Form Section */}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden border-t border-gray-100 ${
          isMinimized ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
        }`}>
          <form onSubmit={handleSearch} className="p-3 sm:p-4 space-y-2 sm:space-y-2.5 md:space-y-3">
          {/* Search Bar - Mobile Optimized */}
          <div className="relative">
            <label htmlFor="shop-search" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5">
              Shop Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="shop-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by shop name..."
                className="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-2.5 md:py-3 bg-white/90 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg placeholder-gray-400 touch-manipulation"
              />
            </div>
          </div>

          {/* Filter Grid - Mobile Optimized */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {/* Category Filter */}
            <div className="group">
              <label htmlFor="category-filter" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5 flex items-center gap-1.5 sm:gap-2">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Category
              </label>
              <div className="relative">
                <select
                  id="category-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-8 sm:pl-9 pr-7 sm:pr-8 py-2 sm:py-2.5 bg-white/90 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg text-sm sm:text-base text-gray-700 font-medium touch-manipulation"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat, idx) => (
                    <option key={`cat-${cat}-${idx}`} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-2 sm:pr-2.5 flex items-center pointer-events-none">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* City Filter */}
            <div className="group">
              <label htmlFor="city-filter" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5 flex items-center gap-1.5 sm:gap-2">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="w-full pl-8 sm:pl-9 pr-7 sm:pr-8 py-2 sm:py-2.5 bg-white/90 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg text-sm sm:text-base text-gray-700 font-medium touch-manipulation"
                >
                  <option value="">All Cities</option>
                  {cities.map((city, idx) => (
                    <option key={`city-${city}-${idx}`} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-2 sm:pr-2.5 flex items-center pointer-events-none">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Pincode Filter */}
            <div className="group">
              <label htmlFor="pincode-filter" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5 flex items-center gap-1.5 sm:gap-2">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Pincode
              </label>
              <div className="relative">
                <select
                  id="pincode-filter"
                  value={selectedPincode}
                  onChange={(e) => setSelectedPincode(e.target.value)}
                  className="w-full pl-8 sm:pl-9 pr-7 sm:pr-8 py-2 sm:py-2.5 bg-white/90 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg text-sm sm:text-base text-gray-700 font-medium touch-manipulation"
                >
                  <option value="">All Pincodes</option>
                  {pincodes.map((pincode, idx) => (
                    <option key={`pincode-${pincode}-${idx}`} value={pincode}>
                      {pincode}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-2 sm:pr-2.5 flex items-center pointer-events-none">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-2.5 items-stretch sm:items-center pt-2 sm:pt-2.5">
            <button
              type="submit"
              className="group relative flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 hover:from-blue-700 hover:via-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 sm:active:scale-100 text-xs sm:text-sm md:text-base touch-manipulation w-full sm:w-auto"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-5 group-hover:scale-110 transition-transform duration-200 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search Shops</span>
            </button>
            
            {(searchQuery || selectedCategory || selectedCity || selectedPincode) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 md:py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 rounded-lg transition-all duration-200 active:scale-95 font-medium text-xs sm:text-sm md:text-base touch-manipulation w-full sm:w-auto"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

