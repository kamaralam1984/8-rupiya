'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsData {
  summary: {
    totalVisits: number;
    uniqueSessions: number;
    avgSessionDuration?: number;
    maxSessionDuration?: number;
    minSessionDuration?: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
  trafficSources: Array<{ source: string; visits: number; sessions: number }>;
  trafficByDevice: Array<{ device: string; visits: number }>;
  trafficByBrowser: Array<{ browser: string; visits: number }>;
  trafficByCountry: Array<{ country: string; visits: number }>;
  trafficByState?: Array<{ state: string; visits: number }>;
  trafficByDistrict?: Array<{ district: string; visits: number }>;
  trafficByArea?: Array<{ area: string; visits: number }>;
  trafficByPageType: Array<{ pageType: string; visits: number }>;
  topPages: Array<{ page: string; pageTitle?: string; visits: number }>;
  topShops: Array<{ shopId: string; shopName?: string; visits: number }>;
  topCategories: Array<{ category: string; visits: number }>;
  shopClicks?: Array<{ 
    shopId: string; 
    shopName?: string; 
    clicks: number; 
    locations: Array<{ country?: string; state?: string; district?: string; area?: string }> 
  }>;
  sessionDurationDistribution?: Array<{ _id: string | number; count: number }>;
  timeSeriesData: Array<{ date: string; visits: number; sessions: number }>;
  topReferrers: Array<{ referrer: string; visits: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [mounted, setMounted] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate,
        endDate,
      });

      const response = await fetch(`/api/admin/analytics?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setData(result);
      } else {
        toast.error(result.error || 'Failed to fetch analytics');
      }
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
      toast.error(error.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">Loading...</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-gray-500">No analytics data available</div>
        </div>
      </div>
    );
  }

  // Ensure all arrays exist
  const trafficSources = data.trafficSources || [];
  const trafficByDevice = data.trafficByDevice || [];
  const trafficByBrowser = data.trafficByBrowser || [];
  const trafficByCountry = data.trafficByCountry || [];
  const trafficByState = data.trafficByState || [];
  const trafficByDistrict = data.trafficByDistrict || [];
  const trafficByArea = data.trafficByArea || [];
  const trafficByPageType = data.trafficByPageType || [];
  const topPages = data.topPages || [];
  const topShops = data.topShops || [];
  const topCategories = data.topCategories || [];
  const shopClicks = data.shopClicks || [];
  const sessionDurationDistribution = data.sessionDurationDistribution || [];
  const timeSeriesData = data.timeSeriesData || [];
  const topReferrers = data.topReferrers || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Traffic Analysis Dashboard</h1>
            <div className="flex gap-4">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              />
              <button
                onClick={fetchAnalytics}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-sm font-medium text-blue-600 mb-2">Total Visits</h3>
              <p className="text-3xl font-bold text-blue-900">{data.summary.totalVisits.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-sm font-medium text-green-600 mb-2">Unique Sessions</h3>
              <p className="text-3xl font-bold text-green-900">{data.summary.uniqueSessions.toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-sm font-medium text-purple-600 mb-2">Avg. Session Duration</h3>
              <p className="text-3xl font-bold text-purple-900">
                {data.summary.avgSessionDuration 
                  ? `${Math.round(data.summary.avgSessionDuration / 60)}m ${Math.round(data.summary.avgSessionDuration % 60)}s`
                  : 'N/A'}
              </p>
            </div>
            <div className="bg-orange-50 p-6 rounded-lg">
              <h3 className="text-sm font-medium text-orange-600 mb-2">Max Session</h3>
              <p className="text-3xl font-bold text-orange-900">
                {data.summary.maxSessionDuration 
                  ? `${Math.round(data.summary.maxSessionDuration / 60)}m`
                  : 'N/A'}
              </p>
            </div>
            <div className="bg-pink-50 p-6 rounded-lg">
              <h3 className="text-sm font-medium text-pink-600 mb-2">Avg. Visits/Day</h3>
              <p className="text-3xl font-bold text-pink-900">
                {Math.round(data.summary.totalVisits / 30).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Time Series Chart */}
          {timeSeriesData.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Traffic Over Time</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="visits" stroke="#0088FE" name="Visits" />
                  <Line type="monotone" dataKey="sessions" stroke="#00C49F" name="Sessions" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Traffic Sources */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Traffic Sources</h2>
              {trafficSources.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={trafficSources}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="visits"
                        nameKey="source"
                      >
                        {trafficSources.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Source</th>
                          <th className="text-right p-2">Visits</th>
                          <th className="text-right p-2">Sessions</th>
                          <th className="text-right p-2">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trafficSources.map((source) => (
                          <tr key={source.source} className="border-b">
                            <td className="p-2 font-medium">{source.source}</td>
                            <td className="text-right p-2">{source.visits.toLocaleString()}</td>
                            <td className="text-right p-2">{source.sessions.toLocaleString()}</td>
                            <td className="text-right p-2">
                              {data.summary.totalVisits > 0 ? ((source.visits / data.summary.totalVisits) * 100).toFixed(1) : 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">No traffic source data available</div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Traffic by Device</h2>
              {trafficByDevice.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trafficByDevice}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="device" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="visits" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">No device data available</div>
              )}
            </div>
          </div>

          {/* Traffic by Browser and Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Top Browsers</h2>
              {trafficByBrowser.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trafficByBrowser}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="browser" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="visits" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">No browser data available</div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Top Countries</h2>
              {trafficByCountry.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trafficByCountry}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="country" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="visits" fill="#FFBB28" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">No country data available</div>
              )}
            </div>
          </div>

          {/* Page Type Distribution */}
          {trafficByPageType.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Traffic by Page Type</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trafficByPageType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="pageType" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="visits" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Pages, Shops, Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Top Pages</h2>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                {data.topPages.map((page, index) => (
                  <div key={index} className="mb-3 pb-3 border-b last:border-0">
                    <p className="font-medium text-sm">{page.pageTitle || page.page}</p>
                    <p className="text-xs text-gray-500 truncate">{page.page}</p>
                    <p className="text-sm font-semibold text-blue-600">{page.visits} visits</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Top Shops</h2>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                {data.topShops.map((shop, index) => (
                  <div key={index} className="mb-3 pb-3 border-b last:border-0">
                    <p className="font-medium text-sm">{shop.shopName || 'Unknown Shop'}</p>
                    <p className="text-sm font-semibold text-green-600">{shop.visits} visits</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Top Categories</h2>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                {data.topCategories.map((cat, index) => (
                  <div key={index} className="mb-3 pb-3 border-b last:border-0">
                    <p className="font-medium text-sm">{cat.category}</p>
                    <p className="text-sm font-semibold text-purple-600">{cat.visits} visits</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Location-Based Traffic */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Traffic by State</h2>
              {trafficByState.length > 0 ? (
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {trafficByState.map((item, index) => (
                    <div key={index} className="mb-3 pb-3 border-b last:border-0">
                      <p className="font-medium text-sm">{item.state || 'Unknown'}</p>
                      <p className="text-sm font-semibold text-blue-600">{item.visits} visits</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No state data available</div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Traffic by District</h2>
              {trafficByDistrict.length > 0 ? (
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {trafficByDistrict.map((item, index) => (
                    <div key={index} className="mb-3 pb-3 border-b last:border-0">
                      <p className="font-medium text-sm">{item.district || 'Unknown'}</p>
                      <p className="text-sm font-semibold text-green-600">{item.visits} visits</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No district data available</div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Traffic by Area</h2>
              {trafficByArea.length > 0 ? (
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {trafficByArea.map((item, index) => (
                    <div key={index} className="mb-3 pb-3 border-b last:border-0">
                      <p className="font-medium text-sm">{item.area || 'Unknown'}</p>
                      <p className="text-sm font-semibold text-purple-600">{item.visits} visits</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No area data available</div>
              )}
            </div>
          </div>

          {/* Shop Clicks with Location */}
          {shopClicks.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Shop Clicks (कौन से Shop पर Click हुआ)</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Shop Name</th>
                        <th className="text-right p-2">Total Clicks</th>
                        <th className="text-left p-2">Locations (Country, State, District, Area)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shopClicks.map((shop, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2 font-medium">{shop.shopName || shop.shopId || 'Unknown Shop'}</td>
                          <td className="text-right p-2 font-semibold text-green-600">{shop.clicks}</td>
                          <td className="p-2">
                            <div className="flex flex-wrap gap-1">
                              {shop.locations && shop.locations.length > 0 ? (
                                shop.locations.slice(0, 5).map((loc, locIndex) => (
                                  <span key={locIndex} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {[loc.country, loc.state, loc.district, loc.area].filter(Boolean).join(', ') || 'Unknown'}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-500">No location data</span>
                              )}
                              {shop.locations && shop.locations.length > 5 && (
                                <span className="text-xs text-gray-500">+{shop.locations.length - 5} more</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Session Duration Distribution */}
          {sessionDurationDistribution.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Session Duration Distribution (कितना देर Site पर रहे)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sessionDurationDistribution.map(item => ({
                  duration: typeof item._id === 'number' 
                    ? `${Math.round(item._id / 60)}m` 
                    : item._id === '3600+' 
                    ? '60m+' 
                    : `${item._id}s`,
                  count: item.count,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="duration" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Referrers */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Top Referrers</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Referrer</th>
                      <th className="text-right p-2">Visits</th>
                      <th className="text-right p-2">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topReferrers.map((ref, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">
                          <a href={ref.referrer} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block max-w-md">
                            {ref.referrer}
                          </a>
                        </td>
                        <td className="text-right p-2">{ref.visits.toLocaleString()}</td>
                        <td className="text-right p-2">
                          {data.summary.totalVisits > 0 ? ((ref.visits / data.summary.totalVisits) * 100).toFixed(2) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

