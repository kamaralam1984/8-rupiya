'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';

interface Shop {
  _id: string;
  shopName: string;
  ownerName: string;
  mobile?: string;
  fullAddress: string;
  area?: string;
  city?: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  category: string;
  photoUrl?: string;
}

interface GoogleBusinessProfile {
  _id: string;
  shopId: string;
  shopName: string;
  ownerName: string;
  mobile?: string;
  email?: string;
  address: string;
  city?: string;
  pincode?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED' | 'NOT_CREATED';
  googleBusinessId?: string;
  googleBusinessUrl?: string;
  createdAt: string;
  notes?: string;
}

export default function GoogleBusinessPage() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<Shop[]>([]);
  const [profiles, setProfiles] = useState<GoogleBusinessProfile[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<GoogleBusinessProfile | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    notes: '',
  });
  const [updateFormData, setUpdateFormData] = useState({
    googleBusinessId: '',
    googleBusinessUrl: '',
    verificationStatus: 'PENDING' as 'PENDING' | 'VERIFIED' | 'FAILED' | 'NOT_CREATED',
    verificationMethod: 'PHONE' as 'PHONE' | 'EMAIL' | 'POSTCARD' | 'VIDEO' | '',
    notes: '',
  });
  const [filter, setFilter] = useState<'all' | 'not_created' | 'pending' | 'verified' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [token, filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [shopsRes, profilesRes] = await Promise.all([
        fetch('/api/admin/shops?limit=1000', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/google-business', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const shopsData = await shopsRes.json();
      const profilesData = await profilesRes.json();

      if (shopsData.success) {
        // Handle both formats: shops array or data.shops
        setShops(shopsData.shops || shopsData.data?.shops || []);
      }
      if (profilesData.success) {
        setProfiles(profilesData.profiles || []);
      }
    } catch (error: any) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!selectedShop) return;

    try {
      const response = await fetch('/api/admin/google-business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shopId: selectedShop._id,
          email: formData.email || undefined,
          notes: formData.notes || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Google Business Profile creation initiated!');
        setShowCreateModal(false);
        setSelectedShop(null);
        setFormData({ email: '', notes: '' });
        fetchData();
      } else {
        toast.error(data.error || 'Failed to create profile');
      }
    } catch (error: any) {
      toast.error('Failed to create profile');
      console.error(error);
    }
  };

  const handleQuickApprove = async (profileId: string) => {
    if (!confirm('क्या आप इस profile को VERIFIED mark करना चाहते हैं?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/google-business/${profileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          verificationStatus: 'VERIFIED',
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Profile verified successfully!');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error: any) {
      toast.error('Failed to update profile');
      console.error(error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!selectedProfile) return;

    try {
      const response = await fetch(`/api/admin/google-business/${selectedProfile._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          googleBusinessId: updateFormData.googleBusinessId || undefined,
          googleBusinessUrl: updateFormData.googleBusinessUrl || undefined,
          verificationStatus: updateFormData.verificationStatus,
          verificationMethod: updateFormData.verificationMethod || undefined,
          notes: updateFormData.notes || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Profile updated successfully!');
        setShowUpdateModal(false);
        setSelectedProfile(null);
        setUpdateFormData({
          googleBusinessId: '',
          googleBusinessUrl: '',
          verificationStatus: 'PENDING',
          verificationMethod: '',
          notes: '',
        });
        fetchData();
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error: any) {
      toast.error('Failed to update profile');
      console.error(error);
    }
  };

  const openUpdateModal = (profile: GoogleBusinessProfile) => {
    setSelectedProfile(profile);
    setUpdateFormData({
      googleBusinessId: profile.googleBusinessId || '',
      googleBusinessUrl: profile.googleBusinessUrl || '',
      verificationStatus: profile.verificationStatus,
      verificationMethod: '' as any,
      notes: profile.notes || '',
    });
    setShowUpdateModal(true);
  };

  const checkOnGoogle = (profile: GoogleBusinessProfile) => {
    // Google Maps में shop search करने के लिए URL बनाएं
    const searchQuery = encodeURIComponent(`${profile.shopName} ${profile.address} ${profile.city || ''}`);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
    
    // नया tab में खोलें
    window.open(googleMapsUrl, '_blank');
  };

  const checkGoogleBusinessProfile = (profile: GoogleBusinessProfile) => {
    if (profile.googleBusinessUrl) {
      // अगर Google Business URL है तो directly खोलें
      window.open(profile.googleBusinessUrl, '_blank');
    } else {
      // नहीं तो Google Maps में search करें
      checkOnGoogle(profile);
    }
  };

  const searchOnGoogle = (profile: GoogleBusinessProfile) => {
    // Google Search में shop name search करें
    const searchQuery = encodeURIComponent(`${profile.shopName} ${profile.city || ''} ${profile.pincode || ''}`);
    const googleSearchUrl = `https://www.google.com/search?q=${searchQuery}`;
    window.open(googleSearchUrl, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      NOT_CREATED: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      VERIFIED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${styles[status as keyof typeof styles] || styles.NOT_CREATED}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const filteredProfiles = profiles.filter((profile) => {
    const matchesFilter = filter === 'all' || profile.verificationStatus === filter.toUpperCase();
    const matchesSearch = searchTerm === '' || 
      profile.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const shopsWithoutProfile = shops.filter(
    (shop) => !profiles.some((p) => p.shopId === shop._id)
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🏢 Google Business Profile</h1>
        <p className="text-gray-600">शॉप के लिए Google Business Profile बनाएं और manage करें</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-2xl font-bold text-gray-900">{shops.length}</div>
          <div className="text-sm text-gray-600 mt-1">Total Shops</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-2xl font-bold text-yellow-600">{profiles.filter(p => p.verificationStatus === 'PENDING').length}</div>
          <div className="text-sm text-gray-600 mt-1">Pending</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-2xl font-bold text-green-600">{profiles.filter(p => p.verificationStatus === 'VERIFIED').length}</div>
          <div className="text-sm text-gray-600 mt-1">Verified</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-2xl font-bold text-gray-600">{shopsWithoutProfile.length}</div>
          <div className="text-sm text-gray-600 mt-1">Not Created</div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('not_created')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'not_created' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Not Created
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('verified')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'verified' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Verified
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'failed' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Failed
            </button>
          </div>
          <input
            type="text"
            placeholder="Search shops..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Shops Without Profile */}
      {filter === 'not_created' || filter === 'all' ? (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Shops Without Google Business Profile ({shopsWithoutProfile.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {shopsWithoutProfile.slice(0, 50).map((shop) => (
                  <tr key={shop._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{shop.shopName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{shop.ownerName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{shop.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {shop.area || shop.city || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedShop(shop);
                          setShowCreateModal(true);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors"
                      >
                        Create Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Existing Profiles */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Google Business Profiles ({filteredProfiles.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Google Business ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProfiles.map((profile) => (
                <tr key={profile._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{profile.shopName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{profile.ownerName}</td>
                  <td className="px-4 py-3">{getStatusBadge(profile.verificationStatus)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                    {profile.googleBusinessId || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {new Date(profile.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Check on Google Button - Always Available */}
                      <button
                        onClick={() => checkGoogleBusinessProfile(profile)}
                        className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                        title="Google में Check करें"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Check
                      </button>
                      
                      {/* Search on Google */}
                      <button
                        onClick={() => searchOnGoogle(profile)}
                        className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded hover:bg-blue-600 transition-colors"
                        title="Google Search में खोजें"
                      >
                        🔍 Search
                      </button>

                      {profile.verificationStatus === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleQuickApprove(profile._id)}
                            className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 transition-colors"
                            title="Approve/Verify"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => openUpdateModal(profile)}
                            className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition-colors"
                            title="Update Details"
                          >
                            Edit
                          </button>
                        </>
                      )}
                      {profile.verificationStatus === 'VERIFIED' && (
                        <button
                          onClick={() => openUpdateModal(profile)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition-colors"
                          title="Update Details"
                        >
                          Edit
                        </button>
                      )}
                      {profile.verificationStatus === 'FAILED' && (
                        <button
                          onClick={() => openUpdateModal(profile)}
                          className="px-3 py-1 bg-yellow-600 text-white text-xs font-semibold rounded hover:bg-yellow-700 transition-colors"
                          title="Retry/Update"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && selectedShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Google Business Profile</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                <input
                  type="text"
                  value={selectedShop.shopName}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                <input
                  type="text"
                  value={selectedShop.ownerName}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                <input
                  type="text"
                  value={selectedShop.mobile || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="owner@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={selectedShop.fullAddress}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedShop(null);
                  setFormData({ email: '', notes: '' });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProfile}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
              >
                Create Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {showUpdateModal && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Update Google Business Profile</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                <input
                  type="text"
                  value={selectedProfile.shopName}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verification Status *</label>
                <select
                  value={updateFormData.verificationStatus}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, verificationStatus: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="PENDING">Pending</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="FAILED">Failed</option>
                  <option value="NOT_CREATED">Not Created</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Business ID</label>
                <input
                  type="text"
                  value={updateFormData.googleBusinessId}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, googleBusinessId: e.target.value })}
                  placeholder="gmb_123456789"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Google Business Profile ID (if available)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Business URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={updateFormData.googleBusinessUrl}
                    onChange={(e) => setUpdateFormData({ ...updateFormData, googleBusinessUrl: e.target.value })}
                    placeholder="https://www.google.com/maps/place/..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedProfile) {
                        checkOnGoogle(selectedProfile);
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors flex items-center gap-2"
                    title="Google Maps में Check करें"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    Find
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Google Business Profile URL - या "Find" button से Google Maps में search करें</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verification Method</label>
                <select
                  value={updateFormData.verificationMethod}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, verificationMethod: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Method</option>
                  <option value="PHONE">Phone</option>
                  <option value="EMAIL">Email</option>
                  <option value="POSTCARD">Postcard</option>
                  <option value="VIDEO">Video</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={updateFormData.notes}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, notes: e.target.value })}
                  placeholder="Additional notes about verification..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedProfile(null);
                  setUpdateFormData({
                    googleBusinessId: '',
                    googleBusinessUrl: '',
                    verificationStatus: 'PENDING',
                    verificationMethod: '',
                    notes: '',
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
              >
                Update Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

