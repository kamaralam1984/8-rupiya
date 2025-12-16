'use client';

import { X } from 'lucide-react';
import type { Category } from '../types';

interface CategoryShopCountModalProps {
  category: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onViewCategory?: (category: Category) => void;
}

export default function CategoryShopCountModal({ category, isOpen, onClose, onViewCategory }: CategoryShopCountModalProps) {
  if (!isOpen || !category) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Content */}
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>

          {/* Category Name */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {category.displayName}
            </h2>
            <p className="text-sm text-gray-500">Category Information</p>
          </div>

          {/* Shop Count */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-100">
            <div className="space-y-2">
              <p className="text-sm sm:text-base font-medium text-gray-600">Total Shops</p>
              <p className="text-4xl sm:text-5xl font-bold text-blue-600">
                {category.itemCount || 0}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                {category.itemCount === 1 ? 'shop available' : 'shops available'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {onViewCategory && category.itemCount > 0 && (
              <button
                onClick={() => onViewCategory(category)}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                View Shops ({category.itemCount})
              </button>
            )}
            <button
              onClick={onClose}
              className={`${onViewCategory && category.itemCount > 0 ? 'flex-1' : 'w-full'} py-3 px-6 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

