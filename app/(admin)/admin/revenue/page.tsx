'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';

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
  area?: string; // Area field
  totalShops: number;
  basicPlanShops: number;
  premiumPlanShops: number;
  featuredPlanShops: number;
  totalRevenue: number;
  targetShops: number;
  progressPercentage: number;
}

export default function RevenuePage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState<RevenueData | null>(null);
  const [districts, setDistricts] = useState<District[]>([]); // All districts for dropdown
  const [displayDistricts, setDisplayDistricts] = useState<District[]>([]); // Filtered districts for table
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');

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
          // If response is not JSON, use status text
          errorData = { error: `HTTP ${res.status}: ${res.statusText}` };
        }
        const errorMessage = errorData.error || errorData.details || `HTTP ${res.status}: ${res.statusText}`;
        console.error('Revenue API error:', errorMessage, errorData);
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      
      if (data.success) {
        // Initialize totals with default values if not present
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
        // Use districts for dropdown (all districts) and filteredDistricts for table (filtered)
        setDistricts(data.districts || []); // All districts for dropdown
        setDisplayDistricts(data.filteredDistricts || data.districts || []); // Filtered districts for table display
      } else {
        toast.error(data.error || 'Failed to fetch revenue');
        // Set default values on error
        setTotals({
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
        setDistricts([]);
      }
    } catch (error: any) {
      console.error('Revenue fetch error:', error);
      toast.error(error.message || 'Failed to fetch revenue');
      // Set default values on error
      setTotals({
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
      setDistricts([]);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading revenue data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Revenue Dashboard</h1>
          <div className="flex gap-4">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1">Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => {
                  setSelectedPeriod(e.target.value);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 cursor-pointer hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none pr-8 min-w-[150px]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                }}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1">District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 cursor-pointer hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none pr-8 min-w-[200px]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                }}
              >
                <option value="all">All Districts</option>
                {districts.length > 0 ? (
                  districts.map((d) => (
                    <option key={d._id} value={d.name}>
                      {d.name}
                    </option>
                  ))
                ) : (
                  <option value="all" disabled>No districts available</option>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {!totals && !loading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center mb-8">
            <div className="text-6xl mb-4">💰</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Revenue Data Yet</h2>
            <p className="text-gray-600 mb-4">
              Revenue data will appear here once shops are added with payment information.
            </p>
            <p className="text-sm text-gray-500">
              To start tracking revenue, mark shop payments as done from the Shops page.
            </p>
          </div>
        )}

        {/* Revenue Summary Cards */}
        {totals && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(totals.totalRevenue || 0)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Net Revenue</h3>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(totals.netRevenue || 0)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Agent Commission</h3>
              <p className="text-3xl font-bold text-orange-600">{formatCurrency(totals.totalAgentCommission || 0)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Shops</h3>
              <p className="text-3xl font-bold text-purple-600">
                {((totals.basicPlanCount || 0) + (totals.premiumPlanCount || 0) + (totals.featuredPlanCount || 0) + 
                 (totals.leftBarPlanCount || 0) + (totals.rightBarPlanCount || 0) + (totals.bannerPlanCount || 0) + (totals.heroPlanCount || 0)).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Plan-wise Revenue Breakdown */}
        {totals && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Plan-wise Revenue</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Basic Plan (₹100)</h3>
                <p className="text-2xl font-bold text-blue-600 mb-1">{formatCurrency(totals.basicPlanRevenue || 0)}</p>
                <p className="text-sm text-gray-600">{(totals.basicPlanCount || 0)} shops</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Premium Plan (₹2999/year)</h3>
                <p className="text-2xl font-bold text-green-600 mb-1">{formatCurrency(totals.premiumPlanRevenue || 0)}</p>
                <p className="text-sm text-gray-600">{(totals.premiumPlanCount || 0)} shops</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Featured Plan (₹2388/year)</h3>
                <p className="text-2xl font-bold text-purple-600 mb-1">{formatCurrency(totals.featuredPlanRevenue || 0)}</p>
                <p className="text-sm text-gray-600">{(totals.featuredPlanCount || 0)} shops</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Left Bar (₹3588/year)</h3>
                <p className="text-2xl font-bold text-orange-600 mb-1">{formatCurrency(totals.leftBarPlanRevenue || 0)}</p>
                <p className="text-sm text-gray-600">{(totals.leftBarPlanCount || 0)} shops</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Right Bar (₹3588/year)</h3>
                <p className="text-2xl font-bold text-yellow-600 mb-1">{formatCurrency(totals.rightBarPlanRevenue || 0)}</p>
                <p className="text-sm text-gray-600">{(totals.rightBarPlanCount || 0)} shops</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Banner Plan (₹4788/year)</h3>
                <p className="text-2xl font-bold text-pink-600 mb-1">{formatCurrency(totals.bannerPlanRevenue || 0)}</p>
                <p className="text-sm text-gray-600">{(totals.bannerPlanCount || 0)} shops</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Hero Plan (₹5988/year)</h3>
                <p className="text-2xl font-bold text-indigo-600 mb-1">{formatCurrency(totals.heroPlanRevenue || 0)}</p>
                <p className="text-sm text-gray-600">{(totals.heroPlanCount || 0)} shops</p>
              </div>
            </div>
          </div>
        )}

        {/* District-wise Statistics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">District-wise Progress</h2>
          {displayDistricts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No district data available yet.</p>
              <p className="text-sm text-gray-500">
                District statistics will appear here once shops are added with district information.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">District</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Shops</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target (10L)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayDistricts.map((district) => (
                    <tr key={district._id}>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold">{district.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{district.area || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{district.totalShops.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{district.targetShops.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min(district.progressPercentage || 0, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold">{district.progressPercentage || 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-600">
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

