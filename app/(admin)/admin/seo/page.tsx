'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';

interface SEOEntry {
  _id: string;
  shopName: string;
  area: string;
  category: string;
  pincode?: string;
  emailId: string;
  ranking: number;
  shopId?: string;
  shopUrl?: string;
  // Enhanced SEO Fields
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  // Social Media Links
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  youtubeUrl?: string;
  whatsappNumber?: string;
  // Google Business
  googleBusinessId?: string;
  googleMapsUrl?: string;
  // Social Sharing Settings
  enableSocialSharing?: boolean;
  socialSharingMessage?: string;
  enableWhatsAppSharing?: boolean;
  enableFacebookSharing?: boolean;
  enableTwitterSharing?: boolean;
  enableLinkedInSharing?: boolean;
  // Analytics
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function SEOPage() {
  const { token } = useAuth();
  const [seoEntries, setSeoEntries] = useState<SEOEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState<Partial<SEOEntry>>({
    shopName: '',
    area: '',
    category: '',
    pincode: '',
    emailId: '',
    ranking: 1,
    shopUrl: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: [],
    ogImage: '',
    ogTitle: '',
    ogDescription: '',
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    linkedinUrl: '',
    youtubeUrl: '',
    whatsappNumber: '',
    googleBusinessId: '',
    googleMapsUrl: '',
    enableSocialSharing: true,
    socialSharingMessage: '',
    enableWhatsAppSharing: true,
    enableFacebookSharing: true,
    enableTwitterSharing: true,
    enableLinkedInSharing: true,
    googleAnalyticsId: '',
    facebookPixelId: '',
  });

  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    fetchSEOEntries();
  }, [filterCategory, filterArea]);

  const fetchSEOEntries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCategory) params.append('category', filterCategory);
      if (filterArea) params.append('area', filterArea);
      
      const response = await fetch(`/api/seo?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setSeoEntries(data.seo || []);
        // Extract unique categories and areas
        const uniqueCategories = [...new Set(data.seo.map((e: SEOEntry) => e.category))] as string[];
        const uniqueAreas = [...new Set(data.seo.map((e: SEOEntry) => e.area))] as string[];
        setCategories(uniqueCategories.sort());
        setAreas(uniqueAreas.sort());
      } else {
        toast.error(data.error || 'Failed to fetch SEO entries');
      }
    } catch (error: any) {
      console.error('Failed to fetch SEO entries:', error);
      toast.error(error.message || 'Failed to fetch SEO entries');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/seo/${editingId}` : '/api/seo';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        toast.success(editingId ? 'SEO entry updated successfully!' : 'SEO entry created successfully!');
        resetForm();
        fetchSEOEntries();
      } else {
        toast.error(data.error || 'Failed to save SEO entry');
      }
    } catch (error: any) {
      console.error('Failed to save SEO entry:', error);
      toast.error(error.message || 'Failed to save SEO entry');
    }
  };

  const handleEdit = (entry: SEOEntry) => {
    setEditingId(entry._id);
    setFormData({
      ...entry,
      metaKeywords: entry.metaKeywords || [],
    });
    setKeywordInput((entry.metaKeywords || []).join(', '));
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SEO entry?')) return;

    try {
      const response = await fetch(`/api/seo/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success || response.ok) {
        toast.success('SEO entry deleted successfully!');
        fetchSEOEntries();
      } else {
        toast.error(data.error || 'Failed to delete SEO entry');
      }
    } catch (error: any) {
      console.error('Failed to delete SEO entry:', error);
      toast.error(error.message || 'Failed to delete SEO entry');
    }
  };

  const resetForm = () => {
    setFormData({
      shopName: '',
      area: '',
      category: '',
      pincode: '',
      emailId: '',
      ranking: 1,
      shopUrl: '',
      metaTitle: '',
      metaDescription: '',
      metaKeywords: [],
      ogImage: '',
      ogTitle: '',
      ogDescription: '',
      facebookUrl: '',
      instagramUrl: '',
      twitterUrl: '',
      linkedinUrl: '',
      youtubeUrl: '',
      whatsappNumber: '',
      googleBusinessId: '',
      googleMapsUrl: '',
      enableSocialSharing: true,
      socialSharingMessage: '',
      enableWhatsAppSharing: true,
      enableFacebookSharing: true,
      enableTwitterSharing: true,
      enableLinkedInSharing: true,
      googleAnalyticsId: '',
      facebookPixelId: '',
    });
    setKeywordInput('');
    setEditingId(null);
    setShowForm(false);
  };

  const addKeyword = () => {
    if (keywordInput.trim()) {
      const keywords = keywordInput.split(',').map(k => k.trim()).filter(Boolean);
      setFormData({
        ...formData,
        metaKeywords: [...(formData.metaKeywords || []), ...keywords],
      });
      setKeywordInput('');
    }
  };

  const removeKeyword = (index: number) => {
    const keywords = [...(formData.metaKeywords || [])];
    keywords.splice(index, 1);
    setFormData({ ...formData, metaKeywords: keywords });
  };

  const filteredEntries = seoEntries.filter(entry => {
    const matchesSearch = !searchTerm || 
      entry.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-800">SEO Management</h1>
            <button
              type="button"
              onClick={() => {
                console.log('Add SEO Entry clicked, current showForm:', showForm);
                setShowForm(!showForm);
              }}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-8 py-3 rounded-lg transition-all font-bold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2 w-full md:w-auto"
              style={{ 
                display: 'flex', 
                visibility: 'visible', 
                opacity: 1,
                zIndex: 10,
                position: 'relative'
              }}
            >
              <span className="text-xl">➕</span>
              <span>{showForm ? 'Cancel' : '+ Add SEO Entry'}</span>
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <input
              type="text"
              placeholder="Search shops..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">All Areas</option>
              {areas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
            <button
              onClick={fetchSEOEntries}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Refresh
            </button>
          </div>

          {/* Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Shop Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.shopName}
                    onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Area *</label>
                  <input
                    type="text"
                    required
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode || ''}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    maxLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email ID *</label>
                  <input
                    type="email"
                    required
                    value={formData.emailId}
                    onChange={(e) => setFormData({ ...formData, emailId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ranking (1 = Highest Priority) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.ranking}
                    onChange={(e) => setFormData({ ...formData, ranking: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Shop URL</label>
                  <input
                    type="text"
                    value={formData.shopUrl || ''}
                    onChange={(e) => setFormData({ ...formData, shopUrl: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="/shop/shop-slug"
                  />
                </div>
              </div>

              {/* SEO Settings */}
              <div className="mt-6 border-t pt-4">
                <h3 className="text-xl font-semibold mb-4">SEO Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Meta Title</label>
                    <input
                      type="text"
                      value={formData.metaTitle || ''}
                      onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      maxLength={70}
                      placeholder="Auto-generated if empty"
                    />
                    <p className="text-xs text-gray-500 mt-1">Max 70 characters</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Meta Description</label>
                    <textarea
                      value={formData.metaDescription || ''}
                      onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      rows={3}
                      maxLength={160}
                      placeholder="Auto-generated if empty"
                    />
                    <p className="text-xs text-gray-500 mt-1">Max 160 characters</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Meta Keywords</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                        className="flex-1 px-4 py-2 border rounded-lg"
                        placeholder="Enter keywords separated by commas"
                      />
                      <button
                        type="button"
                        onClick={addKeyword}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(formData.metaKeywords || []).map((keyword, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          {keyword}
                          <button
                            type="button"
                            onClick={() => removeKeyword(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">OG Image URL</label>
                    <input
                      type="url"
                      value={formData.ogImage || ''}
                      onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">OG Title</label>
                    <input
                      type="text"
                      value={formData.ogTitle || ''}
                      onChange={(e) => setFormData({ ...formData, ogTitle: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      maxLength={70}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">OG Description</label>
                    <textarea
                      value={formData.ogDescription || ''}
                      onChange={(e) => setFormData({ ...formData, ogDescription: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      rows={2}
                      maxLength={200}
                    />
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="mt-6 border-t pt-4">
                <h3 className="text-xl font-semibold mb-4">Social Media Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Facebook URL</label>
                    <input
                      type="url"
                      value={formData.facebookUrl || ''}
                      onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Instagram URL</label>
                    <input
                      type="url"
                      value={formData.instagramUrl || ''}
                      onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Twitter URL</label>
                    <input
                      type="url"
                      value={formData.twitterUrl || ''}
                      onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      value={formData.linkedinUrl || ''}
                      onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">YouTube URL</label>
                    <input
                      type="url"
                      value={formData.youtubeUrl || ''}
                      onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">WhatsApp Number</label>
                    <input
                      type="text"
                      value={formData.whatsappNumber || ''}
                      onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="91XXXXXXXXXX"
                    />
                  </div>
                </div>
              </div>

              {/* Google Business */}
              <div className="mt-6 border-t pt-4">
                <h3 className="text-xl font-semibold mb-4">Google Business</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Google Business ID</label>
                    <input
                      type="text"
                      value={formData.googleBusinessId || ''}
                      onChange={(e) => setFormData({ ...formData, googleBusinessId: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Google Maps URL</label>
                    <input
                      type="url"
                      value={formData.googleMapsUrl || ''}
                      onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Social Sharing Settings */}
              <div className="mt-6 border-t pt-4">
                <h3 className="text-xl font-semibold mb-4">Social Sharing Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.enableSocialSharing !== false}
                      onChange={(e) => setFormData({ ...formData, enableSocialSharing: e.target.checked })}
                      className="mr-2"
                    />
                    <label>Enable Social Sharing Popup</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.enableWhatsAppSharing !== false}
                      onChange={(e) => setFormData({ ...formData, enableWhatsAppSharing: e.target.checked })}
                      className="mr-2"
                    />
                    <label>Enable WhatsApp Sharing</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.enableFacebookSharing !== false}
                      onChange={(e) => setFormData({ ...formData, enableFacebookSharing: e.target.checked })}
                      className="mr-2"
                    />
                    <label>Enable Facebook Sharing</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.enableTwitterSharing !== false}
                      onChange={(e) => setFormData({ ...formData, enableTwitterSharing: e.target.checked })}
                      className="mr-2"
                    />
                    <label>Enable Twitter Sharing</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.enableLinkedInSharing !== false}
                      onChange={(e) => setFormData({ ...formData, enableLinkedInSharing: e.target.checked })}
                      className="mr-2"
                    />
                    <label>Enable LinkedIn Sharing</label>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Social Sharing Message</label>
                    <textarea
                      value={formData.socialSharingMessage || ''}
                      onChange={(e) => setFormData({ ...formData, socialSharingMessage: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      rows={2}
                      placeholder="Custom message for social sharing"
                    />
                  </div>
                </div>
              </div>

              {/* Analytics */}
              <div className="mt-6 border-t pt-4">
                <h3 className="text-xl font-semibold mb-4">Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Google Analytics ID</label>
                    <input
                      type="text"
                      value={formData.googleAnalyticsId || ''}
                      onChange={(e) => setFormData({ ...formData, googleAnalyticsId: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Facebook Pixel ID</label>
                    <input
                      type="text"
                      value={formData.facebookPixelId || ''}
                      onChange={(e) => setFormData({ ...formData, facebookPixelId: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingId ? 'Update' : 'Create'} SEO Entry
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* SEO Entries Table */}
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No SEO entries found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Rank</th>
                    <th className="border p-2 text-left">Shop Name</th>
                    <th className="border p-2 text-left">Category</th>
                    <th className="border p-2 text-left">Area</th>
                    <th className="border p-2 text-left">Pincode</th>
                    <th className="border p-2 text-left">Email</th>
                    <th className="border p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries
                    .sort((a, b) => a.ranking - b.ranking)
                    .map((entry) => (
                      <tr key={entry._id} className="hover:bg-gray-50">
                        <td className="border p-2">
                          <span className="font-bold text-blue-600">#{entry.ranking}</span>
                        </td>
                        <td className="border p-2">{entry.shopName}</td>
                        <td className="border p-2">{entry.category}</td>
                        <td className="border p-2">{entry.area}</td>
                        <td className="border p-2">{entry.pincode || '-'}</td>
                        <td className="border p-2">{entry.emailId}</td>
                        <td className="border p-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(entry._id)}
                              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

