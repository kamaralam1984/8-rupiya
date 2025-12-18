'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useShopperAuth } from '@/app/contexts/ShopperAuthContext';
import toast from 'react-hot-toast';

interface Shop {
  _id: string;
  shopName: string;
  category: string;
  mobile: string;
  pincode: string;
  area: string;
  planType: string;
  paymentStatus: string;
  photoUrl?: string;
}

export default function ShopperDashboard() {
  const { shopper, logout, token } = useShopperAuth();
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopper) {
      router.push('/shopper/login');
      return;
    }
    fetchShops();
  }, [shopper, router]);

  const fetchShops = async () => {
    try {
      const response = await fetch('/api/shopper/shops', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.shops) {
        setShops(data.shops);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!shopper) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Shopper Panel</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {shopper.name}</span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Shops</h3>
            <p className="text-3xl font-bold text-gray-900">{shopper.totalShops || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Shopper Code</h3>
            <p className="text-3xl font-bold text-blue-600">{shopper.shopperCode}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Status</h3>
            <p className="text-lg font-semibold text-green-600">
              {shopper.isVerified ? '✓ Verified' : '⏳ Pending'}
            </p>
          </div>
        </div>

        {/* Register Shop Button */}
        <div className="mb-8">
          <Link
            href="/shopper/shops/register"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            + Register New Shop
          </Link>
        </div>

        {/* Shops List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">My Shops</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : shops.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No shops registered yet</p>
              <Link
                href="/shopper/shops/register"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                Register Your First Shop
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shops.map((shop) => (
                <div key={shop._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  {shop.photoUrl && (
                    <img
                      src={shop.photoUrl}
                      alt={shop.shopName}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  <h3 className="font-bold text-gray-900 mb-1">{shop.shopName}</h3>
                  <p className="text-sm text-gray-600 mb-2">{shop.category}</p>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      shop.paymentStatus === 'PAID'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {shop.paymentStatus}
                    </span>
                    <Link
                      href={`/shop/${shop._id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


