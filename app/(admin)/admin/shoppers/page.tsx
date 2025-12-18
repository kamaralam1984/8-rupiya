'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';

interface Shopper {
  id: string;
  name: string;
  phone: string;
  email: string;
  shopperCode: string;
  isActive: boolean;
  isVerified: boolean;
  totalShops: number;
  createdAt: string;
}

export default function ShoppersPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [shoppers, setShoppers] = useState<Shopper[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [approveLoading, setApproveLoading] = useState<string | null>(null);
  const [rejectLoading, setRejectLoading] = useState<string | null>(null);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchShoppers();
    }
  }, [token, filterStatus]);

  const fetchShoppers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const response = await fetch(`/api/admin/shoppers?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setShoppers(data.shoppers || []);
      } else {
        toast.error(data.error || 'Failed to load shoppers');
      }
    } catch (error) {
      console.error('Failed to load shoppers:', error);
      toast.error('Failed to load shoppers');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (shopperId: string, shopperName: string) => {
    try {
      setApproveLoading(shopperId);
      const response = await fetch(`/api/admin/shoppers/${shopperId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Shopper "${shopperName}" approved successfully`);
        fetchShoppers();
      } else {
        toast.error(data.error || 'Failed to approve shopper');
      }
    } catch (error: any) {
      console.error('Approve shopper error:', error);
      toast.error(error.message || 'Failed to approve shopper');
    } finally {
      setApproveLoading(null);
    }
  };

  const handleReject = async (shopperId: string, shopperName: string) => {
    const confirmMessage = `Are you sure you want to reject shopper "${shopperName}"?\n\nThis will deactivate their account.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setRejectLoading(shopperId);
      const response = await fetch(`/api/admin/shoppers/${shopperId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Rejected by admin' }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Shopper "${shopperName}" rejected successfully`);
        fetchShoppers();
      } else {
        toast.error(data.error || 'Failed to reject shopper');
      }
    } catch (error: any) {
      console.error('Reject shopper error:', error);
      toast.error(error.message || 'Failed to reject shopper');
    } finally {
      setRejectLoading(null);
    }
  };

  const handleToggleActive = async (shopperId: string, shopperName: string) => {
    try {
      setToggleLoading(shopperId);
      const response = await fetch(`/api/admin/shoppers/${shopperId}/toggle-active`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message || 'Shopper status updated');
        fetchShoppers();
      } else {
        toast.error(data.error || 'Failed to update shopper status');
      }
    } catch (error: any) {
      console.error('Toggle shopper status error:', error);
      toast.error(error.message || 'Failed to update shopper status');
    } finally {
      setToggleLoading(null);
    }
  };

  const pendingCount = shoppers.filter(s => !s.isVerified).length;
  const verifiedCount = shoppers.filter(s => s.isVerified).length;
  const activeCount = shoppers.filter(s => s.isActive).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shoppers Management</h1>
          <p className="text-gray-600 mt-1">Manage and approve shopper accounts</p>
        </div>
        <Link
          href="/admin"
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Shoppers</h3>
          <p className="text-3xl font-bold text-gray-900">{shoppers.length}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl shadow-md p-6 border border-yellow-200">
          <h3 className="text-yellow-700 text-sm font-semibold mb-2">Pending Approval</h3>
          <p className="text-3xl font-bold text-yellow-700">{pendingCount}</p>
        </div>
        <div className="bg-green-50 rounded-xl shadow-md p-6 border border-green-200">
          <h3 className="text-green-700 text-sm font-semibold mb-2">Verified</h3>
          <p className="text-3xl font-bold text-green-700">{verifiedCount}</p>
        </div>
        <div className="bg-blue-50 rounded-xl shadow-md p-6 border border-blue-200">
          <h3 className="text-blue-700 text-sm font-semibold mb-2">Active</h3>
          <p className="text-3xl font-bold text-blue-700">{activeCount}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({shoppers.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filterStatus === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('verified')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filterStatus === 'verified'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Verified ({verifiedCount})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filterStatus === 'active'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Active ({activeCount})
          </button>
        </div>
      </div>

      {/* Shoppers Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : shoppers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No shoppers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shopper Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Shops
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shoppers.map((shopper) => (
                  <tr key={shopper.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{shopper.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{shopper.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{shopper.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-blue-600">{shopper.shopperCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{shopper.totalShops || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            shopper.isVerified
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {shopper.isVerified ? '✓ Verified' : '⏳ Pending'}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            shopper.isActive
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {shopper.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(shopper.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {!shopper.isVerified && (
                          <>
                            <button
                              onClick={() => handleApprove(shopper.id, shopper.name)}
                              disabled={approveLoading === shopper.id}
                              className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-xs font-semibold"
                            >
                              {approveLoading === shopper.id ? 'Approving...' : '✓ Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(shopper.id, shopper.name)}
                              disabled={rejectLoading === shopper.id}
                              className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-xs font-semibold"
                            >
                              {rejectLoading === shopper.id ? 'Rejecting...' : '✗ Reject'}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleToggleActive(shopper.id, shopper.name)}
                          disabled={toggleLoading === shopper.id}
                          className={`px-3 py-1 rounded-lg transition-colors disabled:opacity-50 text-xs font-semibold ${
                            shopper.isActive
                              ? 'bg-orange-600 text-white hover:bg-orange-700'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {toggleLoading === shopper.id
                            ? 'Updating...'
                            : shopper.isActive
                            ? 'Deactivate'
                            : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


