'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useShopperAuth } from '@/app/contexts/ShopperAuthContext';
import Link from 'next/link';
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
  shopUrl?: string;
}

export default function ShopperShopsPage() {
  const { shopper, token, logout } = useShopperAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<Shop[]>([]);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');

  useEffect(() => {
    if (!token) {
      router.push('/shopper/login');
      return;
    }
    fetchShops();
  }, [token, router]);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/shopper/shops', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setShops(data.shops || []);
      } else {
        toast.error(data.error || 'Failed to load shops');
      }
    } catch (error: any) {
      console.error('Failed to load shops:', error);
      toast.error('Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  const filteredShops = shops.filter((shop) => {
    if (filter === 'paid') return shop.paymentStatus === 'PAID';
    if (filter === 'pending') return shop.paymentStatus === 'PENDING';
    return true;
  });

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/shopper/dashboard"
                className="text-blue-600 hover:text-blue-700"
              >
                ← Back to Dashboard
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Shops</h1>
                <p className="text-sm text-gray-600">Manage all your registered shops</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/shopper/shops/register"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                + Register New Shop
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({shops.length})
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === 'paid'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Paid ({shops.filter((s) => s.paymentStatus === 'PAID').length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === 'pending'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({shops.filter((s) => s.paymentStatus === 'PENDING').length})
            </button>
          </div>
        </div>

        {/* Shops Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading shops...</p>
          </div>
        ) : filteredShops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShops.map((shop) => (
              <div
                key={shop._id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
              >
                {shop.photoUrl && (
                  <img
                    src={shop.photoUrl}
                    alt={shop.shopName}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{shop.shopName}</h3>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Category:</span> {shop.category || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Area:</span> {shop.area || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Pincode:</span> {shop.pincode || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Mobile:</span> {shop.mobile || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        shop.paymentStatus === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : shop.paymentStatus === 'PENDING'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {shop.paymentStatus || 'PENDING'}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      {shop.planType || 'BASIC'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {shop.paymentStatus === 'PENDING' ? (
                      <Link
                        href={`/shopper/shops/${shop._id}/pay`}
                        className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-center text-sm font-medium"
                      >
                        Pay Now
                      </Link>
                    ) : shop.shopUrl ? (
                      <a
                        href={shop.shopUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center text-sm font-medium"
                      >
                        View Shop
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🏪</div>
            <p className="text-gray-600 mb-4">
              {filter === 'all'
                ? 'No shops registered yet'
                : filter === 'paid'
                ? 'No paid shops found'
                : 'No pending shops found'}
            </p>
            <Link
              href="/shopper/shops/register"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Register Your First Shop
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

