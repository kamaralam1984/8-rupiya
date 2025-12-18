'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOperatorAuth } from '@/app/contexts/OperatorAuthContext';
import OperatorRouteGuard from '@/app/components/OperatorRouteGuard';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Agent {
  _id: string;
  id: string;
  name: string;
  phone: string;
  email: string;
  agentCode: string;
  operatorId?: string;
  operatorName?: string;
  totalShops: number;
  totalEarnings: number;
  requestStatus?: 'PENDING' | null;
}

export default function JoinAgentsPage() {
  const { operator } = useOperatorAuth();
  const router = useRouter();
  const [operatorCode, setOperatorCode] = useState(operator?.operatorCode || '');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!operatorCode.trim()) {
      toast.error('Please enter operator code');
      return;
    }

    setSearching(true);
    try {
      const token = localStorage.getItem('operator_token');
      const response = await fetch(`/api/operator/search-agents?operatorCode=${encodeURIComponent(operatorCode.toUpperCase())}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setAgents(data.agents || []);
        if (data.agents.length === 0) {
          toast('No agents found for this operator code');
        }
      } else {
        toast.error(data.error || 'Failed to search agents');
        setAgents([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search agents');
      setAgents([]);
    } finally {
      setSearching(false);
    }
  };

  const handleRequestAssignment = async (agentId: string, agentName: string) => {
    if (!confirm(`Request to assign agent "${agentName}" to operator "${operatorCode}"?\n\nAdmin will review and approve this request.`)) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('operator_token');
      const response = await fetch('/api/operator/request-agent-assignment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId,
          operatorCode: operatorCode.toUpperCase(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Request sent for agent "${agentName}". Admin will review and approve it.`);
        // Refresh agents list
        handleSearch();
      } else {
        toast.error(data.error || 'Failed to send request');
      }
    } catch (error) {
      console.error('Request error:', error);
      toast.error('Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OperatorRouteGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-green-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Join Agents</h1>
                <p className="text-green-100 text-sm">Request agents to join your operator account</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/operator/dashboard"
                  className="px-4 py-2 bg-green-700 hover:bg-green-800 rounded-lg transition-colors"
                >
                  ← Dashboard
                </Link>
                <Link
                  href="/operator/agents"
                  className="px-4 py-2 bg-green-700 hover:bg-green-800 rounded-lg transition-colors"
                >
                  My Agents
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Form */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Search Agents by Operator Code</h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={operatorCode}
                onChange={(e) => setOperatorCode(e.target.value.toUpperCase())}
                placeholder="Enter Operator Code (e.g., OP001)"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
              <button
                onClick={handleSearch}
                disabled={searching || !operatorCode.trim()}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {searching ? 'Searching...' : '🔍 Search'}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Enter your operator code to see agents that can be assigned to you. Admin will review and approve requests.
            </p>
          </div>

          {/* Agents List */}
          {agents.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Agents Available for Assignment ({agents.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Operator</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shops</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {agents.map((agent) => (
                      <tr key={agent.id || agent._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-blue-600">{agent.agentCode}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{agent.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {agent.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {agent.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {agent.operatorName ? (
                            <span className="text-sm text-orange-600">{agent.operatorName}</span>
                          ) : (
                            <span className="text-sm text-gray-400">No Operator</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                          {agent.totalShops}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {agent.requestStatus === 'PENDING' ? (
                            <span className="px-4 py-2 bg-orange-100 text-orange-800 rounded-lg text-sm font-semibold">
                              ⏳ Pending Approval
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRequestAssignment(agent.id || agent._id, agent.name)}
                              disabled={loading || !!agent.operatorId}
                              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                agent.operatorId
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                              title={agent.operatorId ? 'Agent already assigned to an operator' : 'Request to assign this agent'}
                            >
                              {agent.operatorId ? 'Already Assigned' : '📤 Request Assignment'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {agents.length === 0 && !searching && operatorCode && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600 text-lg">No agents found. Try a different operator code.</p>
            </div>
          )}
        </main>
      </div>
    </OperatorRouteGuard>
  );
}

