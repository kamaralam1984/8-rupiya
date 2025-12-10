'use client';

import { useState } from 'react';

interface SearchBarProps {
  pincode: string;
  area: string;
  category: string;
  shopName: string;
  onPincodeChange: (value: string) => void;
  onAreaChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onShopNameChange: (value: string) => void;
  onSearch: () => void;
}

export default function SearchBar({
  pincode,
  area,
  category,
  shopName,
  onPincodeChange,
  onAreaChange,
  onCategoryChange,
  onShopNameChange,
  onSearch,
}: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pincode */}
          <div>
            <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-2">
              Pincode
            </label>
            <input
              type="text"
              id="pincode"
              value={pincode}
              onChange={(e) => onPincodeChange(e.target.value)}
              placeholder="Enter pincode"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Area */}
          <div>
            <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
              Area
            </label>
            <input
              type="text"
              id="area"
              value={area}
              onChange={(e) => onAreaChange(e.target.value)}
              placeholder="Enter area"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              placeholder="Enter category"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Shop Name */}
          <div>
            <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 mb-2">
              Shop Name
            </label>
            <input
              type="text"
              id="shopName"
              value={shopName}
              onChange={(e) => onShopNameChange(e.target.value)}
              placeholder="Enter shop name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Search Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Search
          </button>
        </div>
      </form>
    </div>
  );
}

