'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function EditAgentPage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const agentId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    agentCode: '',
    agentPanelText: '',
    agentPanelTextColor: 'black' as 'red' | 'green' | 'blue' | 'black',
  });

  useEffect(() => {
    if (agentId) {
      fetchAgent();
    }
  }, [agentId]);

  const fetchAgent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/agents/${agentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        const agent = data.agent;
        setFormData({
          name: agent.name,
          phone: agent.phone,
          email: agent.email,
          password: '', // Don't pre-fill password
          agentCode: agent.agentCode,
          agentPanelText: agent.agentPanelText || '',
          agentPanelTextColor: agent.agentPanelTextColor || 'black',
        });
      } else {
        toast.error('Failed to load agent');
        router.push('/admin/agents');
      }
    } catch (error) {
      toast.error('Failed to load agent');
      router.push('/admin/agents');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData: any = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        agentCode: formData.agentCode,
        agentPanelText: formData.agentPanelText,
        agentPanelTextColor: formData.agentPanelTextColor,
      };

      // Only include password if it's provided
      if (formData.password.trim() !== '') {
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/admin/agents/${agentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Agent updated successfully!');
        router.push('/admin/agents');
      } else {
        toast.error(data.error || 'Failed to update agent');
      }
    } catch (error) {
      toast.error('Failed to update agent');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agent...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/admin/agents"
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
        >
          ← Back to Agents
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Agent</h1>
        <p className="text-gray-600 mt-1">Update agent information</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agent Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agent Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.agentCode}
              onChange={(e) => setFormData({ ...formData, agentCode: e.target.value.toUpperCase() })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password (Leave empty to keep current password)
            </label>
            <input
              type="text"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter new password (min 6 characters)"
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty if you don't want to change password</p>
          </div>

          {/* Agent Panel Text Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agent Panel Text
            </label>
            <textarea
              value={formData.agentPanelText}
              onChange={(e) => setFormData({ ...formData, agentPanelText: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter text to display in agent panel..."
              rows={3}
              style={{ 
                color: formData.agentPanelTextColor === 'red' ? '#ef4444' :
                       formData.agentPanelTextColor === 'green' ? '#22c55e' :
                       formData.agentPanelTextColor === 'blue' ? '#3b82f6' :
                       '#000000'
              }}
            />
            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Text Color:
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, agentPanelTextColor: 'red' })}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    formData.agentPanelTextColor === 'red'
                      ? 'bg-red-600 text-white shadow-md scale-105'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  🔴 Red
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, agentPanelTextColor: 'green' })}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    formData.agentPanelTextColor === 'green'
                      ? 'bg-green-600 text-white shadow-md scale-105'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  🟢 Green
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, agentPanelTextColor: 'blue' })}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    formData.agentPanelTextColor === 'blue'
                      ? 'bg-blue-600 text-white shadow-md scale-105'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  🔵 Blue
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, agentPanelTextColor: 'black' })}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    formData.agentPanelTextColor === 'black'
                      ? 'bg-gray-800 text-white shadow-md scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ⚫ Black
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Selected color: <span className="font-semibold capitalize">{formData.agentPanelTextColor}</span>
              </p>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Link
              href="/admin/agents"
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Update Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


