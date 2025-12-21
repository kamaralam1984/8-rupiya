'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';

interface Agent {
  _id: string;
  id: string;
  name: string;
  phone: string;
  email: string;
  agentCode: string;
  agentPanelText?: string;
  agentPanelTextColor?: 'red' | 'green' | 'blue' | 'black';
  totalShops: number;
  totalEarnings: number;
  createdAt: string;
}

export default function AgentsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, [search]);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await fetch(`/api/admin/agents?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setAgents(data.agents);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (agentId: string, agentName: string, agentShops?: number) => {
    // First confirmation
    let confirmMessage = `Are you sure you want to delete agent "${agentName}"?\n\n`;
    
    if (agentShops && agentShops > 0) {
      confirmMessage += `⚠️ WARNING: This agent has ${agentShops} shop(s) registered.\n\n`;
      confirmMessage += `If you delete this agent:\n`;
      confirmMessage += `✓ Agent account will be permanently deleted\n`;
      confirmMessage += `✓ Agent shops will remain in the system\n`;
      confirmMessage += `✓ Agent commission records will be preserved\n\n`;
    }
    
    confirmMessage += `This action cannot be undone.`;
    
    const firstConfirm = confirm(confirmMessage);
    
    if (!firstConfirm) {
      return;
    }

    // Second confirmation if agent has shops
    if (agentShops && agentShops > 0) {
      const secondConfirm = confirm(
        `⚠️ FINAL CONFIRMATION!\n\n` +
        `Agent: "${agentName}"\n` +
        `Shops: ${agentShops} shop(s)\n\n` +
        `Are you absolutely sure you want to delete this agent?\n\n` +
        `Click OK to proceed with deletion.`
      );
      
      if (!secondConfirm) {
        return;
      }
    }

    try {
      setDeleteLoading(agentId);
      const response = await fetch(`/api/admin/agents/${agentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        if (data.deletedShops > 0) {
          toast.success(
            `Agent "${agentName}" deleted successfully. ${data.deletedShops} shop(s) remain in the system.`,
            { duration: 5000 }
          );
        } else {
          toast.success(`Agent "${agentName}" deleted successfully`);
        }
        fetchAgents();
      } else {
        // Show detailed error message
        const errorMessage = data.error || 'Failed to delete agent';
        toast.error(errorMessage, {
          duration: 5000, // Show for 5 seconds
        });
      }
    } catch (error: any) {
      console.error('Delete agent error:', error);
      toast.error(error.message || 'Failed to delete agent. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleResetPassword = async (agentId: string, agentName: string) => {
    const newPassword = prompt(`Enter new password for "${agentName}":`);
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const response = await fetch(`/api/admin/agents/${agentId}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Password reset successfully. New password: ${newPassword}`);
      } else {
        toast.error(data.error || 'Failed to reset password');
      }
    } catch (error) {
      toast.error('Failed to reset password');
    }
  };

  const handleRecalculateStats = async () => {
    if (!confirm('Recalculate all agents\' stats (totalShops and totalEarnings) based on actual AgentShop data?\n\nThis will update all agents to match their actual shop counts and earnings.')) {
      return;
    }

    setRecalculating(true);
    try {
      const response = await fetch('/api/admin/agents/recalculate-stats', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast.success(
          `Recalculated stats for ${data.totalAgents} agents. ${data.updatedAgents} agents were updated.`,
          { duration: 5000 }
        );
        fetchAgents(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to recalculate stats');
      }
    } catch (error: any) {
      console.error('Failed to recalculate stats:', error);
      toast.error(error.message || 'Failed to recalculate stats');
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agents Management</h1>
          <p className="text-gray-600 mt-1">Manage field agents and their accounts</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRecalculateStats}
            disabled={recalculating}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Recalculate all agents' stats based on actual AgentShop data"
          >
            {recalculating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Recalculating...
              </>
            ) : (
              <>
                🔄 Recalculate Stats
              </>
            )}
          </button>
          <Link
            href="/admin/agents/new"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            + Add New Agent
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, email, phone, or agent code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Agents Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agents...</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <p className="text-gray-600 text-lg mb-4">No agents found</p>
          <Link
            href="/admin/agents/new"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Create First Agent
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shops</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Earnings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {agents.map((agent) => (
                  <tr key={agent.id || agent._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className="font-semibold text-blue-600">{agent.agentCode}</span>
                        {agent.agentPanelText && (
                          <div 
                            className="text-xs mt-1 font-medium"
                            style={{
                              color: agent.agentPanelTextColor === 'red' ? '#ef4444' :
                                     agent.agentPanelTextColor === 'green' ? '#22c55e' :
                                     agent.agentPanelTextColor === 'blue' ? '#3b82f6' :
                                     '#000000'
                            }}
                          >
                            {agent.agentPanelText}
                          </div>
                        )}
                      </div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      <div className="flex items-center gap-2">
                        <span className={agent.totalShops > 0 ? 'text-orange-600' : 'text-gray-900'}>
                          {agent.totalShops}
                        </span>
                        {agent.totalShops > 0 && (
                          <span className="text-xs text-orange-500" title={`Agent has ${agent.totalShops} shop(s)`}>
                            ⚠️
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      ₹{agent.totalEarnings}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/agents/${agent.id || agent._id}/edit`}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-blue-700 transition-colors"
                        >
                          ✏️ Edit
                        </Link>
                        <button
                          onClick={() => handleResetPassword(agent.id || agent._id, agent.name)}
                          className="bg-yellow-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-yellow-700 transition-colors"
                        >
                          🔑 Reset Password
                        </button>
                        <button
                          onClick={() => handleDelete(agent.id || agent._id, agent.name, agent.totalShops)}
                          disabled={deleteLoading === (agent.id || agent._id)}
                          className={`px-3 py-1 rounded text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ${
                            agent.totalShops > 0
                              ? 'bg-orange-600 text-white hover:bg-orange-700'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                          title={agent.totalShops > 0 ? `⚠️ Agent has ${agent.totalShops} shop(s). Shops will remain in system.` : 'Delete agent'}
                        >
                          {deleteLoading === (agent.id || agent._id) ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              Deleting...
                            </>
                          ) : (
                            <>
                              🗑️ Delete
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


