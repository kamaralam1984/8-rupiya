'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AgentRouteGuard from '@/app/components/AgentRouteGuard';

interface DailyReport {
  date: string;
  totalShops: number;
  paidCount: number;
  pendingCount: number;
  totalAmountCollected: number;
  totalCommission: number;
  shops: any[];
}

export default function DailyReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const token = localStorage.getItem('agent_token');
      const response = await fetch('/api/agent/reports/daily', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setReport(data.report);
      }
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AgentRouteGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-blue-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="text-white hover:text-blue-200"
              >
                ← Back
              </button>
              <h1 className="text-xl font-bold">Daily Report</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading report...</p>
            </div>
          ) : report ? (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <p className="text-gray-600 text-sm mb-1">Shops Added Today</p>
                  <p className="text-3xl font-bold text-gray-900">{report.totalShops}</p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <p className="text-gray-600 text-sm mb-1">Paid</p>
                  <p className="text-3xl font-bold text-green-600">{report.paidCount}</p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <p className="text-gray-600 text-sm mb-1">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">{report.pendingCount}</p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <p className="text-gray-600 text-sm mb-1">Total Commission</p>
                  <p className="text-3xl font-bold text-blue-600">₹{report.totalCommission}</p>
                </div>
              </div>

              {/* Amount Collected */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Amount Collected</h2>
                <p className="text-3xl font-bold text-gray-900">₹{report.totalAmountCollected}</p>
              </div>

              {/* Today's Shops Table */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Today's Shops</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {report.shops.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            No shops added today
                          </td>
                        </tr>
                      ) : (
                        report.shops.map((shop) => (
                          <tr key={shop._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{shop.shopName}</div>
                              <div className="text-sm text-gray-500">{shop.ownerName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {shop.category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  shop.paymentStatus === 'PAID'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {shop.paymentStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              ₹{shop.amount || 100}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(shop.createdAt).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <p className="text-gray-600">No report data available</p>
            </div>
          )}
        </main>
      </div>
    </AgentRouteGuard>
  );
}

