'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RevenueData {
  totalRevenue: number;
  basicPlan: { count: number; amount: number };
  premiumPlan: { count: number; amount: number };
  featuredPlan: { count: number; amount: number };
  leftBarPlan: { count: number; amount: number };
  rightSidePlan: { count: number; amount: number };
  bottomRailPlan: { count: number; amount: number };
  bannerPlan: { count: number; amount: number };
  heroPlan: { count: number; amount: number };
}

interface AgentPerformance {
  _id: string;
  agentCode: string;
  agentName: string;
  totalShops: number;
  totalEarnings: number;
  pendingPayment: number;
  paidAmount: number;
  shopsToday: number;
  shopsThisMonth: number;
}

interface ShopSummary {
  totalShops: number;
  paidShops: number;
  pendingShops: number;
  expiredShops: number;
  activeShops: number;
}

export default function AdminReportsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [shopSummary, setShopSummary] = useState<ShopSummary | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'revenue' | 'agents' | 'shops'>('overview');
  const [exporting, setExporting] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchReportsData();
  }, [token]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [revenueRes, agentsRes, shopsRes] = await Promise.all([
        fetch('/api/admin/revenue', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/admin/reports/agents', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/admin/reports/shops-summary', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const [revenueData, agentsData, shopsData] = await Promise.all([
        revenueRes.json(),
        agentsRes.json(),
        shopsRes.json(),
      ]);

      console.log('📊 Revenue API Response:', revenueData);
      console.log('👥 Agents API Response:', agentsData);
      console.log('🏪 Shops API Response:', shopsData);
      
      // Debug: Log agent details
      if (agentsData.success && agentsData.agents) {
        console.log('🔍 Agent Performance Details:', agentsData.agents.map((a: any) => ({
          name: a.agentName,
          code: a.agentCode,
          totalShops: a.totalShops,
          earnings: a.totalEarnings
        })));
      }

      // Transform revenue data from API format to expected format
      if (revenueData.success && revenueData.totals) {
        const transformed: RevenueData = {
          totalRevenue: revenueData.totals.totalRevenue || 0,
          basicPlan: {
            count: revenueData.totals.basicPlanCount || 0,
            amount: revenueData.totals.basicPlanRevenue || 0,
          },
          premiumPlan: {
            count: revenueData.totals.premiumPlanCount || 0,
            amount: revenueData.totals.premiumPlanRevenue || 0,
          },
          featuredPlan: {
            count: revenueData.totals.featuredPlanCount || 0,
            amount: revenueData.totals.featuredPlanRevenue || 0,
          },
          leftBarPlan: {
            count: revenueData.totals.leftBarPlanCount || 0,
            amount: revenueData.totals.leftBarPlanRevenue || 0,
          },
          rightSidePlan: {
            count: revenueData.totals.rightBarPlanCount || 0,
            amount: revenueData.totals.rightBarPlanRevenue || 0,
          },
          bottomRailPlan: {
            count: revenueData.totals.bottomRailPlanCount || 0,
            amount: revenueData.totals.bottomRailPlanRevenue || 0,
          },
          bannerPlan: {
            count: revenueData.totals.bannerPlanCount || 0,
            amount: revenueData.totals.bannerPlanRevenue || 0,
          },
          heroPlan: {
            count: revenueData.totals.heroPlanCount || 0,
            amount: revenueData.totals.heroPlanRevenue || 0,
          },
        };
        setRevenueData(transformed);
        console.log('Transformed Revenue Data:', transformed); // Debug log
      }
      if (agentsData.success) {
        console.log('🔍 Agent Performance Details:', agentsData.agents);
        setAgentPerformance(agentsData.agents);
      }
      if (shopsData.success) setShopSummary(shopsData.summary);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
      // Trigger page loaded animation
      setTimeout(() => setPageLoaded(true), 100);
    }
  };

  const exportToExcel = async () => {
    try {
      setExporting(true);
      const response = await fetch('/api/admin/reports/export?format=excel', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(errorData.error || 'Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Use CSV extension since backend returns CSV format
      a.download = `database-backup-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error.message || 'Please try again.'}`);
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    try {
      setExporting(true);
      
      // Open PDF report in new tab for printing
      const url = `/api/admin/reports/export?format=pdf&token=${encodeURIComponent(token || '')}`;
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        // Wait for content to load, then trigger print dialog
        printWindow.addEventListener('load', () => {
          setTimeout(() => {
            printWindow.print();
          }, 1000);
        });
      } else {
        alert('Please allow popups to export PDF. Then try again.');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return '₹0';
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className={`bg-white shadow-sm sticky top-0 z-10 transition-all duration-500 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                ← Back to Dashboard
              </Link>
              <div className="h-8 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">📊 Reports & Analytics</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToExcel}
                disabled={exporting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all duration-300 flex items-center gap-2 transform hover:scale-105 active:scale-95 hover:shadow-lg"
              >
                <span>📊</span>
                {exporting ? 'Exporting...' : 'Export Excel'}
              </button>
              <button
                onClick={exportToPDF}
                disabled={exporting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all duration-300 flex items-center gap-2 transform hover:scale-105 active:scale-95 hover:shadow-lg"
              >
                <span>📄</span>
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-700 delay-100 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Debug Panel - Only show if no data */}
        {(!revenueData || !agentPerformance.length || !shopSummary) && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
            <h3 className="text-yellow-800 font-bold mb-2">⚠️ Data Loading Status</h3>
            <div className="space-y-2 text-sm">
              <p>Revenue Data: {revenueData ? '✅ Loaded' : '❌ Not loaded'}</p>
              <p>Agent Performance: {agentPerformance.length > 0 ? `✅ ${agentPerformance.length} agents` : '❌ No agents'}</p>
              <p>Shop Summary: {shopSummary ? '✅ Loaded' : '❌ Not loaded'}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchReportsData}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                🔄 Retry Loading Data
              </button>
            </div>
          </div>
        )}

        {/* View Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-2 flex gap-2">
          <button
            onClick={() => setSelectedView('overview')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              selectedView === 'overview'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📈 Overview
          </button>
          <button
            onClick={() => setSelectedView('revenue')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              selectedView === 'revenue'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            💰 Revenue
          </button>
          <button
            onClick={() => setSelectedView('agents')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              selectedView === 'agents'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            👥 Agents
          </button>
          <button
            onClick={() => setSelectedView('shops')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              selectedView === 'shops'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🏪 Shops
          </button>
        </div>

        {/* Overview Section */}
        {selectedView === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="text-3xl mb-2">💰</div>
                <p className="text-blue-100 text-sm mb-1">Total Revenue</p>
                <p className="text-3xl font-bold">{formatCurrency(revenueData?.totalRevenue || 0)}</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="text-3xl mb-2">🏪</div>
                <p className="text-green-100 text-sm mb-1">Total Shops</p>
                <p className="text-3xl font-bold">{shopSummary?.totalShops || 0}</p>
                <p className="text-green-100 text-xs mt-1">
                  {shopSummary?.activeShops || 0} active
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="text-3xl mb-2">👥</div>
                <p className="text-purple-100 text-sm mb-1">Total Agents</p>
                <p className="text-3xl font-bold">{agentPerformance.length}</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <div className="text-3xl mb-2">⏳</div>
                <p className="text-orange-100 text-sm mb-1">Pending Payments</p>
                <p className="text-3xl font-bold">{shopSummary?.pendingShops || 0}</p>
              </div>
            </div>

            {/* Company Progress Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-700 delay-300 hover:shadow-xl animate-fade-in-up">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📈 Company Progress</h2>
              
              <div className="space-y-6">
                {/* Total Shops Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏪</span>
                      <span className="font-semibold text-gray-700">Total Shops</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900">{shopSummary?.totalShops || 0}</span>
                      <span className="text-sm text-gray-500 ml-1">/ 10,000 target</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2 progress-bar-animated"
                      style={{
                        width: `${Math.min(((shopSummary?.totalShops || 0) / 10000) * 100, 100)}%`
                      }}
                    >
                      <span className="text-xs font-bold text-white">
                        {Math.round(((shopSummary?.totalShops || 0) / 10000) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Revenue Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💰</span>
                      <span className="font-semibold text-gray-700">Total Revenue</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(revenueData?.totalRevenue || 0)}</span>
                      <span className="text-sm text-gray-500 ml-1">/ ₹10,00,000 target</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2 progress-bar-animated"
                      style={{
                        width: `${Math.min(((revenueData?.totalRevenue || 0) / 1000000) * 100, 100)}%`
                      }}
                    >
                      <span className="text-xs font-bold text-white">
                        {Math.round(((revenueData?.totalRevenue || 0) / 1000000) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Completion Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">✅</span>
                      <span className="font-semibold text-gray-700">Payment Completion Rate</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900">
                        {shopSummary?.totalShops 
                          ? Math.round((shopSummary.paidShops / shopSummary.totalShops) * 100)
                          : 0}%
                      </span>
                      <span className="text-sm text-gray-500 ml-1">
                        ({shopSummary?.paidShops || 0} paid / {shopSummary?.totalShops || 0} total)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-4 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2 progress-bar-animated"
                      style={{
                        width: `${shopSummary?.totalShops 
                          ? Math.round((shopSummary.paidShops / shopSummary.totalShops) * 100)
                          : 0}%`
                      }}
                    >
                      <span className="text-xs font-bold text-white">
                        {shopSummary?.totalShops 
                          ? Math.round((shopSummary.paidShops / shopSummary.totalShops) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active Shops Percentage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🟢</span>
                      <span className="font-semibold text-gray-700">Active Shops Rate</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900">
                        {shopSummary?.totalShops 
                          ? Math.round((shopSummary.activeShops / shopSummary.totalShops) * 100)
                          : 0}%
                      </span>
                      <span className="text-sm text-gray-500 ml-1">
                        ({shopSummary?.activeShops || 0} active / {shopSummary?.totalShops || 0} total)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-teal-600 h-4 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2 progress-bar-animated"
                      style={{
                        width: `${shopSummary?.totalShops 
                          ? Math.round((shopSummary.activeShops / shopSummary.totalShops) * 100)
                          : 0}%`
                      }}
                    >
                      <span className="text-xs font-bold text-white">
                        {shopSummary?.totalShops 
                          ? Math.round((shopSummary.activeShops / shopSummary.totalShops) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Agent Performance Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👥</span>
                      <span className="font-semibold text-gray-700">Agent Performance</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900">
                        {agentPerformance.length > 0
                          ? Math.round((agentPerformance.filter(a => a.totalShops > 0).length / agentPerformance.length) * 100)
                          : 0}%
                      </span>
                      <span className="text-sm text-gray-500 ml-1">
                        ({agentPerformance.filter(a => a.totalShops > 0).length} active / {agentPerformance.length} total)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-4 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2 progress-bar-animated"
                      style={{
                        width: `${agentPerformance.length > 0
                          ? Math.round((agentPerformance.filter(a => a.totalShops > 0).length / agentPerformance.length) * 100)
                          : 0}%`
                      }}
                    >
                      <span className="text-xs font-bold text-white">
                        {agentPerformance.length > 0
                          ? Math.round((agentPerformance.filter(a => a.totalShops > 0).length / agentPerformance.length) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Agents */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">🏆 Top Performing Agents</h3>
                {agentPerformance.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-2">No agent data available</p>
                    <p className="text-sm text-gray-400">Add agents to see performance</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {agentPerformance.slice(0, 5).map((agent, index) => (
                    <div key={agent._id} className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg transform transition-all duration-300 hover:scale-[1.02] hover:shadow-md animate-fade-in-row`} style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-600' :
                          'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{agent.agentName}</p>
                          <p className="text-sm text-gray-500">{agent.agentCode}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{agent.totalShops} shops</p>
                        <p className="text-sm text-gray-500">{formatCurrency(agent.totalEarnings)}</p>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </div>

              {/* Revenue Breakdown */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Revenue by Plan</h3>
                {!revenueData ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-2">No revenue data available</p>
                    <p className="text-sm text-gray-400">Add shops to see revenue</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries({
                    'Hero Plan': { count: revenueData.heroPlan?.count || 0, amount: revenueData.heroPlan?.amount || 0 },
                    'Banner Plan': { count: revenueData.bannerPlan?.count || 0, amount: revenueData.bannerPlan?.amount || 0 },
                    'Left Bar': { count: revenueData.leftBarPlan?.count || 0, amount: revenueData.leftBarPlan?.amount || 0 },
                    'Right Side': { count: revenueData.rightSidePlan?.count || 0, amount: revenueData.rightSidePlan?.amount || 0 },
                    'Bottom Rail': { count: revenueData.bottomRailPlan?.count || 0, amount: revenueData.bottomRailPlan?.amount || 0 },
                    'Featured': { count: revenueData.featuredPlan?.count || 0, amount: revenueData.featuredPlan?.amount || 0 },
                    'Premium': { count: revenueData.premiumPlan?.count || 0, amount: revenueData.premiumPlan?.amount || 0 },
                    'Basic': { count: revenueData.basicPlan?.count || 0, amount: revenueData.basicPlan?.amount || 0 },
                  }).map(([plan, data]) => (
                    <div key={plan} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{plan}</p>
                        <p className="text-sm text-gray-500">{data.count} shops</p>
                      </div>
                      <p className="font-bold text-blue-600">{formatCurrency(data.amount)}</p>
                    </div>
                  ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Revenue Section */}
        {selectedView === 'revenue' && (
          !revenueData ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Revenue Data</h3>
              <p className="text-gray-600 mb-4">Add shops with payment to see revenue details</p>
              <button
                onClick={fetchReportsData}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔄 Reload Data
              </button>
            </div>
          ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">💰 Revenue Details</h2>
              
              <div className="mb-8">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-8 text-white">
                  <p className="text-green-100 mb-2">Total Revenue</p>
                  <p className="text-5xl font-bold">{formatCurrency(revenueData.totalRevenue)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'Hero Plan', data: revenueData.heroPlan, color: 'purple' },
                  { name: 'Banner Plan', data: revenueData.bannerPlan, color: 'pink' },
                  { name: 'Left Bar Plan', data: revenueData.leftBarPlan, color: 'blue' },
                  { name: 'Right Side Plan', data: revenueData.rightSidePlan, color: 'green' },
                  { name: 'Bottom Rail Plan', data: revenueData.bottomRailPlan, color: 'yellow' },
                  { name: 'Featured Plan', data: revenueData.featuredPlan, color: 'indigo' },
                  { name: 'Premium Plan', data: revenueData.premiumPlan, color: 'red' },
                  { name: 'Basic Plan', data: revenueData.basicPlan, color: 'gray' },
                ].map((plan) => (
                  <div key={plan.name} className={`bg-${plan.color}-50 border-2 border-${plan.color}-200 rounded-lg p-4`}>
                    <p className={`text-${plan.color}-600 font-semibold mb-2`}>{plan.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(plan.data?.amount || 0)}</p>
                    <p className="text-sm text-gray-600 mt-1">{plan.data?.count || 0} shops</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )
        )}

        {/* Agents Section */}
        {selectedView === 'agents' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">👥 Agent Performance</h2>
              <p className="text-gray-600 mt-1">Complete agent work summary and earnings</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Shops
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      This Month
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Today
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Earnings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pending
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {agentPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <p className="text-lg mb-2">No agent data available</p>
                          <p className="text-sm">Add agents to see performance</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    agentPerformance.map((agent, index) => (
                    <tr key={agent._id} className={`hover:bg-gray-50 transform transition-all duration-300 animate-fade-in-row`} style={{ animationDelay: `${index * 0.05}s` }}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{agent.agentName}</div>
                          <div className="text-sm text-gray-500">{agent.agentCode}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {agent.totalShops}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agent.shopsThisMonth}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agent.shopsToday}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(agent.totalEarnings)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {formatCurrency(agent.paidAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                          agent.pendingPayment > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {formatCurrency(agent.pendingPayment)}
                        </span>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Shops Section */}
        {selectedView === 'shops' && (
          !shopSummary ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">🏪</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Shop Data</h3>
              <p className="text-gray-600 mb-4">Add shops to see statistics</p>
              <button
                onClick={fetchReportsData}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔄 Reload Data
              </button>
            </div>
          ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-3xl mb-2">🏪</div>
                <p className="text-gray-600 text-sm mb-1">Total Shops</p>
                <p className="text-3xl font-bold text-gray-900">{shopSummary.totalShops}</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-gray-600 text-sm mb-1">Paid Shops</p>
                <p className="text-3xl font-bold text-green-600">{shopSummary.paidShops}</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-3xl mb-2">⏳</div>
                <p className="text-gray-600 text-sm mb-1">Pending Payment</p>
                <p className="text-3xl font-bold text-yellow-600">{shopSummary.pendingShops}</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-3xl mb-2">❌</div>
                <p className="text-gray-600 text-sm mb-1">Expired</p>
                <p className="text-3xl font-bold text-red-600">{shopSummary.expiredShops}</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-3xl mb-2">🟢</div>
                <p className="text-gray-600 text-sm mb-1">Active</p>
                <p className="text-3xl font-bold text-blue-600">{shopSummary.activeShops}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">📊 Shop Statistics</h3>
                <Link
                  href="/admin/shops"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All Shops →
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Payment Status Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Paid</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${(shopSummary.paidShops / shopSummary.totalShops) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {Math.round((shopSummary.paidShops / shopSummary.totalShops) * 100)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Pending</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-600 h-2 rounded-full"
                            style={{ width: `${(shopSummary.pendingShops / shopSummary.totalShops) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {Math.round((shopSummary.pendingShops / shopSummary.totalShops) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Shop Status</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Active</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(shopSummary.activeShops / shopSummary.totalShops) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {Math.round((shopSummary.activeShops / shopSummary.totalShops) * 100)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Expired</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-600 h-2 rounded-full"
                            style={{ width: `${(shopSummary.expiredShops / shopSummary.totalShops) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {Math.round((shopSummary.expiredShops / shopSummary.totalShops) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )
        )}
      </main>
    </div>
  );
}

