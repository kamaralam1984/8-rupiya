'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOperatorAuth } from '@/app/contexts/OperatorAuthContext';
import OperatorRouteGuard from '@/app/components/OperatorRouteGuard';
import Link from 'next/link';

interface Shop {
  _id: string;
  shopName: string;
  ownerName: string;
  mobile: string;
  email?: string;
  category: string;
  pincode: string;
  address: string;
  photoUrl: string;
  paymentStatus: string;
  googleBusinessAccount?: {
    status: string;
    accountId?: string;
    locationId?: string;
    verificationUrl?: string;
    error?: string;
    createdAt?: string;
    lastUpdated?: string;
  };
  createdAt: string;
}

export default function OperatorShopDetailPage() {
  const { operator } = useOperatorAuth();
  const params = useParams();
  const router = useRouter();
  const shopId = params.id as string;

  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingGoogleBusiness, setCreatingGoogleBusiness] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchShop();
  }, [shopId]);

  const fetchShop = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('operator_token');
      const response = await fetch(`/api/operator/shops/${shopId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setShop(data.shop);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load shop' });
      }
    } catch (error) {
      console.error('Failed to load shop:', error);
      setMessage({ type: 'error', text: 'Failed to load shop' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoogleBusiness = async () => {
    try {
      setCreatingGoogleBusiness(true);
      setMessage(null);
      
      const token = localStorage.getItem('operator_token');
      const response = await fetch(`/api/operator/shops/${shopId}/google-business`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Google Business account created successfully!' });
        // Refresh shop data
        fetchShop();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create Google Business account' });
      }
    } catch (error: any) {
      console.error('Error creating Google Business account:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to create Google Business account' });
    } finally {
      setCreatingGoogleBusiness(false);
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
                <h1 className="text-2xl font-bold">Shop Details</h1>
                <p className="text-green-100 text-sm">Google Business Account Manager</p>
              </div>
              <Link
                href="/operator/shops"
                className="px-4 py-2 bg-green-700 hover:bg-green-800 rounded-lg transition-colors"
              >
                Back to Shops
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading shop details...</p>
            </div>
          ) : !shop ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600 text-lg">Shop not found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Message */}
              {message && (
                <div
                  className={`p-4 rounded-lg ${
                    message.type === 'success'
                      ? 'bg-green-50 border border-green-200 text-green-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  <p>{message.text}</p>
                </div>
              )}

              {/* Shop Details */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Shop Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shop Name
                    </label>
                    <p className="text-gray-900">{shop.shopName}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Owner Name
                    </label>
                    <p className="text-gray-900">{shop.ownerName}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile
                    </label>
                    <p className="text-gray-900">{shop.mobile}</p>
                  </div>

                  {shop.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <p className="text-gray-900">{shop.email}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <p className="text-gray-900">{shop.category}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pincode
                    </label>
                    <p className="text-gray-900">{shop.pincode}</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <p className="text-gray-900">{shop.address}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Status
                    </label>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        shop.paymentStatus === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {shop.paymentStatus}
                    </span>
                  </div>
                </div>

                {shop.photoUrl && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shop Photo
                    </label>
                    <img
                      src={shop.photoUrl}
                      alt={shop.shopName}
                      className="w-full max-w-md rounded-lg shadow-md"
                    />
                  </div>
                )}
              </div>

              {/* Google Business Account Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Google Business Account</h2>
                
                {shop.googleBusinessAccount ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <span
                        className={`px-3 py-1 text-sm font-semibold rounded-full ${
                          shop.googleBusinessAccount.status === 'CREATED' ||
                          shop.googleBusinessAccount.status === 'VERIFIED'
                            ? 'bg-green-100 text-green-800'
                            : shop.googleBusinessAccount.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {shop.googleBusinessAccount.status}
                      </span>
                    </div>

                    {shop.googleBusinessAccount.accountId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Account ID
                        </label>
                        <p className="text-gray-900 font-mono text-sm">
                          {shop.googleBusinessAccount.accountId}
                        </p>
                      </div>
                    )}

                    {shop.googleBusinessAccount.locationId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location ID
                        </label>
                        <p className="text-gray-900 font-mono text-sm">
                          {shop.googleBusinessAccount.locationId}
                        </p>
                      </div>
                    )}

                    {shop.googleBusinessAccount.verificationUrl && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Verification URL
                        </label>
                        <a
                          href={shop.googleBusinessAccount.verificationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 underline"
                        >
                          {shop.googleBusinessAccount.verificationUrl}
                        </a>
                      </div>
                    )}

                    {shop.googleBusinessAccount.error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800 text-sm">
                          <strong>Error:</strong> {shop.googleBusinessAccount.error}
                        </p>
                      </div>
                    )}

                    {(shop.googleBusinessAccount.status === 'NOT_CREATED' ||
                      shop.googleBusinessAccount.status === 'FAILED') && (
                      <button
                        onClick={handleCreateGoogleBusiness}
                        disabled={creatingGoogleBusiness}
                        className="mt-4 px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {creatingGoogleBusiness
                          ? 'Creating Google Business Account...'
                          : 'Create Google Business Account'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-4">
                      No Google Business account has been created for this shop yet.
                    </p>
                    <button
                      onClick={handleCreateGoogleBusiness}
                      disabled={creatingGoogleBusiness}
                      className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creatingGoogleBusiness
                        ? 'Creating Google Business Account...'
                        : 'Create Google Business Account'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </OperatorRouteGuard>
  );
}

