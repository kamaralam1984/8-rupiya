'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAgentAuth } from '@/app/contexts/AgentAuthContext';
import AgentRouteGuard from '@/app/components/AgentRouteGuard';

interface DashboardStats {
  totalShopsToday: number;
  totalShopsThisMonth: number;
  totalShopsOverall: number;
  totalEarnings: number;
  agentCode: string;
  agentName: string;
  agentPanelText?: string;
  agentPanelTextColor?: 'red' | 'green' | 'blue' | 'black';
}

export default function AgentDashboard() {
  const { agent, logout } = useAgentAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    // Auto-refresh dashboard stats every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardStats();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('agent_token');
      const response = await fetch('/api/agent/dashboard', {
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
    router.push('/agent/login');
  };

  return (
    <AgentRouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
        {/* Header */}
        <header className="bg-blue-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Digital India</h1>
                <p className="text-blue-100 text-sm">Field Agent Panel</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : (
            <>
              {/* Welcome Card */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl shadow-xl p-6 mb-8">
                <h2 className="text-3xl font-bold mb-2">Welcome, {agent?.name || 'Agent'}</h2>
                <p className="text-blue-100">Agent ID: {agent?.agentCode || stats?.agentCode || 'N/A'}</p>
                
                {/* Agent Panel Text Display */}
                {stats?.agentPanelText && (
                  <div className="mt-4 pt-4 border-t border-blue-500">
                    <p 
                      className="text-lg font-semibold"
                      style={{
                        color: stats.agentPanelTextColor === 'red' ? '#ef4444' :
                               stats.agentPanelTextColor === 'green' ? '#22c55e' :
                               stats.agentPanelTextColor === 'blue' ? '#3b82f6' :
                               '#ffffff'
                      }}
                    >
                      {stats.agentPanelText}
                    </p>
                  </div>
                )}
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Total Shops Today</p>
                      <p className="text-3xl font-bold text-gray-900">{stats?.totalShopsToday || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📊</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">This Month</p>
                      <p className="text-3xl font-bold text-gray-900">{stats?.totalShopsThisMonth || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📅</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Total Shops</p>
                      <p className="text-3xl font-bold text-gray-900">{stats?.totalShopsOverall || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🏪</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Total Earnings</p>
                      <p className="text-3xl font-bold text-gray-900">₹{stats?.totalEarnings || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">💰</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <Link
                  href="/agent/shops/new"
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105 text-center"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">➕</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Add New Shop</h3>
                </Link>

                <Link
                  href="/agent/shops"
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105 text-center"
                >
                  <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📋</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">My Shops</h3>
                </Link>

                <Link
                  href="/agent/payments"
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105 text-center"
                >
                  <div className="w-16 h-16 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">💳</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Payments</h3>
                </Link>

                <Link
                  href="/agent/map"
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105 text-center"
                >
                  <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🗺️</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Map View</h3>
                </Link>

                <Link
                  href="/agent/reports/daily"
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105 text-center"
                >
                  <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📊</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Daily Report</h3>
                </Link>

                <Link
                  href="/agent/shops/renew"
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105 text-center"
                >
                  <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🔄</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Renew Shops</h3>
                </Link>

                <Link
                  href="/agent/profile"
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105 text-center"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">⚙️</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Settings</h3>
                </Link>
              </div>
            </>
          )}
        </main>
      </div>
    </AgentRouteGuard>
  );
}

