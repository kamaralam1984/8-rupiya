'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface RenewShop {
  _id: string;
  shopName: string;
  ownerName: string;
  mobile: string;
  category: string;
  pincode: string;
  address: string;
  photoUrl: string;
  expiredDate: string;
  createdAt: string;
  lastPaymentDate: string;
}

export default function RenewShopsPage() {
  const { token } = useAuth();
  const [shops, setShops] = useState<RenewShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (token) {
      fetchRenewShops();
    }
  }, [token, page]);

  const fetchRenewShops = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/shops/renew-list?page=${page}&limit=20`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setShops(data.shops);
        setTotalPages(data.pagination.pages);
      } else {
        toast.error(data.error || 'Failed to load renew shops');
      }
    } catch (error) {
      console.error('Failed to load renew shops:', error);
      toast.error('Failed to load renew shops');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckExpiry = async () => {
    try {
      const response = await fetch('/api/admin/shops/check-expiry', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Moved ${data.movedCount} expired shops to renew collection`);
        fetchRenewShops();
      } else {
        toast.error(data.error || 'Failed to check expiry');
      }
    } catch (error) {
      console.error('Failed to check expiry:', error);
      toast.error('Failed to check expiry');
    }
  };

  const handleRenew = async (shopId: string) => {
    if (!confirm('Renew this shop? Payment of ₹100 will be recorded and shop will be moved back to main collection.')) {
      return;
    }

    setRenewing(shopId);
    try {
      const response = await fetch('/api/admin/shops/renew', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          renewShopId: shopId,
          paymentMode: 'CASH',
          amount: 100,
          receiptNo: `REC${Date.now()}`,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Shop renewed successfully! Notification sent to shop owner.');
        fetchRenewShops();
      } else {
        toast.error(data.error || 'Failed to renew shop');
      }
    } catch (error) {
      console.error('Failed to renew shop:', error);
      toast.error('Failed to renew shop');
    } finally {
      setRenewing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Renew Shops</h1>
          <p className="text-gray-600 mt-1">Shops that have expired and need payment renewal</p>
        </div>
        <button
          onClick={handleCheckExpiry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Check Expiry
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-gray-600 text-sm mb-1">Total Expired Shops</p>
          <p className="text-3xl font-bold text-gray-900">{shops.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-gray-600 text-sm mb-1">Renewal Amount</p>
          <p className="text-3xl font-bold text-green-600">₹100</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-gray-600 text-sm mb-1">Validity Period</p>
          <p className="text-3xl font-bold text-blue-600">365 Days</p>
        </div>
      </div>

      {/* Shops List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading renew shops...</p>
        </div>
      ) : shops.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <p className="text-gray-600 text-lg mb-4">No shops need renewal</p>
          <p className="text-sm text-gray-500">All shops are currently active</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <div
                key={shop._id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="relative h-48 w-full">
                  <Image
                    src={shop.photoUrl || '/placeholder-shop.jpg'}
                    alt={shop.shopName}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">
                      EXPIRED
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
                    {shop.shopName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{shop.ownerName}</p>
                  <div className="space-y-1 mb-3">
                    <p className="text-xs text-gray-500">
                      <span className="font-semibold">Category:</span> {shop.category}
                    </p>
                    <p className="text-xs text-gray-500">
                      <span className="font-semibold">Mobile:</span> {shop.mobile}
                    </p>
                    <p className="text-xs text-gray-500">
                      <span className="font-semibold">Pincode:</span> {shop.pincode}
                    </p>
                    <p className="text-xs text-red-600">
                      <span className="font-semibold">Expired:</span>{' '}
                      {new Date(shop.expiredDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRenew(shop._id)}
                    disabled={renewing === shop._id}
                    className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {renewing === shop._id ? 'Renewing...' : 'Renew Payment (₹100)'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

