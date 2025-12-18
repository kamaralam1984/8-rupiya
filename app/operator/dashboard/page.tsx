'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOperatorAuth } from '@/app/contexts/OperatorAuthContext';
import OperatorRouteGuard from '@/app/components/OperatorRouteGuard';
import Link from 'next/link';

interface DashboardStats {
  totalShops: number;
  totalAgents?: number;
  totalOperatorEarnings?: number;
  totalAgentCommission?: number;
  totalOperatorCommission?: number;
}

export default function OperatorDashboard() {
  const { operator, logout } = useOperatorAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    // Auto-refresh dashboard stats every 2 minutes
    const interval = setInterval(() => {
      fetchDashboardStats();
    }, 120000); // Refresh every 2 minutes

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('operator_token');
      const response = await fetch('/api/operator/dashboard', {
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


  const handleLogout = () => {
    logout();
    router.push('/operator/login');
  };

  return (
    <OperatorRouteGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-green-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Operators Panel</h1>
                <p className="text-green-100 text-sm">Agent Management & Commission</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-green-700 hover:bg-green-800 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Actions */}
          <div className="mb-6 flex gap-4">
            <Link
              href="/operator/agents"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              👥 View My Agents
            </Link>
            <Link
              href="/operator/join-agents"
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              ➕ Join Agents
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          ) : (
            <>
              {/* Welcome Card */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      Welcome, {operator?.name}!
                    </h2>
                    <p className="text-gray-600">
                      Operator Code: <span className="font-semibold">{operator?.operatorCode}</span>
                    </p>
                  </div>
                  <Link
                    href="/operator/agents"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    👥 My Agents
                  </Link>
                </div>
              </div>

              {/* Commission Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-green-50 border border-green-200 rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 mb-1">Your Commission</p>
                      <p className="text-3xl font-bold text-green-900">
                        ₹{stats?.totalOperatorCommission?.toLocaleString() || 0}
                      </p>
                      <p className="text-xs text-green-700 mt-1">15% of remaining</p>
                    </div>
                    <div className="text-4xl">💰</div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 mb-1">Agents Commission</p>
                      <p className="text-3xl font-bold text-blue-900">
                        ₹{stats?.totalAgentCommission?.toLocaleString() || 0}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">20% of payment</p>
                    </div>
                    <div className="text-4xl">💵</div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 mb-1">My Agents</p>
                      <p className="text-3xl font-bold text-purple-900">
                        {stats?.totalAgents || 0}
                      </p>
                    </div>
                    <div className="text-4xl">👥</div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Shops</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {stats?.totalShops || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Paid shops</p>
                    </div>
                    <div className="bg-blue-100 rounded-full p-3">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Commission Breakdown Section */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Commission Breakdown</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border-l-4 border-green-500 pl-4">
                    <p className="text-sm text-gray-600 mb-1">Total Operator Commission</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{stats?.totalOperatorCommission?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Your earnings from all agents</p>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-4">
                    <p className="text-sm text-gray-600 mb-1">Total Agent Commission</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ₹{stats?.totalAgentCommission?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Agents' total earnings</p>
                  </div>
                </div>
              </div>

            </>
          )}
        </main>
      </div>
    </OperatorRouteGuard>
  );
}

