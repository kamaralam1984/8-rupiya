'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useOperatorAuth } from '@/app/contexts/OperatorAuthContext';
import OperatorRouteGuard from '@/app/components/OperatorRouteGuard';
import Link from 'next/link';
import Image from 'next/image';

interface Shop {
  _id: string;
  shopName: string;
  ownerName: string;
  mobile: string;
  email?: string;
  category: string;
  pincode: string;
  area?: string;
  address: string;
  photoUrl: string;
  paymentStatus: string;
  paymentMode: string;
  amount: number;
  planType: string;
  planAmount: number;
  agentCommission: number;
  operatorCommission: number;
  receiptNo: string;
  createdAt: string;
  lastPaymentDate: string;
  paymentExpiryDate: string;
  visitorCount: number;
}

interface Agent {
  _id: string;
  name: string;
  agentCode: string;
  email: string;
  phone: string;
}

interface Stats {
  totalShops: number;
  paidShops: number;
  pendingShops: number;
  totalRevenue: number;
  totalAgentCommission: number;
  totalOperatorCommission: number;
}

export default function AgentShopsPage() {
  const { operator } = useOperatorAuth();
  const router = useRouter();
  const params = useParams();
  const agentId = params?.agentId as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (agentId) {
      fetchAgentShops();
    }
  }, [agentId]);

  const fetchAgentShops = async () => {
    try {
      const token = localStorage.getItem('operator_token');
      if (!token) {
        router.push('/operator/login');
        return;
      }

      const response = await fetch(`/api/operator/agents/${agentId}/shops`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setAgent(data.agent);
        setShops(data.shops);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching agent shops:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <OperatorRouteGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading shops...</p>
          </div>
        </div>
      </OperatorRouteGuard>
    );
  }

  if (!agent) {
    return (
      <OperatorRouteGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-lg">Agent not found</p>
            <Link href="/operator/agents" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
              ← Back to Agents
            </Link>
          </div>
        </div>
      </OperatorRouteGuard>
    );
  }

  return (
    <OperatorRouteGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/operator/agents"
              className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
            >
              ← Back to Agents
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{agent.name}'s Shops</h1>
            <p className="mt-2 text-gray-600">
              Agent Code: {agent.agentCode} | Email: {agent.email} | Phone: {agent.phone}
            </p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600">Total Shops</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalShops}</p>
              </div>
              <div className="bg-green-50 rounded-lg shadow p-4">
                <p className="text-sm text-green-600">Paid Shops</p>
                <p className="text-2xl font-bold text-green-900">{stats.paidShops}</p>
              </div>
              <div className="bg-blue-50 rounded-lg shadow p-4">
                <p className="text-sm text-blue-600">Agent Commission</p>
                <p className="text-2xl font-bold text-blue-900">
                  ₹{stats.totalAgentCommission.toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg shadow p-4">
                <p className="text-sm text-purple-600">Your Commission</p>
                <p className="text-2xl font-bold text-purple-900">
                  ₹{stats.totalOperatorCommission.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Shops List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Shops List</h2>
            </div>

            {shops.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 text-lg">No shops found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commissions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shops.map((shop) => (
                      <tr key={shop._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Image
                              src={shop.photoUrl}
                              alt={shop.shopName}
                              width={50}
                              height={50}
                              className="rounded-lg object-cover"
                            />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{shop.shopName}</div>
                              <div className="text-sm text-gray-500">{shop.ownerName}</div>
                              <div className="text-xs text-gray-400">{shop.category} • {shop.pincode}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            shop.paymentStatus === 'PAID' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {shop.paymentStatus}
                          </span>
                          <div className="text-sm text-gray-900 mt-1">₹{shop.amount}</div>
                          <div className="text-xs text-gray-500">{shop.paymentMode}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{shop.planType}</div>
                          <div className="text-xs text-gray-500">₹{shop.planAmount}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-blue-600">Agent: ₹{shop.agentCommission}</div>
                          <div className="text-sm font-semibold text-purple-600">
                            You: ₹{shop.operatorCommission}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="text-gray-500">Views: {shop.visitorCount}</div>
                          <div className="text-gray-400 text-xs">
                            {new Date(shop.createdAt).toLocaleDateString()}
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
      </div>
    </OperatorRouteGuard>
  );
}








