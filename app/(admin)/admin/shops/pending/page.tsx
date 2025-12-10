'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface PendingShop {
  _id: string;
  shopName: string;
  ownerName: string;
  category: string;
  mobile?: string;
  area?: string;
  fullAddress: string;
  city?: string;
  pincode?: string;
  district?: string;
  latitude: number;
  longitude: number;
  photoUrl: string;
  planType?: 'BASIC' | 'PREMIUM' | 'FEATURED' | 'LEFT_BAR' | 'RIGHT_BAR' | 'BANNER' | 'HERO';
  planAmount?: number;
  createdAt: string;
}

export default function PendingShopsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [shops, setShops] = useState<PendingShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchPendingShops();
    }
  }, [token]);

  const fetchPendingShops = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/shops/pending', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending shops');
      }

      const data = await response.json();
      setShops(data.shops || []);
    } catch (error: any) {
      console.error('Error fetching pending shops:', error);
      toast.error('Failed to load pending shops');
    } finally {
      setLoading(false);
    }
  };

  const handlePayAmount = async (shop: PendingShop) => {
    if (!confirm(`Mark payment as done for "${shop.shopName}"?`)) {
      return;
    }

    try {
      setProcessingPayment(shop._id);
      
      const response = await fetch(`/api/admin/shops/${shop._id}/mark-payment-done`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentMode: 'CASH',
          amount: shop.planAmount || 100,
          planType: shop.planType || 'BASIC',
          district: shop.district,
          mobile: shop.mobile,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark payment as done');
      }

      toast.success('Payment marked as done! Shop moved to regular shops.');
      
      // Remove shop from pending list
      setShops(shops.filter(s => s._id !== shop._id));
      
      // Optionally refresh the page or redirect
      setTimeout(() => {
        router.push('/admin/shops');
      }, 1500);
    } catch (error: any) {
      console.error('Error marking payment:', error);
      toast.error(error.message || 'Failed to mark payment as done');
    } finally {
      setProcessingPayment(null);
    }
  };

  const getPlanDisplayName = (planType?: string) => {
    const plans: Record<string, string> = {
      BASIC: 'Basic',
      PREMIUM: 'Premium',
      FEATURED: 'Featured',
      LEFT_BAR: 'Left Bar',
      RIGHT_BAR: 'Right Bar',
      BANNER: 'Banner',
      HERO: 'Hero',
    };
    return plans[planType || 'BASIC'] || 'Basic';
  };

  const getPlanAmount = (planType?: string) => {
    const amounts: Record<string, number> = {
      BASIC: 100,
      PREMIUM: 500,
      FEATURED: 1000,
      LEFT_BAR: 200,
      RIGHT_BAR: 200,
      BANNER: 500,
      HERO: 1000,
    };
    return amounts[planType || 'BASIC'] || 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Pending Shops
          </h1>
          <p className="text-gray-600 mt-1">
            Shops waiting for payment confirmation ({shops.length} pending)
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/shops')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          View All Shops
        </button>
      </div>

      {/* Pending Shops List */}
      {shops.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">No pending shops</p>
          <p className="text-gray-400 text-sm mt-2">All shops have been paid</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <div
              key={shop._id}
              className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-orange-200 hover:border-orange-400 transition-all"
            >
              {/* Shop Image */}
              <div className="relative h-48 w-full bg-gray-200">
                {shop.photoUrl ? (
                  <Image
                    src={shop.photoUrl}
                    alt={shop.shopName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No Image
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-semibold">
                  PENDING
                </div>
              </div>

              {/* Shop Details */}
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900 mb-1">{shop.shopName}</h3>
                <p className="text-sm text-gray-600 mb-2">Owner: {shop.ownerName}</p>
                
                <div className="space-y-1 text-sm text-gray-600 mb-3">
                  <p><span className="font-medium">Category:</span> {shop.category}</p>
                  {shop.area && <p><span className="font-medium">Area:</span> {shop.area}</p>}
                  {shop.city && <p><span className="font-medium">City:</span> {shop.city}</p>}
                  {shop.mobile && <p><span className="font-medium">Mobile:</span> {shop.mobile}</p>}
                  <p><span className="font-medium">Plan:</span> {getPlanDisplayName(shop.planType)}</p>
                  <p className="text-lg font-bold text-green-600">
                    Amount: ₹{shop.planAmount || getPlanAmount(shop.planType)}
                  </p>
                </div>

                {/* Pay Amount Button */}
                <button
                  onClick={() => handlePayAmount(shop)}
                  disabled={processingPayment === shop._id}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingPayment === shop._id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      💰 Pay Amount (₹{shop.planAmount || getPlanAmount(shop.planType)})
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}












