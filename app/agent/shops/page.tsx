'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AgentRouteGuard from '@/app/components/AgentRouteGuard';

// Agent Panel Text Display Component
function AgentPanelTextDisplay() {
  const [agentPanelText, setAgentPanelText] = useState<string>('');
  const [agentPanelTextColor, setAgentPanelTextColor] = useState<'red' | 'green' | 'blue' | 'black'>('black');

  useEffect(() => {
    const fetchAgentInfo = async () => {
      try {
        const token = localStorage.getItem('agent_token');
        const response = await fetch('/api/agent/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (data.success && data.stats) {
          if (data.stats.agentPanelText) {
            setAgentPanelText(data.stats.agentPanelText);
            setAgentPanelTextColor(data.stats.agentPanelTextColor || 'black');
          }
        }
      } catch (error) {
        console.error('Failed to load agent panel text:', error);
      }
    };

    fetchAgentInfo();
  }, []);

  if (!agentPanelText) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="bg-white rounded-xl shadow-lg p-4 border-l-4" 
           style={{
             borderLeftColor: agentPanelTextColor === 'red' ? '#ef4444' :
                              agentPanelTextColor === 'green' ? '#22c55e' :
                              agentPanelTextColor === 'blue' ? '#3b82f6' :
                              '#000000'
           }}>
        <p 
          className="text-lg font-semibold"
          style={{
            color: agentPanelTextColor === 'red' ? '#ef4444' :
                   agentPanelTextColor === 'green' ? '#22c55e' :
                   agentPanelTextColor === 'blue' ? '#3b82f6' :
                   '#000000'
          }}
        >
          {agentPanelText}
        </p>
      </div>
    </div>
  );
}

interface Shop {
  _id: string;
  shopName: string;
  ownerName: string;
  category: string;
  pincode: string;
  photoUrl: string;
  paymentStatus: 'PAID' | 'PENDING';
  createdAt: string;
}

export default function MyShopsPage() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  useEffect(() => {
    fetchShops();
  }, [dateFilter, paymentFilter]);

  // Auto-refresh shops list when window gains focus (e.g., when user switches back to tab)
  useEffect(() => {
    const handleFocus = () => {
      fetchShops(false); // Silent refresh when tab becomes active
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Auto-refresh every 30 seconds to get latest payment status (silent refresh)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchShops(false); // Silent refresh without loading indicator
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [dateFilter, paymentFilter]);

  const fetchShops = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const token = localStorage.getItem('agent_token');
      const params = new URLSearchParams();
      if (dateFilter !== 'all') params.append('date', dateFilter);
      if (paymentFilter !== 'all') params.append('payment', paymentFilter);

      const response = await fetch(`/api/agent/shops?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setShops(data.shops);
      }
    } catch (error) {
      console.error('Failed to load shops:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchShops();
  }, [dateFilter, paymentFilter]);

  // Auto-refresh shops list when window gains focus (e.g., when user switches back to tab)
  useEffect(() => {
    const handleFocus = () => {
      fetchShops(false); // Silent refresh when tab becomes active
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Auto-refresh every 30 seconds to get latest payment status (silent refresh)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchShops(false); // Silent refresh without loading indicator
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [dateFilter, paymentFilter]);

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
              <h1 className="text-xl font-bold">My Shops</h1>
            </div>
          </div>
        </header>

        {/* Agent Panel Text Display */}
        <AgentPanelTextDisplay />

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

          {/* Shops List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading shops...</p>
            </div>
          ) : shops.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <p className="text-gray-600 text-lg mb-4">No shops found</p>
              <Link
                href="/agent/shops/new"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Add New Shop
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.map((shop) => (
                <Link
                  key={shop._id}
                  href={`/agent/shops/${shop._id}`}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
                >
                  <div className="relative h-48 w-full">
                    <Image
                      src={shop.photoUrl || '/placeholder-shop.jpg'}
                      alt={shop.shopName}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          shop.paymentStatus === 'PAID'
                            ? 'bg-green-500 text-white'
                            : 'bg-yellow-500 text-white'
                        }`}
                      >
                        {shop.paymentStatus}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
                      {shop.shopName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{shop.ownerName}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{shop.category}</span>
                      <span className="text-gray-500">{shop.pincode}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(shop.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </AgentRouteGuard>
  );
}

