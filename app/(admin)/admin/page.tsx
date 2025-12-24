'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  totalShops: number;
  activeShops: number;
  totalShoppers: number;
  totalAgents: number;
  totalRevenue: number;
  pendingShops: number;
  totalCategories: number;
  totalPayments: number;
  totalBanners: number;
  activeBanners: number;
  totalPages: number;
  publishedPages: number;
}

interface ChartData {
  date: string;
  shops: number;
  revenue: number;
}

interface CategoryData {
  name: string;
  count: number;
  percentage: number;
}

interface RecentShop {
  _id: string;
  shopName: string;
  status: string;
  category: string;
  location: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [recentShops, setRecentShops] = useState<RecentShop[]>([]);
  const [timeFilter, setTimeFilter] = useState('30');

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return;

      try {
        setLoading(true);

        // Fetch all dashboard data in parallel
        // Note: We fetch both shops and pending shops to get complete statistics
        const [shopsRes, pendingShopsRes, shoppersRes, agentsRes, revenueRes, paymentsRes, categoriesRes, bannersRes, pagesRes] = await Promise.all([
          fetch('/api/admin/shops', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/shops/pending', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/shoppers', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/agents', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/revenue', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/payments', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/categories', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/banners', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/pages', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        // Check for errors in responses
        const responses = [
          { name: 'shops', res: shopsRes },
          { name: 'pendingShops', res: pendingShopsRes },
          { name: 'shoppers', res: shoppersRes },
          { name: 'agents', res: agentsRes },
          { name: 'revenue', res: revenueRes },
          { name: 'payments', res: paymentsRes },
          { name: 'categories', res: categoriesRes },
          { name: 'banners', res: bannersRes },
          { name: 'pages', res: pagesRes },
        ];

        for (const { name, res } of responses) {
          if (!res.ok) {
            console.error(`Error fetching ${name}:`, res.status, res.statusText);
          }
        }

        const [shopsData, pendingShopsData, shoppersData, agentsData, revenueData, paymentsData, categoriesData, bannersData, pagesData] = await Promise.all([
          shopsRes.json().catch(() => ({ shops: [], success: false })),
          pendingShopsRes.json().catch(() => ({ shops: [], success: false })),
          shoppersRes.json().catch(() => ({ shoppers: [], success: false })),
          agentsRes.json().catch(() => ({ agents: [], success: false })),
          revenueRes.json().catch(() => ({ totals: { totalRevenue: 0 }, success: false })),
          paymentsRes.json().catch(() => ({ payments: [], success: false })),
          categoriesRes.json().catch(() => ({ categories: [], success: false })),
          bannersRes.json().catch(() => ({ banners: [], success: false })),
          pagesRes.json().catch(() => ({ pages: [], success: false })),
        ]);

        // Combine all shops (paid + pending) for complete statistics
        const paidShops = shopsData?.shops || [];
        const pendingShopsList = pendingShopsData?.shops || [];
        const allShops = [...paidShops, ...pendingShopsList];
        // Fix: Check both status and paymentStatus, and isActive field
        const activeShops = allShops.filter((s: any) => {
          const isPaid = s.paymentStatus === 'PAID' || s.status === 'PAID';
          const isActive = s.isActive !== false && s.isVisible !== false;
          return isPaid && isActive;
        });
        const pendingShops = allShops.filter((s: any) => 
          s.status === 'PENDING' || s.paymentStatus === 'PENDING'
        );

        setStats({
          totalShops: allShops.length,
          activeShops: activeShops.length,
          totalShoppers: shoppersData?.shoppers?.length || 0,
          totalAgents: agentsData?.agents?.length || 0,
          totalRevenue: revenueData?.totals?.totalRevenue || 0,
          pendingShops: pendingShops.length,
          totalCategories: categoriesData?.categories?.length || 0,
          totalPayments: paymentsData?.payments?.length || 0,
          totalBanners: bannersData?.banners?.length || 0,
          activeBanners: bannersData?.banners?.filter((b: any) => b.isActive).length || 0,
          totalPages: pagesData?.pages?.length || 0,
          publishedPages: pagesData?.pages?.filter((p: any) => p.isPublished).length || 0,
        });

        // Generate chart data (last 30 days)
        const chartDataArray: ChartData[] = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
          
          // Filter shops created on this date
          const shopsOnDate = allShops.filter((s: any) => {
            const shopDate = new Date(s.createdAt);
            return shopDate.toDateString() === date.toDateString();
          });

          chartDataArray.push({
            date: dateStr,
            shops: shopsOnDate.length,
            revenue: Math.random() * 50000, // Mock revenue data
          });
        }
        setChartData(chartDataArray);

        // Calculate category data
        const categoryMap = new Map<string, number>();
        allShops.forEach((shop: any) => {
          const category = shop.category || 'Uncategorized';
          categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
        });

        const totalShopsForCategories = allShops.length || 1;
        const categoryArray: CategoryData[] = Array.from(categoryMap.entries())
          .map(([name, count]) => ({
            name,
            count,
            percentage: Math.round((count / totalShopsForCategories) * 100),
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setCategoryData(categoryArray);

        // Get recent shops
        const recent = allShops
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
          .map((shop: any) => ({
            _id: shop._id,
            shopName: shop.shopName || shop.name || 'Unknown',
            status: shop.status === 'PAID' ? 'Active' : shop.paymentStatus === 'PENDING' ? 'Pending' : 'Inactive',
            category: shop.category || 'Uncategorized',
            location: shop.city || shop.district || 'N/A',
            createdAt: shop.createdAt,
          }));

        setRecentShops(recent);

        // Log for debugging
        console.log('Dashboard data loaded:', {
          totalShops: allShops.length,
          activeShops: activeShops.length,
          totalShoppers: shoppersData?.shoppers?.length || 0,
          totalAgents: agentsData?.agents?.length || 0,
          totalRevenue: revenueData?.totals?.totalRevenue || 0,
        });
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        // Show error to user
        alert(`Error loading dashboard: ${error.message || 'Unknown error'}. Please refresh the page.`);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, timeFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || 'Admin'}! 👋
          </h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your business directory.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-amber-500 rounded-full flex items-center justify-center text-white font-semibold">
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
        </div>
      </div>

      {/* Summary Cards - First Row (Business Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Shops */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Total Shops</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(stats?.totalShops || 0)}</p>
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                +5.3% from last month
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Shops */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Active Shops</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(stats?.activeShops || 0)}</p>
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                +3.2% from last month
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Shoppers */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Total Shoppers</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(stats?.totalShoppers || 0)}</p>
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                +8.9% from last month
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Pending Approvals</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(stats?.pendingShops || 0)}</p>
              <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                +6.9% from last month
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards - Second Row (Content Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Banners */}
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-sm border border-blue-200 p-5 hover:shadow-lg hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Total Banners</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(stats?.totalBanners || 0)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Banners */}
        <div className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-sm border border-green-200 p-5 hover:shadow-lg hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Active Banners</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatNumber(stats?.activeBanners || 0)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Pages */}
        <div className="bg-gradient-to-br from-white to-indigo-50 rounded-xl shadow-sm border border-indigo-200 p-5 hover:shadow-lg hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Pages</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(stats?.totalPages || 0)}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Published */}
        <div className="bg-gradient-to-br from-white to-pink-50 rounded-xl shadow-sm border border-pink-200 p-5 hover:shadow-lg hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-pink-600 uppercase tracking-wide">Published</p>
              <p className="text-2xl font-bold text-pink-600 mt-1">{formatNumber(stats?.publishedPages || 0)}</p>
            </div>
            <div className="p-3 bg-pink-100 rounded-lg">
              <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shops Overview Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Shops Overview</h2>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="shops"
                stroke="#3b82f6"
                strokeWidth={2}
                name="New Shops"
                dot={{ fill: '#3b82f6', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                name="Revenue"
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Categories */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Top Categories</h2>
            <Link
              href="/admin/categories"
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {categoryData.length > 0 ? (
              categoryData.map((category, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{category.name}</span>
                    <span className="text-sm font-bold text-gray-900">{category.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-red-500 to-amber-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No category data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Listings Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Listings</h2>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <Link
              href="/admin/shops"
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              View All
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Business</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Location</th>
              </tr>
            </thead>
            <tbody>
              {recentShops.length > 0 ? (
                recentShops.map((shop) => (
                  <tr key={shop._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/shops/${shop._id}`}
                        className="text-sm font-medium text-gray-900 hover:text-red-600"
                      >
                        {shop.shopName}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          shop.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : shop.status === 'Pending'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {shop.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{shop.category}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{shop.location}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    No recent shops found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Management Cards Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Manage Banners */}
          <Link
            href="/admin/banners"
            className="group relative overflow-hidden bg-gradient-to-br from-amber-50 via-amber-100 to-orange-50 rounded-xl shadow-lg p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/10 to-amber-400/0 group-hover:via-amber-400/20 transition-all duration-500 -translate-x-full group-hover:translate-x-full"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-400/30 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                  <div className="relative p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <svg className="w-5 h-5 text-amber-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 mb-2 group-hover:text-amber-700 transition-colors">Manage Banners</h3>
              <p className="text-sm text-gray-700 mb-4 leading-relaxed">Add, edit, or delete banners for hero, left, right, and bottom sections. Upload images directly from your computer.</p>
              <div className="flex items-center gap-1 text-amber-600 font-bold text-sm group-hover:text-amber-700">
                <span>Go to Banners</span>
                <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Manage Homepage */}
          <Link
            href="/admin/homepage"
            className="group relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 rounded-xl shadow-lg p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-orange-400/10 to-orange-400/0 group-hover:via-orange-400/20 transition-all duration-500 -translate-x-full group-hover:translate-x-full"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-400/30 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                  <div className="relative p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                </div>
                <svg className="w-5 h-5 text-orange-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 mb-2 group-hover:text-orange-700 transition-colors">Manage Homepage</h3>
              <p className="text-sm text-gray-700 mb-4 leading-relaxed">Configure homepage sections, shop settings, and duplicate homepage as new pages with shops and functions.</p>
              <div className="flex items-center gap-1 text-orange-600 font-bold text-sm group-hover:text-orange-700">
                <span>Go to Homepage</span>
                <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Manage Pages */}
          <Link
            href="/admin/pages"
            className="group relative overflow-hidden bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 rounded-xl shadow-lg p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-400/0 via-pink-400/10 to-pink-400/0 group-hover:via-pink-400/20 transition-all duration-500 -translate-x-full group-hover:translate-x-full"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-pink-400/30 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                  <div className="relative p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <svg className="w-5 h-5 text-pink-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 mb-2 group-hover:text-pink-700 transition-colors">Manage Pages</h3>
              <p className="text-sm text-gray-700 mb-4 leading-relaxed">Create, edit, and manage website pages with SEO optimization. Full control over content and publishing.</p>
              <div className="flex items-center gap-1 text-pink-600 font-bold text-sm group-hover:text-pink-700">
                <span>Go to Pages</span>
                <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Manage Slider Images */}
          <Link
            href="/admin/slider-images"
            className="group relative overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-cyan-100 rounded-xl shadow-lg p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/10 to-cyan-400/0 group-hover:via-cyan-400/20 transition-all duration-500 -translate-x-full group-hover:translate-x-full"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-400/30 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                  <div className="relative p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                </div>
                <svg className="w-5 h-5 text-cyan-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 mb-2 group-hover:text-cyan-700 transition-colors">Manage Slider Images</h3>
              <p className="text-sm text-gray-700 mb-4 leading-relaxed">Add, edit, and manage slider images with 20+ transition effects. Configure auto-play, duration, and link URLs.</p>
              <div className="flex items-center gap-1 text-cyan-600 font-bold text-sm group-hover:text-cyan-700">
                <span>Go to Slider Images</span>
                <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Manage Hero Banners */}
          <Link
            href="/admin/hero-banners"
            className="group relative overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50 to-violet-100 rounded-xl shadow-lg p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-400/0 via-violet-400/10 to-violet-400/0 group-hover:via-violet-400/20 transition-all duration-500 -translate-x-full group-hover:translate-x-full"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-violet-400/30 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                  <div className="relative p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <svg className="w-5 h-5 text-violet-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 mb-2 group-hover:text-violet-700 transition-colors">Manage Hero Banners</h3>
              <p className="text-sm text-gray-700 mb-4 leading-relaxed">Add, edit, and manage hero banners for specific pages with 20+ text effects and 20+ animations. Full control over display settings.</p>
              <div className="flex items-center gap-1 text-violet-600 font-bold text-sm group-hover:text-violet-700">
                <span>Go to Hero Banners</span>
                <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Reports & Analytics */}
          <Link
            href="/admin/reports"
            className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100 rounded-xl shadow-lg p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-emerald-400/10 to-emerald-400/0 group-hover:via-emerald-400/20 transition-all duration-500 -translate-x-full group-hover:translate-x-full"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-400/30 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                  <div className="relative p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <svg className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">Reports & Analytics</h3>
              <p className="text-sm text-gray-700 mb-4 leading-relaxed">View revenue reports, agent performance, shop statistics, commission tracking. Export database to Excel/PDF.</p>
              <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm group-hover:text-emerald-700">
                <span>View Reports</span>
                <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
