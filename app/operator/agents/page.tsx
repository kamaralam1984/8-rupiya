'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOperatorAuth } from '@/app/contexts/OperatorAuthContext';
import OperatorRouteGuard from '@/app/components/OperatorRouteGuard';
import Link from 'next/link';

interface Agent {
  _id: string;
  name: string;
  email: string;
  phone: string;
  agentCode: string;
  totalShops: number;
  totalEarnings: number;
  paidShops: number;
  pendingShops: number;
  totalOperatorCommission: number;
  totalAgentCommission: number;
  createdAt: string;
}

export default function OperatorAgentsPage() {
  const { operator } = useOperatorAuth();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalOperatorEarnings, setTotalOperatorEarnings] = useState(0);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('operator_token');
      if (!token) {
        router.push('/operator/login');
        return;
      }

      const response = await fetch('/api/operator/agents', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setAgents(data.agents);
        setTotalOperatorEarnings(data.totalOperatorEarnings || 0);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
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
            <p className="mt-4 text-gray-600">Loading agents...</p>
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
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Agents</h1>
                <p className="mt-2 text-gray-600">
                  View all agents assigned to you and their performance
                </p>
              </div>
              <Link
                href="/operator/dashboard"
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>

          {/* Total Earnings Card */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Total Operator Earnings</p>
                <p className="text-3xl font-bold text-green-900 mt-2">
                  ₹{totalOperatorEarnings.toLocaleString()}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  From {agents.length} agent{agents.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          {/* Agents List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Agents ({agents.length})
              </h2>
            </div>

            {agents.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 text-lg">No agents assigned yet</p>
                <p className="text-gray-400 text-sm mt-2">
                  Contact admin to assign agents to your operator account
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Agent Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shops
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Agent Commission
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Your Commission
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {agents.map((agent) => (
                      <tr key={agent._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                            <div className="text-sm text-gray-500">{agent.agentCode}</div>
                            <div className="text-xs text-gray-400">{agent.email}</div>
                            <div className="text-xs text-gray-400">{agent.phone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <span className="font-semibold">{agent.totalShops}</span> total
                          </div>
                          <div className="text-xs text-gray-500">
                            <span className="text-green-600">{agent.paidShops} paid</span> /{' '}
                            <span className="text-orange-600">{agent.pendingShops} pending</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ₹{agent.totalAgentCommission.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            Agent Earnings: ₹{agent.totalEarnings.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">
                            ₹{agent.totalOperatorCommission.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">15% of remaining</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/operator/agents/${agent._id}/shops`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Shops →
                          </Link>
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




