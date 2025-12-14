'use client';

import { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function RestorePage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [restoreDate, setRestoreDate] = useState('2025-12-13');
  const [restoreTime, setRestoreTime] = useState('11:30');
  const [preview, setPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const handlePreview = async () => {
    try {
      setPreviewLoading(true);
      const dateTime = `${restoreDate}T${restoreTime}:00`;
      
      const response = await fetch('/api/admin/restore/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ restoreDateTime: dateTime }),
      });

      const data = await response.json();
      if (data.success) {
        setPreview(data);
        toast.success('Preview generated successfully');
      } else {
        toast.error(data.error || 'Failed to generate preview');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!confirm('⚠️ WARNING: This will permanently delete all data created/modified after the selected time. This action cannot be undone. Are you sure?')) {
      return;
    }

    if (!confirm('⚠️ Are you absolutely sure? This will delete:' + 
      `\n- ${preview?.shopsToDelete || 0} shops created after ${restoreDate} ${restoreTime}` +
      `\n- ${preview?.agentShopsToDelete || 0} agent shops created after ${restoreDate} ${restoreTime}` +
      `\n- ${preview?.renewalPaymentsToDelete || 0} renewal payments created after ${restoreDate} ${restoreTime}` +
      `\n- ${preview?.modifiedShops || 0} shops modified after ${restoreDate} ${restoreTime} (will be deleted if created after)`)) {
      return;
    }

    try {
      setLoading(true);
      const dateTime = `${restoreDate}T${restoreTime}:00`;
      
      const response = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ restoreDateTime: dateTime }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Restore completed successfully! Deleted ${data.deletedCount} records.`);
        setPreview(null);
      } else {
        toast.error(data.error || 'Restore failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Restore failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🔄 Database Restore</h1>
        <p className="text-gray-600">Restore database to a specific point in time</p>
      </div>

      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="text-2xl">⚠️</div>
          <div>
            <h3 className="font-bold text-red-800 mb-2">Warning: Destructive Operation</h3>
            <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
              <li>This will permanently delete all data created after the selected date/time</li>
              <li>This action cannot be undone</li>
              <li>Always preview before restoring</li>
              <li>Make sure you have a backup before proceeding</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Restore Point</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restore Date
            </label>
            <input
              type="date"
              value={restoreDate}
              onChange={(e) => setRestoreDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restore Time (24-hour format)
            </label>
            <input
              type="time"
              value={restoreTime}
              onChange={(e) => setRestoreTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Restore Point:</strong> {restoreDate} at {restoreTime}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            All data created or modified after this time will be deleted.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePreview}
            disabled={previewLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
          >
            {previewLoading ? 'Generating Preview...' : '🔍 Preview Changes'}
          </button>
          
          <button
            onClick={handleRestore}
            disabled={loading || !preview}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
          >
            {loading ? 'Restoring...' : '⚠️ Execute Restore'}
          </button>
        </div>
      </div>

      {preview && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Preview Changes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">{preview.shopsToDelete || 0}</div>
              <div className="text-sm text-red-700 mt-1">Shops to Delete</div>
              <div className="text-xs text-red-600 mt-1">(Created after restore point)</div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">{preview.agentShopsToDelete || 0}</div>
              <div className="text-sm text-red-700 mt-1">Agent Shops to Delete</div>
              <div className="text-xs text-red-600 mt-1">(Created after restore point)</div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">{preview.renewalPaymentsToDelete || 0}</div>
              <div className="text-sm text-red-700 mt-1">Renewal Payments to Delete</div>
              <div className="text-xs text-red-600 mt-1">(Created after restore point)</div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-600">{preview.modifiedShops || 0}</div>
              <div className="text-sm text-yellow-700 mt-1">Modified Shops</div>
              <div className="text-xs text-yellow-600 mt-1">(Updated after restore point)</div>
            </div>
          </div>

          {preview.shopsToDelete > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Sample Shops to be Deleted:</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {preview.sampleShops?.slice(0, 10).map((shop: any, index: number) => (
                  <div key={index} className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">
                    <strong>{shop.shopName}</strong> - Created: {new Date(shop.createdAt).toLocaleString('en-IN')}
                  </div>
                ))}
                {preview.sampleShops?.length > 10 && (
                  <div className="text-xs text-gray-500">... and {preview.sampleShops.length - 10} more</div>
                )}
              </div>
            </div>
          )}

          {preview.modifiedShops > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Note about Modified Shops:</h3>
              <p className="text-sm text-yellow-800">
                {preview.modifiedShops} shops were modified after the restore point. 
                These shops will only be deleted if they were also created after the restore point.
                Shops created before but modified after the restore point will remain but with their modified state.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


