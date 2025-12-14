'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function EditOperatorPage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const operatorId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    operatorCode: '',
    isActive: true,
  });

  useEffect(() => {
    if (operatorId) {
      fetchOperator();
    }
  }, [operatorId]);

  const fetchOperator = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/operators/${operatorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        const operator = data.operator;
        setFormData({
          name: operator.name,
          phone: operator.phone,
          email: operator.email,
          password: '', // Don't pre-fill password
          operatorCode: operator.operatorCode,
          isActive: operator.isActive !== undefined ? operator.isActive : true,
        });
      } else {
        toast.error('Failed to load operator');
        router.push('/admin/operators');
      }
    } catch (error) {
      toast.error('Failed to load operator');
      router.push('/admin/operators');
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
        operatorCode: formData.operatorCode,
        isActive: formData.isActive,
      };

      // Only include password if it's provided
      if (formData.password.trim() !== '') {
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/admin/operators/${operatorId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Operator updated successfully!');
        router.push('/admin/operators');
      } else {
        toast.error(data.error || 'Failed to update operator');
      }
    } catch (error) {
      toast.error('Failed to update operator');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading operator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/admin/operators"
          className="text-green-600 hover:text-green-700 mb-4 inline-block"
        >
          ← Back to Operators
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Operator</h1>
        <p className="text-gray-600 mt-1">Update operator information</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operator Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operator Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.operatorCode}
              onChange={(e) => setFormData({ ...formData, operatorCode: e.target.value.toUpperCase() })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={formData.isActive === true}
                  onChange={() => setFormData({ ...formData, isActive: true })}
                  className="mr-2"
                />
                <span className="text-green-600 font-medium">Active</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={formData.isActive === false}
                  onChange={() => setFormData({ ...formData, isActive: false })}
                  className="mr-2"
                />
                <span className="text-red-600 font-medium">Inactive</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password (Leave empty to keep current password)
            </label>
            <input
              type="text"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Enter new password (min 6 characters)"
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty if you don't want to change password</p>
          </div>

          <div className="flex gap-4 pt-4">
            <Link
              href="/admin/operators"
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Update Operator'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

