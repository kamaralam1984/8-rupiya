'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Collection {
  name: string;
  count: number;
}

export default function DatabaseViewerPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [clearing, setClearing] = useState<string | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/database/collections', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setCollections(data.collections);
      }
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCollections = collections.filter((col) =>
    col.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalDocuments = collections.reduce((sum, col) => sum + col.count, 0);

  const handleClearCollection = async (collectionName: string) => {
    if (!confirm(`⚠️ WARNING: This will delete ALL documents from "${collectionName}" collection.\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?`)) {
      return;
    }

    // Second confirmation for safety
    const confirmText = prompt(`⚠️ FINAL WARNING: You are about to delete ALL ${collectionName} data.\n\nType "DELETE" to confirm:`);
    if (confirmText !== 'DELETE') {
      toast.error('Confirmation text did not match. Operation cancelled.');
      return;
    }

    setClearing(collectionName);
    try {
      const response = await fetch('/api/admin/database/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ collectionName }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Cleared ${data.deletedCount} documents from "${collectionName}"`);
        fetchCollections();
      } else {
        if (data.error === 'Cannot clear protected collection') {
          toast.error(`Cannot clear protected collection: ${collectionName}`);
        } else {
          toast.error(data.error || 'Failed to clear collection');
        }
      }
    } catch (error) {
      toast.error('Failed to clear collection');
    } finally {
      setClearing(null);
    }
  };

  const handleClearAll = async () => {
    setShowClearAllModal(false);
    
    if (!confirm(`⚠️ CRITICAL WARNING: This will delete ALL data from ALL collections (except protected ones).\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?`)) {
      return;
    }

    // Second confirmation with text input
    const confirmText = prompt(`⚠️ FINAL WARNING: You are about to delete ALL database data.\n\nThis is IRREVERSIBLE!\n\nType "DELETE ALL" to confirm:`);
    if (confirmText !== 'DELETE ALL') {
      toast.error('Confirmation text did not match. Operation cancelled.');
      return;
    }

    setClearing('ALL');
    try {
      const response = await fetch('/api/admin/database/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ clearAll: true }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Cleared ${data.summary.collectionsCleared} collections with ${data.summary.totalCleared} total documents`);
        if (data.summary.protected > 0) {
          toast(`${data.summary.protected} protected collections were skipped`, { icon: 'ℹ️' });
        }
        fetchCollections();
      } else {
        toast.error(data.error || 'Failed to clear database');
      }
    } catch (error) {
      toast.error('Failed to clear database');
    } finally {
      setClearing(null);
    }
  };

  // Protected collections
  const isProtected = (name: string) => {
    const protectedCollections = ['users', 'admins', 'operators'];
    return protectedCollections.includes(name.toLowerCase());
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Database Management</h1>
          <p className="text-gray-600 mt-1">View, explore, and manage database collections</p>
        </div>
        <button
          onClick={() => setShowClearAllModal(true)}
          disabled={clearing !== null}
          className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear All Collections
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-gray-600 text-sm mb-1">Total Collections</p>
          <p className="text-3xl font-bold text-gray-900">{collections.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-gray-600 text-sm mb-1">Total Documents</p>
          <p className="text-3xl font-bold text-blue-600">{totalDocuments.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-gray-600 text-sm mb-1">Database Status</p>
          <p className="text-3xl font-bold text-green-600">Connected</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <input
          type="text"
          placeholder="Search collections..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Collections List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading collections...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Collections</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collection Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCollections.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No collections found
                    </td>
                  </tr>
                ) : (
                  filteredCollections.map((collection) => {
                    const protectedCollection = isProtected(collection.name);
                    return (
                      <tr key={collection.name} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📊</span>
                            <span className="font-mono font-semibold text-gray-900">{collection.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {collection.count.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">
                            {collection.count === 1 ? 'document' : 'documents'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {protectedCollection ? (
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                              Protected
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                              Clearable
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/admin/database/${collection.name}`}
                              className="text-blue-600 hover:text-blue-700 font-semibold"
                            >
                              View →
                            </Link>
                            {!protectedCollection && (
                              <button
                                onClick={() => handleClearCollection(collection.name)}
                                disabled={clearing === collection.name || clearing !== null}
                                className="text-red-600 hover:text-red-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              >
                                {clearing === collection.name ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                    Clearing...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Clear
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Clear All Modal */}
      {showClearAllModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Clear All Collections</h2>
                  <p className="text-sm text-gray-600">This is a destructive operation</p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800 font-medium mb-2">⚠️ Warning:</p>
                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                  <li>This will delete ALL data from ALL collections</li>
                  <li>Protected collections (users, admins, operators) will be skipped</li>
                  <li>This action CANNOT be undone</li>
                  <li>Make sure you have a backup before proceeding</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleClearAll}
                  className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                >
                  I Understand, Clear All
                </button>
                <button
                  onClick={() => setShowClearAllModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


