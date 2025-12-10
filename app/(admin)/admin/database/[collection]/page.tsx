'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Document {
  _id: string;
  [key: string]: any;
}

export default function CollectionViewerPage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const collectionName = params.collection as string;
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    page: 1,
    limit: 50,
    pages: 1,
  });
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [page, search]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '50');
      if (search) params.append('search', search);

      const response = await fetch(`/api/admin/database/${collectionName}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setDocuments(data.documents || []);
        setStats(data.stats || { total: 0, page: 1, limit: 50, pages: 1 });
        setError(null);
      } else {
        console.error('API error:', data.error);
        setError(data.error || 'Failed to load documents');
        setDocuments([]);
        setStats({ total: 0, page: 1, limit: 50, pages: 1 });
      }
    } catch (error: any) {
      console.error('Failed to load documents:', error);
      setError(error.message || 'Failed to load documents');
      setDocuments([]);
      setStats({ total: 0, page: 1, limit: 50, pages: 1 });
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') {
      if (value instanceof Date) {
        return value.toLocaleString();
      }
      if (value._id) {
        return `ObjectId(${value._id})`;
      }
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getFieldNames = (docs: Document[]): string[] => {
    const fields = new Set<string>();
    docs.forEach((doc) => {
      Object.keys(doc).forEach((key) => fields.add(key));
    });
    return Array.from(fields).sort();
  };

  const fieldNames = documents.length > 0 ? getFieldNames(documents) : [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/admin/database"
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
        >
          ← Back to Collections
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Collection: {collectionName}</h1>
        <p className="text-gray-600 mt-1">Viewing documents in this collection</p>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-600 text-sm mb-1">Total Documents</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm mb-1">Current Page</p>
            <p className="text-2xl font-bold text-blue-600">{stats.page}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm mb-1">Total Pages</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pages}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm mb-1">Per Page</p>
            <p className="text-2xl font-bold text-gray-900">{stats.limit}</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-600 text-sm">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Search and View Toggle */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between gap-4">
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Documents View */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <p className="text-gray-600 text-lg">No documents found</p>
        </div>
      ) : collectionName === 'shops' || collectionName === 'shopsfromimage' ? (
        <>
          {/* Special Shops Table View - Admin Panel Style */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pincode</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Remaining</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent Info</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {documents.map((doc, index) => {
                    const shopName = doc.shopName || doc.name || 'N/A';
                    const ownerName = doc.ownerName || 'N/A';
                    const category = doc.category || 'N/A';
                    const planType = doc.planType || 'BASIC';
                    const paymentStatus = doc.paymentStatus || 'PENDING';
                    const photoUrl = doc.photoUrl || doc.imageUrl || doc.iconUrl || '/placeholder-shop.jpg';
                    const pincode = doc.pincode || 'N/A';
                    const city = doc.city || '';
                    const area = doc.area || '';
                    const location = [area, city].filter(Boolean).join(', ') || 'N/A';
                    const createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date();
                    const paymentExpiryDate = doc.paymentExpiryDate ? new Date(doc.paymentExpiryDate) : null;
                    const planEndDate = doc.planEndDate ? new Date(doc.planEndDate) : null;
                    const expiryDate = paymentExpiryDate || planEndDate;
                    const daysRemaining = expiryDate ? Math.max(0, Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 'N/A';
                    const agentName = doc.agentName || 'N/A';
                    const agentCode = doc.agentCode || '';
                    const createdByAgent = doc.createdByAgent || null;
                    
                    return (
                      <tr key={doc._id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={photoUrl}
                              alt={shopName}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-shop.jpg';
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{shopName}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{ownerName}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{category}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            planType === 'HERO' ? 'bg-purple-100 text-purple-800' :
                            planType === 'BANNER' ? 'bg-indigo-100 text-indigo-800' :
                            planType === 'LEFT_BAR' || planType === 'RIGHT_BAR' ? 'bg-blue-100 text-blue-800' :
                            planType === 'FEATURED' ? 'bg-yellow-100 text-yellow-800' :
                            planType === 'PREMIUM' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {planType}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{location}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{pincode}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          {typeof daysRemaining === 'number' ? (
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                              daysRemaining > 30 ? 'bg-green-100 text-green-800' :
                              daysRemaining > 7 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {daysRemaining} days
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">{daysRemaining}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {createdByAgent ? (
                            <div className="space-y-1">
                              <div className="font-semibold text-blue-600">{agentName}</div>
                              {agentCode && <div className="text-xs text-gray-500">Code: {agentCode}</div>}
                              <div className="text-xs text-gray-400 font-mono">ID: {String(createdByAgent).slice(0, 8)}...</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Admin</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setExpandedDoc(expandedDoc === doc._id ? null : doc._id)}
                            className="text-blue-600 hover:text-blue-700 text-xs font-semibold"
                          >
                            {expandedDoc === doc._id ? 'Hide' : 'View'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {expandedDoc && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h4 className="font-semibold text-gray-900 mb-4">Full Document Details</h4>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-xs">
                {JSON.stringify(documents.find(d => d._id === expandedDoc), null, 2)}
              </pre>
            </div>
          )}
        </>
      ) : viewMode === 'grid' ? (
        <>
          {/* Grid View */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {documents.map((doc, index) => (
              <div
                key={doc._id || index}
                className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-gray-500">ID: {String(doc._id).slice(0, 8)}...</span>
                    <button
                      onClick={() => setExpandedDoc(expandedDoc === doc._id ? null : doc._id)}
                      className="text-blue-600 hover:text-blue-700 text-xs font-semibold"
                    >
                      {expandedDoc === doc._id ? 'Hide' : 'Expand'}
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {fieldNames.slice(0, 8).map((field) => (
                    <div key={field} className="border-b border-gray-100 pb-2 last:border-0">
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{field}</div>
                      <div className="text-sm text-gray-900 break-words line-clamp-2">
                        {formatValue(doc[field])}
                      </div>
                    </div>
                  ))}
                  {fieldNames.length > 8 && (
                    <div className="text-xs text-gray-500 pt-2">
                      +{fieldNames.length - 8} more fields
                    </div>
                  )}
                </div>
                {expandedDoc === doc._id && (
                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Full Document (JSON)</h4>
                    <pre className="bg-white p-3 rounded-lg overflow-auto max-h-64 text-xs border border-gray-200">
                      {JSON.stringify(doc, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Table View */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    {fieldNames.slice(0, 10).map((field) => (
                      <th key={field} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {field}
                      </th>
                    ))}
                    {fieldNames.length > 10 && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        +{fieldNames.length - 10} more
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {documents.map((doc, index) => (
                    <React.Fragment key={doc._id || index}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs font-mono text-gray-500">
                          {String(doc._id).slice(0, 8)}...
                        </td>
                        {fieldNames.slice(0, 10).map((field) => (
                          <td key={field} className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                            {formatValue(doc[field])}
                          </td>
                        ))}
                        {fieldNames.length > 10 && (
                          <td className="px-4 py-3 text-sm text-gray-500">
                            <button
                              onClick={() => setExpandedDoc(expandedDoc === doc._id ? null : doc._id)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              {expandedDoc === doc._id ? 'Hide' : 'View All'}
                            </button>
                          </td>
                        )}
                      </tr>
                      {expandedDoc === doc._id && (
                        <tr key={`expanded-${doc._id || index}`}>
                          <td colSpan={fieldNames.length > 10 ? 12 : fieldNames.length + 1} className="px-4 py-4 bg-gray-50">
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                              <h4 className="font-semibold text-gray-900 mb-2">Full Document (JSON)</h4>
                              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-xs">
                                {JSON.stringify(doc, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      
      {/* Pagination */}
      {stats.pages > 1 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <span className="text-gray-600">
              Page {stats.page} of {stats.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(stats.pages, p + 1))}
              disabled={page === stats.pages}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

