'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';

interface Operator {
  _id: string;
  id: string;
  name: string;
  phone: string;
  email: string;
  operatorCode: string;
  isActive: boolean;
  createdAt: string;
}

export default function OperatorsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchOperators();
  }, [search]);

  const fetchOperators = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await fetch(`/api/admin/operators?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setOperators(data.operators);
      }
    } catch (error) {
      console.error('Failed to load operators:', error);
      toast.error('Failed to load operators');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (operatorId: string, operatorName: string) => {
    const confirmMessage = `Are you sure you want to delete operator "${operatorName}"?\n\nThis action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setDeleteLoading(operatorId);
      const response = await fetch(`/api/admin/operators/${operatorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Operator "${operatorName}" deleted successfully`);
        fetchOperators();
      } else {
        toast.error(data.error || 'Failed to delete operator');
      }
    } catch (error: any) {
      console.error('Delete operator error:', error);
      toast.error(error.message || 'Failed to delete operator. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleResetPassword = async (operatorId: string, operatorName: string) => {
    const newPassword = prompt(`Enter new password for "${operatorName}":`);
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const response = await fetch(`/api/admin/operators/${operatorId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operators Management</h1>
          <p className="text-gray-600 mt-1">Manage operators and their Google Business account access</p>
        </div>
        <Link
          href="/admin/operators/new"
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          + Add New Operator
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, email, phone, or operator code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Operators Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading operators...</p>
        </div>
      ) : operators.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <p className="text-gray-600 text-lg mb-4">No operators found</p>
          <Link
            href="/admin/operators/new"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Create First Operator
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operator Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {operators.map((operator) => (
                  <tr key={operator.id || operator._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-green-600">{operator.operatorCode}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{operator.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {operator.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {operator.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          operator.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {operator.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/operators/${operator.id || operator._id}/edit`}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-blue-700 transition-colors"
                        >
                          ✏️ Edit
                        </Link>
                        <button
                          onClick={() => handleResetPassword(operator.id || operator._id, operator.name)}
                          className="bg-yellow-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-yellow-700 transition-colors"
                        >
                          🔑 Reset Password
                        </button>
                        <button
                          onClick={() => handleDelete(operator.id || operator._id, operator.name)}
                          disabled={deleteLoading === (operator.id || operator._id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {deleteLoading === (operator.id || operator._id) ? (
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

