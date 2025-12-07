'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ShopSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopId = searchParams.get('id');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✅</span>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Shop Successfully Added!
        </h2>
        
        <p className="text-gray-600 mb-8">
          The shop has been registered successfully in the system.
        </p>

        <div className="space-y-3">
          <Link
            href="/agent/shops/new"
            className="block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Add Another Shop
          </Link>
          
          <Link
            href="/agent/dashboard"
            className="block w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </Link>

          {shopId && (
            <Link
              href={`/agent/shops/${shopId}`}
              className="block w-full text-blue-600 hover:text-blue-700 font-semibold"
            >
              View Shop Details →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}


