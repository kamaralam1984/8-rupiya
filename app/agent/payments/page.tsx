'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AgentRouteGuard from '@/app/components/AgentRouteGuard';
import Link from 'next/link';

interface Shop {
  _id: string;
  shopName: string;
  ownerName: string;
  mobile: string;
  paymentStatus: 'PAID' | 'PENDING';
  paymentMode: 'CASH' | 'UPI' | 'NONE';
  receiptNo: string;
  amount: number;
  createdAt: string;
}

interface Analytics {
  totalShops: number;
  paidCount: number;
  pendingCount: number;
  totalAmount: number;
  totalCommission: number;
  pendingAmount: number;
  cashPayments: number;
  upiPayments: number;
}

export default function PaymentsPage() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  useEffect(() => {
    fetchPayments();
  }, [dateFilter, paymentFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('agent_token');
      const params = new URLSearchParams();
      if (dateFilter !== 'all') params.append('date', dateFilter);
      if (paymentFilter !== 'all') params.append('payment', paymentFilter);

      const response = await fetch(`/api/agent/payments?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setShops(data.shops);
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Failed to load payments:', error);
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
              <h1 className="text-xl font-bold">Payments</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Filter
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status
                </label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Analytics Cards */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <p className="text-gray-600 text-sm mb-1">Total Amount</p>
                <p className="text-3xl font-bold text-gray-900">₹{analytics.totalAmount}</p>
                <p className="text-xs text-gray-500 mt-1">{analytics.paidCount} paid shops</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <p className="text-gray-600 text-sm mb-1">Total Commission</p>
                <p className="text-3xl font-bold text-green-600">₹{analytics.totalCommission}</p>
                <p className="text-xs text-gray-500 mt-1">20% of paid amount</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <p className="text-gray-600 text-sm mb-1">Pending Amount</p>
                <p className="text-3xl font-bold text-yellow-600">₹{analytics.pendingAmount}</p>
                <p className="text-xs text-gray-500 mt-1">{analytics.pendingCount} pending shops</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <p className="text-gray-600 text-sm mb-1">Payment Methods</p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-700">Cash: {analytics.cashPayments}</p>
                  <p className="text-sm text-gray-700">UPI: {analytics.upiPayments}</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment History Table */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading payments...</p>
            </div>
          ) : shops.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <p className="text-gray-600 text-lg mb-4">No payments found</p>
              <Link
                href="/agent/shops/new"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Add New Shop
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {shops.map((shop) => (
                      <tr key={shop._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{shop.shopName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {shop.ownerName}
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {shop.paymentMode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ₹{shop.amount || 100}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {shop.receiptNo || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(shop.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            href={`/agent/shops/${shop._id}`}
                            className="text-blue-600 hover:text-blue-700 font-semibold"
                          >
                            View
                          </Link>
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
    </AgentRouteGuard>
  );
}
