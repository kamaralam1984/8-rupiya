'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AgentRouteGuard from '@/app/components/AgentRouteGuard';
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
  const router = useRouter();
  const [shops, setShops] = useState<RenewShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState<string | null>(null);

  useEffect(() => {
    fetchRenewShops();
  }, []);

  const fetchRenewShops = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('agent_token');
      const response = await fetch('/api/agent/shops/renew', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setShops(data.shops);
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

  const handleRenew = async (shopId: string) => {
    if (!confirm('Renew this shop? Payment of ₹100 will be recorded and shop will be moved back to main collection.')) {
      return;
    }

    setRenewing(shopId);
    try {
      const token = localStorage.getItem('agent_token');
      const response = await fetch('/api/agent/shops/renew', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
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
    <AgentRouteGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-blue-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="text-white hover:text-blue-200"
              >
                ← Back
              </button>
              <h1 className="text-xl font-bold">Renew Shops</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <p className="text-gray-600 text-sm mb-1">Expired Shops</p>
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
              <p className="text-sm text-gray-500">All your shops are currently active</p>
            </div>
          ) : (
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
          )}
        </main>
      </div>
    </AgentRouteGuard>
  );
}

