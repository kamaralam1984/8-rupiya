'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOperatorAuth } from '@/app/contexts/OperatorAuthContext';
import OperatorRouteGuard from '@/app/components/OperatorRouteGuard';
import Link from 'next/link';

interface Shop {
  _id: string;
  shopName: string;
  ownerName: string;
  mobile: string;
  email?: string;
  category: string;
  pincode: string;
  address: string;
  photoUrl: string;
  paymentStatus: string;
  googleBusinessAccount?: {
    status: string;
    accountId?: string;
    locationId?: string;
    verificationUrl?: string;
    error?: string;
  };
  createdAt: string;
}

export default function OperatorShopsPage() {
  const { operator } = useOperatorAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter');

  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingGoogleBusiness, setCreatingGoogleBusiness] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchShops();
  }, [filter]);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('operator_token');
      const url = filter
        ? `/api/operator/shops?filter=${filter}`
        : '/api/operator/shops';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setShops(data.shops);
      }
    } catch (error) {
      console.error('Failed to load shops:', error);
      setMessage({ type: 'error', text: 'Failed to load shops' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoogleBusiness = async (shopId: string) => {
    try {
      setCreatingGoogleBusiness(shopId);
      setMessage(null);
      
      const token = localStorage.getItem('operator_token');
      const response = await fetch(`/api/operator/shops/${shopId}/google-business`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Google Business account created successfully!' });
        // Refresh shops list
        fetchShops();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create Google Business account' });
      }
    } catch (error: any) {
      console.error('Error creating Google Business account:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to create Google Business account' });
    } finally {
      setCreatingGoogleBusiness(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status || status === 'NOT_CREATED') {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Not Created
        </span>
      );
    }
    
    switch (status) {
      case 'CREATED':
      case 'VERIFIED':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            {status}
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <OperatorRouteGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-green-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Operator Panel</h1>
                <p className="text-green-100 text-sm">Google Business Account Manager</p>
              </div>
              <div className="flex gap-4">
                <Link
                  href="/operator/dashboard"
                  className="px-4 py-2 bg-green-700 hover:bg-green-800 rounded-lg transition-colors"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <Link
                href="/operator/shops"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  !filter
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Shops
              </Link>
              <Link
                href="/operator/shops?filter=without-google"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'without-google'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Without Google Business
              </Link>
              <Link
                href="/operator/shops?filter=with-google"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'with-google'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                With Google Business
              </Link>
              <Link
                href="/operator/shops?filter=pending"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending
              </Link>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-4 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <p>{message.text}</p>
            </div>
          )}

          {/* Shops List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading shops...</p>
            </div>
          ) : shops.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600 text-lg">No shops found</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shop
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Owner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pincode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Google Business
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shops.map((shop) => (
                      <tr key={shop._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              <img
                                className="h-12 w-12 rounded-lg object-cover"
                                src={shop.photoUrl || '/placeholder-shop.jpg'}
                                alt={shop.shopName}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {shop.shopName}
                              </div>
                              <div className="text-sm text-gray-500">{shop.mobile}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{shop.ownerName}</div>
                          {shop.email && (
                            <div className="text-sm text-gray-500">{shop.email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{shop.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{shop.pincode}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(shop.googleBusinessAccount?.status)}
                          {shop.googleBusinessAccount?.verificationUrl && (
                            <div className="mt-1">
                              <a
                                href={shop.googleBusinessAccount.verificationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-green-600 hover:text-green-800"
                              >
                                Verify →
                              </a>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {(!shop.googleBusinessAccount ||
                            shop.googleBusinessAccount.status === 'NOT_CREATED' ||
                            shop.googleBusinessAccount.status === 'FAILED') && (
                            <button
                              onClick={() => handleCreateGoogleBusiness(shop._id)}
                              disabled={creatingGoogleBusiness === shop._id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {creatingGoogleBusiness === shop._id
                                ? 'Creating...'
                                : 'Create Google Business'}
                            </button>
                          )}
                          {shop.googleBusinessAccount?.status === 'CREATED' && (
                            <Link
                              href={`/operator/shops/${shop._id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View Details
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </OperatorRouteGuard>
  );
}

