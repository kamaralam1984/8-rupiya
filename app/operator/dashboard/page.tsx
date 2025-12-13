'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOperatorAuth } from '@/app/contexts/OperatorAuthContext';
import OperatorRouteGuard from '@/app/components/OperatorRouteGuard';
import Link from 'next/link';

interface Shop {
  _id: string;
  shopName: string;
  ownerName: string;
  mobile: string;
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
  };
}

interface DashboardStats {
  totalShops: number;
  shopsWithGoogleBusiness: number;
  shopsPendingGoogleBusiness: number;
  shopsWithoutGoogleBusiness: number;
}

export default function OperatorDashboard() {
  const { operator, logout } = useOperatorAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingShops, setLoadingShops] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    fetchShops();
    // Auto-refresh dashboard stats every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardStats();
      fetchShops();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('operator_token');
      const response = await fetch('/api/operator/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShops = async () => {
    try {
      const token = localStorage.getItem('operator_token');
      const response = await fetch('/api/operator/shops', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setShops(data.shops.slice(0, 10)); // Show only recent 10 shops
      }
    } catch (error) {
      console.error('Failed to load shops:', error);
    } finally {
      setLoadingShops(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/operator/login');
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
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-green-700 hover:bg-green-800 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          ) : (
            <>
              {/* Welcome Card */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Welcome, {operator?.name}!
                </h2>
                <p className="text-gray-600">
                  Operator Code: <span className="font-semibold">{operator?.operatorCode}</span>
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Shops</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {stats?.totalShops || 0}
                      </p>
                    </div>
                    <div className="bg-blue-100 rounded-full p-3">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">With Google Business</p>
                      <p className="text-3xl font-bold text-green-600">
                        {stats?.shopsWithGoogleBusiness || 0}
                      </p>
                    </div>
                    <div className="bg-green-100 rounded-full p-3">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Pending Creation</p>
                      <p className="text-3xl font-bold text-yellow-600">
                        {stats?.shopsPendingGoogleBusiness || 0}
                      </p>
                    </div>
                    <div className="bg-yellow-100 rounded-full p-3">
                      <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Without Google Business</p>
                      <p className="text-3xl font-bold text-red-600">
                        {stats?.shopsWithoutGoogleBusiness || 0}
                      </p>
                    </div>
                    <div className="bg-red-100 rounded-full p-3">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Navigation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Link
                  href="/operator/shops"
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center">
                    <div className="bg-green-100 rounded-full p-3 mr-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">All Shops</h3>
                      <p className="text-sm text-gray-600">View and manage all shops</p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/operator/shops?filter=without-google"
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center">
                    <div className="bg-red-100 rounded-full p-3 mr-4">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Shops Without Google Business</h3>
                      <p className="text-sm text-gray-600">Create Google Business accounts</p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Recent Shops */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Shops</h2>
                {loadingShops ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading shops...</p>
                  </div>
                ) : shops.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No shops found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Shop Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Owner
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Google Business
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {shops.map((shop) => (
                          <tr key={shop._id}>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{shop.shopName}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{shop.ownerName}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{shop.category}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  shop.googleBusinessAccount?.status === 'CREATED' || shop.googleBusinessAccount?.status === 'VERIFIED'
                                    ? 'bg-green-100 text-green-800'
                                    : shop.googleBusinessAccount?.status === 'PENDING'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {shop.googleBusinessAccount?.status || 'NOT_CREATED'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <Link
                                href={`/operator/shops/${shop._id}`}
                                className="text-green-600 hover:text-green-800 font-medium"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </OperatorRouteGuard>
  );
}

