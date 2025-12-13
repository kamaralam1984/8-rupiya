'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface SEOModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopName: string;
  area: string;
  category: string;
  pincode: string;
  email: string;
  onSave: (seoData: { ranking: number }) => void;
}

export default function SEOModal({ isOpen, onClose, shopName, area, category, pincode, email, onSave }: SEOModalProps) {
  const [ranking, setRanking] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!email || !email.trim()) {
      toast.error('Email ID is required for SEO');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/seo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopName: shopName.trim(),
          area: area.trim(),
          category: category.trim(),
          pincode: pincode.trim(),
          emailId: email.trim(),
          ranking: ranking,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('SEO entry created successfully!');
        onSave({ ranking });
        // Reset ranking for next entry (optional)
        setRanking(1);
        // Don't close modal - let user continue or close manually
      } else {
        throw new Error(data.error || 'Failed to create SEO entry');
      }
    } catch (error: any) {
      console.error('SEO save error:', error);
      toast.error(error.message || 'Failed to save SEO entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">SEO Configuration</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Display Shop Info (Read-only) */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Shop Name:</span>
              <span className="text-sm text-gray-900">{shopName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Area:</span>
              <span className="text-sm text-gray-900">{area}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Category:</span>
              <span className="text-sm text-gray-900">{category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Pincode:</span>
              <span className="text-sm text-gray-900">{pincode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Email ID:</span>
              <span className="text-sm text-gray-900">{email}</span>
            </div>
          </div>

          {/* SEO Ranking Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SEO Ranking <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={ranking}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 1;
                setRanking(value >= 1 ? value : 1);
              }}
              min={1}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter SEO ranking (1, 2, 3, etc.)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Lower number = Higher ranking (1 is the best ranking)
            </p>
          </div>

          {/* Info Box */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> SEO entry will be saved with shop name, area, category, pincode, and email ID. 
              This helps improve search visibility for your shop.
            </p>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !email || ranking < 1}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save SEO'}
          </button>
        </div>
      </div>
    </div>
  );
}

