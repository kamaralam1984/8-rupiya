'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAgentAuth } from '@/app/contexts/AgentAuthContext';
import AgentRouteGuard from '@/app/components/AgentRouteGuard';

interface DashboardStats {
  totalShopsToday: number;
  totalShopsThisMonth: number;
  totalShopsOverall: number;
  totalEarnings: number;
  agentCode: string;
  agentName: string;
  agentPanelText?: string;
  agentPanelTextColor?: 'red' | 'green' | 'blue' | 'black';
}

interface Shop {
  _id: string;
  shopName: string;
  category: string;
  mobile: string;
  pincode: string;
  area: string;
  planType: string;
  paymentStatus: string;
  expiryDate?: string;
  photoUrl?: string;
}

export default function AgentDashboard() {
  const { agent, logout } = useAgentAuth();
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
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('agent_token');
      const response = await fetch('/api/agent/dashboard', {
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
      const token = localStorage.getItem('agent_token');
      const response = await fetch('/api/agent/shops', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        // Show only recent 10 shops on dashboard
        setShops(data.shops.slice(0, 10));
      }
    } catch (error) {
      console.error('Failed to load shops:', error);
    } finally {
      setLoadingShops(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/agent/login');
  };

  return (
    <AgentRouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
        {/* Header */}
        <header className="bg-blue-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Digital India</h1>
                <p className="text-blue-100 text-sm">Field Agent Panel</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : (
            <>
              {/* Welcome Card */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl shadow-xl p-6 mb-8">
                <h2 className="text-3xl font-bold mb-2">Welcome, {agent?.name || 'Agent'}</h2>
                <p className="text-blue-100">Agent ID: {agent?.agentCode || stats?.agentCode || 'N/A'}</p>
                
                {/* Agent Panel Text Display */}
                {stats?.agentPanelText && (
                  <div className="mt-4 pt-4 border-t border-blue-500">
                    <p 
                      className="text-lg font-semibold"
                      style={{
                        color: stats.agentPanelTextColor === 'red' ? '#ef4444' :
                               stats.agentPanelTextColor === 'green' ? '#22c55e' :
                               stats.agentPanelTextColor === 'blue' ? '#3b82f6' :
                               '#ffffff'
                      }}
                    >
                      {stats.agentPanelText}
                    </p>
                  </div>
                )}
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Total Shops Today</p>
                      <p className="text-3xl font-bold text-gray-900">{stats?.totalShopsToday || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📊</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">This Month</p>
                      <p className="text-3xl font-bold text-gray-900">{stats?.totalShopsThisMonth || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📅</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Total Shops</p>
                      <p className="text-3xl font-bold text-gray-900">{stats?.totalShopsOverall || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🏪</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Total Earnings</p>
                      <p className="text-3xl font-bold text-gray-900">₹{stats?.totalEarnings || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">💰</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <Link
                  href="/agent/shops/new"
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105 text-center"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">➕</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Add New Shop</h3>
                </Link>

                <Link
                  href="/agent/shops"
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105 text-center"
                >
                  <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📋</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">My Shops</h3>
                </Link>

                <Link
                  href="/agent/payments"
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105 text-center"
                >
                  <div className="w-16 h-16 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">💳</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Payments</h3>
                </Link>

                <Link
                  href="/agent/map"
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105 text-center"
                >
                  <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🗺️</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Map View</h3>
                </Link>

                <Link
                  href="/agent/reports/daily"
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105 text-center"
                >
                  <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📊</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Daily Report</h3>
                </Link>

                <Link
                  href="/agent/shops/renew"
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105 text-center"
                >
                  <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🔄</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Renew Shops</h3>
                </Link>

                <Link
                  href="/agent/profile"
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105 text-center"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">⚙️</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Settings</h3>
                </Link>
              </div>

              {/* Recent Shops List */}
              <div className="mt-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Recent Shops</h3>
                    <Link
                      href="/agent/shops"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View All →
                    </Link>
                  </div>

                  {loadingShops ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-gray-500 text-sm">Loading shops...</p>
                    </div>
                  ) : shops.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 mb-4">No shops added yet</p>
                      <Link
                        href="/agent/shops/new"
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add Your First Shop
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Shop Name</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Pincode</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Plan</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shops.map((shop) => (
                            <tr key={shop._id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  {shop.photoUrl && (
                                    <img
                                      src={shop.photoUrl}
                                      alt={shop.shopName}
                                      className="w-10 h-10 rounded-lg object-cover"
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium text-gray-900">{shop.shopName}</p>
                                    <p className="text-xs text-gray-500">{shop.area}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">{shop.category}</td>
                              <td className="py-3 px-4 text-sm text-gray-600">{shop.pincode}</td>
                              <td className="py-3 px-4">
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                                  shop.planType === 'HERO' ? 'bg-purple-100 text-purple-700' :
                                  shop.planType === 'LEFT_BAR' ? 'bg-blue-100 text-blue-700' :
                                  shop.planType === 'RIGHT_SIDE' ? 'bg-green-100 text-green-700' :
                                  shop.planType === 'BOTTOM_RAIL' ? 'bg-yellow-100 text-yellow-700' :
                                  shop.planType === 'PREMIUM' ? 'bg-indigo-100 text-indigo-700' :
                                  shop.planType === 'FEATURED' ? 'bg-pink-100 text-pink-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {shop.planType}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                                  shop.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' :
                                  shop.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {shop.paymentStatus}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <Link
                                  href={`/agent/shops/${shop._id}`}
                                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                  View Details
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </AgentRouteGuard>
  );
}

