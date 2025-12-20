'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';

interface PaymentRecord {
  _id: string;
  orderId: string;
  paymentId?: string;
  shopId: {
    shopName: string;
    ownerName: string;
    mobile: string;
    email?: string;
  };
  agentId?: {
    name: string;
    agentCode: string;
  };
  shopperId?: {
    name: string;
    shopperCode: string;
  };
  planType: string;
  amount: number;
  status: string;
  paymentMode: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  createdAt: string;
  paidAt?: string;
  subscriptionId?: {
    _id: string;
    status: string;
    startDate: string;
    expiryDate: string;
  };
  metadata?: {
    successMessage?: string;
    screenshotUrl?: string;
    receiptNo?: string;
    notes?: string;
  };
}

export default function AdminPaymentsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    userId: '',
    dateRange: 'none',
    planType: 'none',
    status: 'none',
    startDate: '',
    endDate: '',
  });

  const clearFilters = () => {
    setFilters({
      userId: '',
      dateRange: 'none',
      planType: 'none',
      status: 'none',
      startDate: '',
      endDate: '',
    });
  };

  useEffect(() => {
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchPayments();
  }, [token, router, filters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      // Check if all filters are "none" or empty
      const hasActiveFilters = 
        (filters.userId && filters.userId.trim()) ||
        (filters.dateRange && filters.dateRange !== 'none') ||
        (filters.planType && filters.planType !== 'none') ||
        (filters.status && filters.status !== 'none') ||
        filters.startDate ||
        filters.endDate;

      // If no filters are active, show empty results
      if (!hasActiveFilters) {
        setPayments([]);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (filters.userId && filters.userId.trim()) params.append('userId', filters.userId.trim());
      if (filters.dateRange && filters.dateRange !== 'none') params.append('dateRange', filters.dateRange);
      if (filters.planType && filters.planType !== 'none') params.append('planType', filters.planType);
      if (filters.status && filters.status !== 'none') params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/admin/payments?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setPayments(data.payments || []);
      } else {
        toast.error(data.error || 'Failed to fetch payments');
        setPayments([]);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleManualActivate = async (paymentId: string) => {
    if (!confirm('Are you sure you want to manually activate this payment?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Payment activated successfully!');
        fetchPayments();
      } else {
        toast.error(data.error || 'Failed to activate payment');
      }
    } catch (error) {
      console.error('Error activating payment:', error);
      toast.error('Failed to activate payment');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">All Payments</h1>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID / Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.userId}
                  onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                  placeholder="Agent/Shopper ID or Code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10"
                />
                {filters.userId && (
                  <button
                    onClick={() => setFilters({ ...filters, userId: '' })}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    title="Clear"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan Type
              </label>
              <select
                value={filters.planType}
                onChange={(e) => setFilters({ ...filters, planType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="none">None</option>
                <option value="BASIC">Basic</option>
                <option value="PREMIUM">Premium</option>
                <option value="FEATURED">Featured</option>
                <option value="LEFT_BAR">Left Bar</option>
                <option value="RIGHT_SIDE">Right Side</option>
                <option value="BOTTOM_RAIL">Bottom Rail</option>
                <option value="BANNER">Banner</option>
                <option value="HERO">Hero</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="none">None</option>
                <option value="SUCCESS">Success</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="none">None</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>

          {filters.dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={fetchPayments}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shop / Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Success Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.orderId}
                        </div>
                        {payment.paymentId && (
                          <div className="text-xs text-gray-500">
                            {payment.paymentId}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.shopId?.shopName || payment.customerName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {payment.customerPhone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.agentId ? (
                          <div>
                            <div className="text-sm text-gray-900">
                              {payment.agentId.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              Agent: {payment.agentId.agentCode}
                            </div>
                          </div>
                        ) : payment.shopperId ? (
                          <div>
                            <div className="text-sm text-gray-900">
                              {payment.shopperId.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              Shopper: {payment.shopperId.shopperCode}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {payment.planType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₹{(payment.amount / 100).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            payment.status === 'SUCCESS'
                              ? 'bg-green-100 text-green-800'
                              : payment.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : payment.status === 'FAILED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.paidAt
                          ? new Date(payment.paidAt).toLocaleDateString('en-IN')
                          : new Date(payment.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {payment.status === 'SUCCESS' && payment.metadata?.successMessage ? (
                          <div className="max-w-xs">
                            <p className="text-green-700 font-medium text-xs">
                              ✅ {payment.metadata.successMessage}
                            </p>
                          </div>
                        ) : payment.status === 'SUCCESS' ? (
                          <p className="text-green-700 font-medium text-xs">
                            ✅ Payment Successful
                          </p>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {payment.status === 'PENDING' && (
                          <button
                            onClick={() => handleManualActivate(payment._id)}
                            className="text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            Activate
                          </button>
                        )}
                        {payment.subscriptionId && (
                          <div className="text-xs text-gray-500">
                            Sub: {payment.subscriptionId.status}
                          </div>
                        )}
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

