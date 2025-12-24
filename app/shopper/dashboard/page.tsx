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

interface DashboardStats {
  totalShops: number;
  activeShops: number;
  pendingShops: number;
  paidShops: number;
}

export default function ShopperDashboardPage() {
  const { shopper, token, logout } = useShopperAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push('/shopper/login');
      return;
    }
    fetchShops();
  }, [token, router]);

  const fetchShops = async () => {
    try {
      setLoadingShops(true);
      const response = await fetch('/api/shopper/shops', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        const allShops = data.shops || [];
        setShops(allShops.slice(0, 10)); // Show recent 10 shops
        
        // Calculate stats
        const activeShops = allShops.filter((s: Shop) => s.paymentStatus === 'PAID');
        const pendingShops = allShops.filter((s: Shop) => s.paymentStatus === 'PENDING');
        
        setStats({
          totalShops: allShops.length,
          activeShops: activeShops.length,
          pendingShops: pendingShops.length,
          paidShops: activeShops.length,
        });
      } else {
        toast.error(data.error || 'Failed to load shops');
      }
    } catch (error: any) {
      console.error('Failed to load shops:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setLoadingShops(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/shopper/login');
    toast.success('Logged out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-200 border-t-cyan-500 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-gray-600 font-medium animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Shopper Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-1">Manage your registered shops</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">{shopper?.name || 'Shopper'}</p>
                <p className="text-xs text-gray-500">Code: {shopper?.shopperCode || 'N/A'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-xl hover:from-pink-500 hover:to-rose-500 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 text-white rounded-3xl shadow-2xl p-8 mb-8 transform hover:scale-[1.02] transition-all duration-500 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-bold mb-3 animate-pulse-slow">
                Welcome, {shopper?.name || 'Shopper'}! 👋
              </h2>
              <p className="text-blue-50 text-lg">
                {shopper?.email && `Email: ${shopper.email}`}
                {shopper?.phone && ` | Phone: ${shopper.phone}`}
              </p>
            </div>
            <div className="text-6xl animate-bounce-slow">✨</div>
          </div>
          {shopper?.isActive === false && (
            <div className="mt-6 p-4 bg-yellow-400/30 backdrop-blur-sm border-2 border-yellow-300/50 rounded-xl animate-shake">
              <p className="text-yellow-50 font-medium">⚠️ Your account is currently inactive. Please contact support.</p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-6 border-l-4 border-cyan-400 transform hover:scale-105 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-2 font-medium">Total Shops</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">{stats?.totalShops || 0}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl flex items-center justify-center shadow-md transform hover:rotate-12 transition-transform duration-300">
                <span className="text-3xl">🏪</span>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-6 border-l-4 border-emerald-400 transform hover:scale-105 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-2 font-medium">Active Shops</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{stats?.activeShops || 0}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl flex items-center justify-center shadow-md transform hover:rotate-12 transition-transform duration-300">
                <span className="text-3xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-6 border-l-4 border-amber-400 transform hover:scale-105 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-2 font-medium">Pending Shops</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{stats?.pendingShops || 0}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center shadow-md transform hover:rotate-12 transition-transform duration-300">
                <span className="text-3xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-6 border-l-4 border-violet-400 transform hover:scale-105 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-2 font-medium">Paid Shops</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">{stats?.paidShops || 0}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-md transform hover:rotate-12 transition-transform duration-300">
                <span className="text-3xl">💳</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          <Link
            href="/shopper/shops/register"
            className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-6 transition-all duration-300 hover:scale-110 text-center border-2 border-transparent hover:border-cyan-300 animate-fade-in-up"
            style={{ animationDelay: '0.5s' }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md group-hover:shadow-xl transform group-hover:rotate-6 transition-all duration-300">
              <span className="text-4xl group-hover:scale-125 transition-transform duration-300">➕</span>
            </div>
            <h3 className="font-semibold text-gray-800 group-hover:text-cyan-600 transition-colors">Register New Shop</h3>
          </Link>

          <Link
            href="/shopper/shops"
            className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-6 transition-all duration-300 hover:scale-110 text-center border-2 border-transparent hover:border-emerald-300 animate-fade-in-up"
            style={{ animationDelay: '0.6s' }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md group-hover:shadow-xl transform group-hover:rotate-6 transition-all duration-300">
              <span className="text-4xl group-hover:scale-125 transition-transform duration-300">📋</span>
            </div>
            <h3 className="font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors">My Shops</h3>
          </Link>

          <Link
            href="/shopper/reports"
            className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-6 transition-all duration-300 hover:scale-110 text-center border-2 border-transparent hover:border-violet-300 animate-fade-in-up"
            style={{ animationDelay: '0.7s' }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md group-hover:shadow-xl transform group-hover:rotate-6 transition-all duration-300">
              <span className="text-4xl group-hover:scale-125 transition-transform duration-300">📊</span>
            </div>
            <h3 className="font-semibold text-gray-800 group-hover:text-violet-600 transition-colors">Reports</h3>
          </Link>

          <Link
            href="/shopper/settings"
            className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-6 transition-all duration-300 hover:scale-110 text-center border-2 border-transparent hover:border-slate-300 animate-fade-in-up"
            style={{ animationDelay: '0.8s' }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md group-hover:shadow-xl transform group-hover:rotate-6 transition-all duration-300">
              <span className="text-4xl group-hover:scale-125 transition-transform duration-300">⚙️</span>
            </div>
            <h3 className="font-semibold text-gray-800 group-hover:text-slate-600 transition-colors">Settings</h3>
          </Link>
        </div>

        {/* Recent Shops */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Recent Shops
            </h2>
            <Link
              href="/shopper/shops"
              className="text-cyan-600 hover:text-cyan-700 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all duration-300 transform hover:scale-105"
            >
              View All <span className="text-lg">→</span>
            </Link>
          </div>

          {loadingShops ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Loading shops...</p>
            </div>
          ) : shops.length > 0 ? (
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
                  {shops.map((shop, index) => (
                    <tr 
                      key={shop._id} 
                      className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 transition-all duration-300 transform hover:scale-[1.01] animate-fade-in-up"
                      style={{ animationDelay: `${1 + index * 0.1}s` }}
                    >
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
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏪</div>
              <p className="text-gray-600 mb-4">No shops registered yet</p>
              <Link
                href="/shopper/shops/register"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Register Your First Shop
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
