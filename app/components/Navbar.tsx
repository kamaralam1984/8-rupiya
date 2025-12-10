'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import ProfileDropdown from './ProfileDropdown';
import { useAuth } from '../contexts/AuthContext';
import { useSearch } from '../contexts/SearchContext';

export default function Navbar() {
  const { isAuthenticated } = useAuth();
  const { setSearchParams } = useSearch();
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [pincode, setPincode] = useState('');
  const [area, setArea] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success && data.categories) {
          setCategories(data.categories.map((cat: any) => cat.displayName || cat.name || cat.slug));
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const searchData: any = {};
    if (pincode.trim()) searchData.pincode = pincode.trim();
    if (area.trim()) searchData.area = area.trim();
    if (category.trim()) searchData.category = category.trim();

    if (pincode.trim() || area.trim() || category.trim()) {
      // Set search params to trigger search on homepage
      setSearchParams(searchData);
      setShowSearchDropdown(false);
      // Scroll to hero section
      setTimeout(() => {
        const heroSection = document.getElementById('hero-section');
        if (heroSection) {
          heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const clearSearch = () => {
    setPincode('');
    setArea('');
    setCategory('');
    setSearchParams({});
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-gray-900/95 backdrop-blur-md shadow-md border-b border-amber-500/40">
      <div className="max-w-[98%] mx-auto px-2 sm:px-3 lg:px-4">
        <div className="flex items-center justify-between h-16 md:h-20 gap-2 sm:gap-4 py-2">
          {/* Left: Logo with enhanced design */}
          <div className="flex items-center shrink-0">
            <Link href="/" className="flex items-center group">
              <div className="relative w-24 h-12 sm:w-32 sm:h-16 md:w-40 md:h-20">
                <Image
                  src="/Assets/kvl-logo.png"
                  alt="8 Ruppess logo"
                  fill
                  sizes="400px"
                  priority
                  className="object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </Link>
          </div>

          {/* Center: Search Dropdown */}
          <div className="flex-1 max-w-2xl mx-4 hidden md:block relative" ref={dropdownRef}>
            <button
              onClick={() => setShowSearchDropdown(!showSearchDropdown)}
              className="w-full h-12 pl-4 pr-12 py-3 text-sm text-gray-500 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 bg-white shadow-sm transition-all text-left flex items-center justify-between"
              aria-label="Search shops"
            >
              <span className="truncate">
                {pincode || area || category ? (
                  <span className="text-gray-900">
                    {pincode && `Pincode: ${pincode}`}
                    {area && `${pincode ? ', ' : ''}Area: ${area}`}
                    {category && `${pincode || area ? ', ' : ''}Category: ${category}`}
                  </span>
                ) : (
                  'Search by Pincode, Area, Category...'
                )}
              </span>
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showSearchDropdown && (
              <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl p-4">
                <form onSubmit={handleSearch} className="space-y-4">
                  {/* Pincode */}
                  <div>
                    <label htmlFor="search-pincode" className="block text-sm font-medium text-gray-700 mb-2">
                      Pincode
                    </label>
                    <input
                      type="text"
                      id="search-pincode"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="Enter pincode (e.g., 800001)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Area */}
                  <div>
                    <label htmlFor="search-area" className="block text-sm font-medium text-gray-700 mb-2">
                      Area
                    </label>
                    <input
                      type="text"
                      id="search-area"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="Enter area (e.g., Bailey Road)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label htmlFor="search-category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      id="search-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      Search
                    </button>
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Mobile: Search Icon */}
          <div className="md:hidden">
            <button
              onClick={() => setShowSearchDropdown(!showSearchDropdown)}
              className="p-2 text-white hover:text-amber-400 transition-colors"
              aria-label="Search"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Mobile Dropdown */}
            {showSearchDropdown && (
              <div className="absolute top-full left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg p-4">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="Enter pincode"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Area</label>
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="Enter area"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold"
                    >
                      Search
                    </button>
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
                    >
                      Clear
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Right: CTAs */}
           <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
            {/* Desktop CTAs */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Promote Business */}
              <Link
                href="/promote"
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-custom-gradient rounded-xl shadow-md transition-all hover:shadow-lg hover:opacity-90 group"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                <span className="font-medium">Promote</span>
              </Link>

              {/* Notifications removed as requested */}
            </div>

            {/* Login / Sign Up Button or Profile Dropdown */}
            {isAuthenticated ? (
              <ProfileDropdown />
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm font-bold text-white bg-custom-gradient rounded-lg sm:rounded-xl transition-all shadow-md hover:shadow-lg hover:opacity-90 hover:scale-105 active:scale-95 shrink-0"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 hidden sm:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden sm:inline">Get Started</span>
                <span className="sm:hidden text-[10px]">Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
