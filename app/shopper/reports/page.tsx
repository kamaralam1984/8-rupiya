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
  createdAt?: string;
}

interface ReportStats {
  totalShops: number;
  paidShops: number;
  pendingShops: number;
  totalRevenue: number;
  shopsByCategory: Record<string, number>;
  shopsByPlan: Record<string, number>;
}

export default function ShopperReportsPage() {
  const { shopper, token } = useShopperAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<Shop[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);

  useEffect(() => {
    if (!token) {
      router.push('/shopper/login');
      return;
    }
    fetchData();
  }, [token, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/shopper/shops', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        const allShops = data.shops || [];
        setShops(allShops);

        // Calculate statistics
        const paidShops = allShops.filter((s: Shop) => s.paymentStatus === 'PAID');
        const pendingShops = allShops.filter((s: Shop) => s.paymentStatus === 'PENDING');

        // Group by category
        const shopsByCategory: Record<string, number> = {};
        allShops.forEach((shop: Shop) => {
          const category = shop.category || 'Uncategorized';
          shopsByCategory[category] = (shopsByCategory[category] || 0) + 1;
        });

        // Group by plan
        const shopsByPlan: Record<string, number> = {};
        allShops.forEach((shop: Shop) => {
          const plan = shop.planType || 'BASIC';
          shopsByPlan[plan] = (shopsByPlan[plan] || 0) + 1;
        });

        // Calculate total revenue (sum of plan amounts - this is approximate)
        const planAmounts: Record<string, number> = {
          BASIC: 100,
          PREMIUM: 500,
          FEATURED: 1000,
          HERO: 2000,
        };
        const totalRevenue = paidShops.reduce((sum: number, shop: Shop) => {
          return sum + (planAmounts[shop.planType as keyof typeof planAmounts] || 100);
        }, 0);

        setStats({
          totalShops: allShops.length,
          paidShops: paidShops.length,
          pendingShops: pendingShops.length,
          totalRevenue,
          shopsByCategory,
          shopsByPlan,
        });
      } else {
        toast.error(data.error || 'Failed to load data');
      }
    } catch (error: any) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
                <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="text-sm text-gray-600">View your shop statistics and insights</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reports...</p>
          </div>
        ) : stats ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Total Shops</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalShops}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🏪</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Paid Shops</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.paidShops}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Pending Shops</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.pendingShops}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">⏳</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Total Investment</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Shops by Category */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Shops by Category</h2>
                <div className="space-y-4">
                  {Object.entries(stats.shopsByCategory).length > 0 ? (
                    Object.entries(stats.shopsByCategory)
                      .sort(([, a], [, b]) => b - a)
                      .map(([category, count]) => {
                        const percentage = (count / stats.totalShops) * 100;
                        return (
                          <div key={category}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">{category}</span>
                              <span className="text-sm font-bold text-gray-900">{count}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <p className="text-gray-500 text-center py-4">No category data available</p>
                  )}
                </div>
              </div>

              {/* Shops by Plan */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Shops by Plan</h2>
                <div className="space-y-4">
                  {Object.entries(stats.shopsByPlan).length > 0 ? (
                    Object.entries(stats.shopsByPlan)
                      .sort(([, a], [, b]) => b - a)
                      .map(([plan, count]) => {
                        const percentage = (count / stats.totalShops) * 100;
                        return (
                          <div key={plan}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">{plan}</span>
                              <span className="text-sm font-bold text-gray-900">{count}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-gradient-to-r from-green-500 to-teal-500 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <p className="text-gray-500 text-center py-4">No plan data available</p>
                  )}
                </div>
              </div>
            </div>

            {/* All Shops Table */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">All Shops</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Shop Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Area</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Plan</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shops.length > 0 ? (
                      shops.map((shop) => (
                        <tr key={shop._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {shop.photoUrl && (
                                <img
                                  src={shop.photoUrl}
                                  alt={shop.shopName}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              )}
                              <span className="font-medium text-gray-900">{shop.shopName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{shop.category || 'N/A'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{shop.area || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              {shop.planType || 'BASIC'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                shop.paymentStatus === 'PAID'
                                  ? 'bg-green-100 text-green-800'
                                  : shop.paymentStatus === 'PENDING'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {shop.paymentStatus || 'PENDING'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {shop.paymentStatus === 'PENDING' ? (
                              <Link
                                href={`/shopper/shops/${shop._id}/pay`}
                                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                              >
                                Pay Now
                              </Link>
                            ) : shop.shopUrl ? (
                              <a
                                href={shop.shopUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-700 font-medium text-sm"
                              >
                                View Shop
                              </a>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">
                          No shops found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-600">No data available</p>
          </div>
        )}
      </main>
    </div>
  );
}

