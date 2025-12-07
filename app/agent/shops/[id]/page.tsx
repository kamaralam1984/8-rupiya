'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import AgentRouteGuard from '@/app/components/AgentRouteGuard';

interface Shop {
  _id: string;
  shopName: string;
  ownerName: string;
  mobile: string;
  category: string;
  pincode: string;
  address: string;
  photoUrl: string;
  latitude: number;
  longitude: number;
  paymentStatus: 'PAID' | 'PENDING';
  paymentMode: 'CASH' | 'UPI' | 'NONE';
  receiptNo: string;
  amount: number;
  sendSmsReceipt: boolean;
  createdAt: string;
}

export default function ShopDetailPage() {
  const router = useRouter();
  const params = useParams();
  const shopId = params.id as string;
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shopId) {
      fetchShop();
    }
  }, [shopId]);

  const fetchShop = async () => {
    try {
      const token = localStorage.getItem('agent_token');
      if (!token) {
        console.error('No authentication token found');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/agent/shops/${shopId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to load shop:', errorData.error || `HTTP ${response.status}`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.success && data.shop) {
        setShop(data.shop);
      } else {
        console.error('Shop not found or invalid response');
      }
    } catch (error) {
      console.error('Failed to load shop:', error);
    } finally {
      setLoading(false);
    }
  };

  const googleMapsUrl = shop
    ? `https://www.google.com/maps?q=${shop.latitude},${shop.longitude}`
    : '#';

  return (
    <AgentRouteGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-blue-600 text-white shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="text-white hover:text-blue-200"
              >
                ← Back
              </button>
              <h1 className="text-xl font-bold">Shop Details</h1>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading shop details...</p>
            </div>
          ) : !shop ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <p className="text-gray-600">Shop not found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Photo */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="relative h-64 w-full">
                  <Image
                    src={shop.photoUrl || '/placeholder-shop.jpg'}
                    alt={shop.shopName}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Shop Info */}
              <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {shop.shopName}
                  </h2>
                  <p className="text-gray-600">Owner: {shop.ownerName}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Category</p>
                    <p className="font-semibold text-gray-900">{shop.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Pincode</p>
                    <p className="font-semibold text-gray-900">{shop.pincode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Mobile</p>
                    <a
                      href={`tel:${shop.mobile}`}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      {shop.mobile}
                    </a>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Payment Status</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        shop.paymentStatus === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {shop.paymentStatus}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Full Address</p>
                  <p className="text-gray-900">{shop.address}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Location</p>
                  <p className="text-gray-900 text-sm">
                    Lat: {shop.latitude.toFixed(6)}, Lng: {shop.longitude.toFixed(6)}
                  </p>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm mt-1 inline-block"
                  >
                    Open in Google Maps →
                  </a>
                </div>

                {shop.paymentStatus === 'PAID' && (
                  <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-gray-500">Payment Details</p>
                    <p className="font-semibold text-gray-900">
                      Amount: ₹{shop.amount}
                    </p>
                    <p className="text-sm text-gray-600">
                      Mode: {shop.paymentMode}
                    </p>
                    {shop.receiptNo && (
                      <p className="text-sm text-gray-600">
                        Receipt No: {shop.receiptNo}
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Created: {new Date(shop.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Link
                  href={`/agent/shops/${shopId}/edit`}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
                >
                  Edit Shop
                </Link>
                {shop.paymentStatus === 'PAID' && shop.sendSmsReceipt && (
                  <button
                    className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                  >
                    Resend Receipt
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </AgentRouteGuard>
  );
}

