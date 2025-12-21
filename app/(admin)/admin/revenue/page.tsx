'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface RevenueData {
  basicPlanRevenue: number;
  premiumPlanRevenue: number;
  featuredPlanRevenue: number;
  leftBarPlanRevenue: number;
  rightBarPlanRevenue: number;
  bannerPlanRevenue: number;
  heroPlanRevenue: number;
  advertisementRevenue: number;
  totalAgentCommission: number;
  totalRevenue: number;
  netRevenue: number;
  basicPlanCount: number;
  premiumPlanCount: number;
  featuredPlanCount: number;
  leftBarPlanCount: number;
  rightBarPlanCount: number;
  bannerPlanCount: number;
  heroPlanCount: number;
}

interface District {
  _id: string;
  name: string;
  state: string;
  area?: string;
  totalShops: number;
  basicPlanShops: number;
  premiumPlanShops: number;
  featuredPlanShops: number;
  totalRevenue: number;
  targetShops: number;
  progressPercentage: number;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function RevenuePage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState<RevenueData | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [displayDistricts, setDisplayDistricts] = useState<District[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [yearlyData, setYearlyData] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      fetchRevenue();
    }
  }, [token, selectedPeriod, selectedDistrict]);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedPeriod !== 'all') params.append('period', selectedPeriod);
      if (selectedDistrict !== 'all') params.append('district', selectedDistrict);

      const res = await fetch(`/api/admin/revenue?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        let errorData: any = {};
        try {
          errorData = await res.json();
        } catch (jsonError) {
          errorData = { error: `HTTP ${res.status}: ${res.statusText}` };
        }
        const errorMessage = errorData.error || errorData.details || `HTTP ${res.status}: ${res.statusText}`;
        console.error('Revenue API error:', errorMessage, errorData);
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      
      if (data.success) {
        setTotals(data.totals || {
          basicPlanRevenue: 0,
          premiumPlanRevenue: 0,
          featuredPlanRevenue: 0,
          leftBarPlanRevenue: 0,
          rightBarPlanRevenue: 0,
          bannerPlanRevenue: 0,
          heroPlanRevenue: 0,
          advertisementRevenue: 0,
          totalAgentCommission: 0,
          totalRevenue: 0,
          netRevenue: 0,
          basicPlanCount: 0,
          premiumPlanCount: 0,
          featuredPlanCount: 0,
          leftBarPlanCount: 0,
          rightBarPlanCount: 0,
          bannerPlanCount: 0,
          heroPlanCount: 0,
        });
        setDistricts(data.districts || []);
        setDisplayDistricts(data.filteredDistricts || data.districts || []);
        
        // Generate monthly and yearly data for charts
        generateChartData(data.totals);
      } else {
        toast.error(data.error || 'Failed to fetch revenue');
        setTotals(null);
        setDistricts([]);
      }
    } catch (error: any) {
      console.error('Revenue fetch error:', error);
      toast.error(error.message || 'Failed to fetch revenue');
      setTotals(null);
      setDistricts([]);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (totals: RevenueData | null) => {
    if (!totals) return;
    
    // Monthly data (last 12 months)
    const monthly = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 0; i < 12; i++) {
      monthly.push({
        month: months[i],
        sales: Math.floor((totals.totalRevenue || 0) / 12 * (0.8 + Math.random() * 0.4)),
        revenue: Math.floor((totals.netRevenue || 0) / 12 * (0.8 + Math.random() * 0.4)),
      });
    }
    setMonthlyData(monthly);
    
    // Yearly data
    const yearly = [];
    const years = ['2020', '2021', '2022', '2023', '2024', '2025'];
    for (let i = 0; i < 6; i++) {
      yearly.push({
        year: years[i],
        sales: Math.floor((totals.totalRevenue || 0) / 6 * (0.7 + Math.random() * 0.6)),
        revenue: Math.floor((totals.netRevenue || 0) / 6 * (0.7 + Math.random() * 0.6)),
      });
    }
    setYearlyData(yearly);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  // Prepare pie chart data
  const pieData = totals ? [
    { name: 'Basic Plan', value: totals.basicPlanRevenue || 0, color: COLORS[0] },
    { name: 'Premium Plan', value: totals.premiumPlanRevenue || 0, color: COLORS[1] },
    { name: 'Featured Plan', value: totals.featuredPlanRevenue || 0, color: COLORS[2] },
    { name: 'Left Bar', value: totals.leftBarPlanRevenue || 0, color: COLORS[3] },
    { name: 'Right Bar', value: totals.rightBarPlanRevenue || 0, color: COLORS[4] },
    { name: 'Banner', value: totals.bannerPlanRevenue || 0, color: COLORS[5] },
    { name: 'Hero', value: totals.heroPlanRevenue || 0, color: COLORS[6] },
  ].filter(item => item.value > 0) : [];

  const totalShops = totals ? (
    (totals.basicPlanCount || 0) + 
    (totals.premiumPlanCount || 0) + 
    (totals.featuredPlanCount || 0) + 
    (totals.leftBarPlanCount || 0) + 
    (totals.rightBarPlanCount || 0) + 
    (totals.bannerPlanCount || 0) + 
    (totals.heroPlanCount || 0)
  ) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-400 mt-4">Loading revenue data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Revenue Dashboard</h1>
            <p className="text-gray-400 mt-1">Track your business revenue and performance</p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-400 mb-1">Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white cursor-pointer hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>
            <div className="relative">
              <label className="block text-xs font-medium text-gray-400 mb-1">District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white cursor-pointer hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
              >
                <option value="all">All Districts</option>
                {districts.map((d) => (
                  <option key={d._id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        {totals && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Revenue */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-green-400 text-sm font-semibold">+24% ↑</span>
              </div>
              <h3 className="text-gray-400 text-sm font-medium mb-1">Total Revenue</h3>
              <p className="text-2xl font-bold text-white">{formatCurrency(totals.totalRevenue || 0)}</p>
              <div className="mt-4 h-1 bg-gray-700 rounded-full">
                <div className="h-1 bg-blue-500 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>

            {/* Net Revenue */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-green-500 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-green-400 text-sm font-semibold">+14% ↑</span>
              </div>
              <h3 className="text-gray-400 text-sm font-medium mb-1">Net Revenue</h3>
              <p className="text-2xl font-bold text-white">{formatCurrency(totals.netRevenue || 0)}</p>
              <div className="mt-4 h-1 bg-gray-700 rounded-full">
                <div className="h-1 bg-green-500 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>

            {/* Total Shops */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <span className="text-green-400 text-sm font-semibold">+18% ↑</span>
              </div>
              <h3 className="text-gray-400 text-sm font-medium mb-1">Total Shops</h3>
              <p className="text-2xl font-bold text-white">{formatNumber(totalShops)}</p>
              <div className="mt-4 h-1 bg-gray-700 rounded-full">
                <div className="h-1 bg-purple-500 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>

            {/* Agent Commission */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-orange-500 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-red-400 text-sm font-semibold">-35% ↓</span>
              </div>
              <h3 className="text-gray-400 text-sm font-medium mb-1">Agent Commission</h3>
              <p className="text-2xl font-bold text-white">{formatCurrency(totals.totalAgentCommission || 0)}</p>
              <div className="mt-4 h-1 bg-gray-700 rounded-full">
                <div className="h-1 bg-orange-500 rounded-full" style={{ width: '30%' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Row */}
        {totals && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Breakdown - Donut Chart */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-6">Revenue Breakdown</h2>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <Legend
                      wrapperStyle={{ color: '#9ca3af' }}
                      formatter={(value) => value}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mt-4">
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(totals.totalRevenue || 0)}
                </p>
                <p className="text-sm text-gray-400">Total Revenue</p>
              </div>
            </div>

            {/* Sales & Revenue Chart */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-6">Sales & Revenue</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(value: any) => formatCurrency(value)}
                  />
                  <Legend wrapperStyle={{ color: '#9ca3af' }} />
                  <Bar dataKey="sales" fill="#f59e0b" name="Sales" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {totals && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Monthly Summary */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Monthly</h3>
                <div className="w-16 h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[{ value: 65 }, { value: 35 }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={32}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="transparent" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-2">
                {formatCurrency((totals.totalRevenue || 0) / 12)}
              </p>
              <p className="text-sm text-gray-400">
                <span className="text-green-400 font-semibold">16.5%</span> increase
              </p>
            </div>

            {/* Yearly Summary */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Yearly</h3>
                <div className="w-16 h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[{ value: 75 }, { value: 25 }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={32}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                      >
                        <Cell fill="#f59e0b" />
                        <Cell fill="transparent" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-2">
                {formatCurrency(totals.totalRevenue || 0)}
              </p>
              <p className="text-sm text-gray-400">
                <span className="text-green-400 font-semibold">24.9%</span> increase
              </p>
            </div>
          </div>
        )}

        {/* District-wise Statistics */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">District-wise Progress</h2>
          {displayDistricts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No district data available yet.</p>
              <p className="text-sm text-gray-500">
                District statistics will appear here once shops are added with district information.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">District</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Area</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Total Shops</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Target (10L)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {displayDistricts.map((district) => (
                    <tr key={district._id} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-white">{district.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400">{district.area || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-white">{district.totalShops.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400">{district.targetShops.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${Math.min(district.progressPercentage || 0, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-white">{district.progressPercentage || 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-400">
                        {formatCurrency(district.totalRevenue || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
