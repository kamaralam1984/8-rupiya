'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { safeJsonParse } from '@/app/utils/fetchHelpers';
import Link from 'next/link';

interface HomepageSettings {
  _id?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  sections: {
    hero: boolean;
    categories: boolean;
    offers: boolean;
    featuredBusinesses: boolean;
    topRated: boolean;
    newBusinesses: boolean;
  };
  shopConfig: {
    enabled: boolean;
    featuredShops: string[];
    categories: string[];
    displayCount: number;
  };
  functions: {
    searchBar: boolean;
    locationFilter: boolean;
    categoryFilter: boolean;
    priceFilter: boolean;
    ratingFilter: boolean;
    sortOptions: boolean;
    quickView: boolean;
    compare: boolean;
    wishlist: boolean;
  };
  layout: {
    theme: string;
    primaryColor: string;
    secondaryColor: string;
    containerWidth: string;
    sectionSpacing: string;
  };
  isActive: boolean;
}

export default function HomepageManagement() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [settings, setSettings] = useState<HomepageSettings>({
    sections: {
      hero: true,
      categories: true,
      offers: true,
      featuredBusinesses: true,
      topRated: true,
      newBusinesses: true,
    },
    shopConfig: {
      enabled: false,
      featuredShops: [],
      categories: [],
      displayCount: 12,
    },
    functions: {
      searchBar: true,
      locationFilter: true,
      categoryFilter: true,
      priceFilter: false,
      ratingFilter: true,
      sortOptions: true,
      quickView: false,
      compare: false,
      wishlist: false,
    },
    layout: {
      theme: 'light',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      containerWidth: '98%',
      sectionSpacing: '40px',
    },
    isActive: true,
  });

  const [duplicateForm, setDuplicateForm] = useState({
    pageTitle: '',
    pageSlug: '',
    includeShops: true,
    includeFunctions: true,
  });

  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [saveAsForm, setSaveAsForm] = useState({
    templateName: '',
    description: '',
  });

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/homepage', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await safeJsonParse<{ settings: HomepageSettings }>(response);
      if (data?.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching homepage settings:', error);
      toast.error('Failed to load homepage settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Clean settings object before sending - remove _id and other Mongoose fields
      const { _id, createdAt, updatedAt, ...cleanSettings } = settings as HomepageSettings & { createdAt?: any; updatedAt?: any };
      
      const response = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cleanSettings),
      });

      const data = await safeJsonParse<{ success: boolean; settings?: any; error?: string; details?: string }>(response);
      
      if (!response.ok) {
        const errorText = data?.error || data?.details || `HTTP ${response.status}`;
        throw new Error(errorText);
      }

      if (data?.success) {
        // Update local state with saved settings if returned
        if (data.settings) {
          setSettings(data.settings);
        }
        toast.success('Homepage settings saved successfully!');
        // Refresh to get latest data
        fetchSettings();
      } else {
        throw new Error(data?.error || 'Failed to save settings');
      }
    } catch (error: any) {
      console.error('Error saving homepage settings:', error);
      const errorMessage = error.message || error.details || 'Failed to save homepage settings';
      toast.error(errorMessage, {
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!duplicateForm.pageTitle.trim() || !duplicateForm.pageSlug.trim()) {
      toast.error('Page title and slug are required');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/homepage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(duplicateForm),
      });

      const data = await safeJsonParse<{ success: boolean; page: any; message?: string }>(response);
      if (data?.success && data?.page) {
        const pageTitle = data.page.title || duplicateForm.pageTitle;
        toast.success(`✅ Page "${pageTitle}" saved successfully in Pages Management!`, {
          duration: 5000,
        });
        
        setShowDuplicateModal(false);
        setDuplicateForm({
          pageTitle: '',
          pageSlug: '',
          includeShops: true,
          includeFunctions: true,
        });
        
        // Show success message with direct link
        setTimeout(() => {
          const userChoice = confirm(
            `🎉 Success! Page "${pageTitle}" has been saved with name "${pageTitle}" in Pages Management.\n\n` +
            `• Page Title: ${pageTitle}\n` +
            `• Page URL: /${data.page.slug}\n` +
            `• Status: Published\n\n` +
            `Would you like to open Pages Management to view/edit this page?`
          );
          
          if (userChoice) {
            window.location.href = '/admin/pages';
          }
        }, 500);
      } else {
        throw new Error(data?.message || 'Failed to duplicate homepage');
      }
    } catch (error: any) {
      console.error('Error duplicating homepage:', error);
      toast.error(error.message || 'Failed to duplicate homepage');
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading homepage settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Homepage Management
          </h1>
          <p className="text-gray-600 mt-1">Configure and manage your homepage settings</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/"
            target="_blank"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Homepage
          </Link>
          <button
            onClick={() => setShowSaveAsModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save As...
          </button>
          <button
            onClick={() => setShowDuplicateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Duplicate as Page
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Sections Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Page Sections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(settings.sections).map(([key, value]) => (
            <label
              key={key}
              className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-all cursor-pointer"
            >
              <input
                type="checkbox"
                checked={value}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    sections: { ...settings.sections, [key]: e.target.checked },
                  })
                }
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Shop Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Shop Configuration</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.shopConfig.enabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  shopConfig: { ...settings.shopConfig, enabled: e.target.checked },
                })
              }
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Enable Shop Section</span>
          </label>
        </div>
        {settings.shopConfig.enabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Count
              </label>
              <input
                type="number"
                value={settings.shopConfig.displayCount}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shopConfig: {
                      ...settings.shopConfig,
                      displayCount: parseInt(e.target.value) || 12,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                max="50"
              />
            </div>
          </div>
        )}
      </div>

      {/* Functions Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Available Functions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(settings.functions).map(([key, value]) => (
            <label
              key={key}
              className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-green-300 transition-all cursor-pointer"
            >
              <input
                type="checkbox"
                checked={value}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    functions: { ...settings.functions, [key]: e.target.checked },
                  })
                }
                className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Layout Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Layout Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
            <select
              value={settings.layout.theme}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  layout: { ...settings.layout, theme: e.target.value },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Container Width</label>
            <input
              type="text"
              value={settings.layout.containerWidth}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  layout: { ...settings.layout, containerWidth: e.target.value },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="98%"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.layout.primaryColor}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    layout: { ...settings.layout, primaryColor: e.target.value },
                  })
                }
                className="w-16 h-10 rounded-lg border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={settings.layout.primaryColor}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    layout: { ...settings.layout, primaryColor: e.target.value },
                  })
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.layout.secondaryColor}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    layout: { ...settings.layout, secondaryColor: e.target.value },
                  })
                }
                className="w-16 h-10 rounded-lg border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={settings.layout.secondaryColor}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    layout: { ...settings.layout, secondaryColor: e.target.value },
                  })
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Duplicate Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Save Homepage as New Page</h2>
                <p className="text-sm text-gray-600 mt-1">Create a new page with a custom name and save it to Pages Management</p>
              </div>
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-2">
                <p className="text-sm text-blue-800">
                  <strong>ℹ️ Note:</strong> This will create a new page in <strong>Pages Management</strong> with all homepage settings, sections, and configurations. The page will be saved and visible in your admin pages list.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Title *
                </label>
                <input
                  type="text"
                  value={duplicateForm.pageTitle}
                  onChange={(e) =>
                    setDuplicateForm({
                      ...duplicateForm,
                      pageTitle: e.target.value,
                      pageSlug: generateSlug(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                  placeholder="e.g., Shop Directory, Business Listings, Featured Stores"
                  required
                />
                <p className="text-xs text-gray-600 mt-1">
                  <strong>Page Name:</strong> This name will be saved in Pages Management and displayed on the page
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Slug (URL) *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">/</span>
                  <input
                    type="text"
                    value={duplicateForm.pageSlug}
                    onChange={(e) =>
                      setDuplicateForm({
                        ...duplicateForm,
                        pageSlug: generateSlug(e.target.value),
                      })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="page-slug"
                    required
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  <strong>URL Slug:</strong> Auto-generated from page name. Page will be accessible at: <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-mono">/{duplicateForm.pageSlug || 'page-slug'}</code>
                </p>
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                  <p className="text-xs text-green-800">
                    <strong>✅ Save Status:</strong> Page will be automatically <strong>saved</strong> as <strong>"{duplicateForm.pageTitle || 'New Page'}"</strong> in Pages Management when you click "Save & Create Page"
                  </p>
                </div>
              </div>

              <div className="space-y-3 border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Include Options:</h3>
                <label className="flex items-start gap-3 cursor-pointer p-3 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-all">
                  <input
                    type="checkbox"
                    checked={duplicateForm.includeShops}
                    onChange={(e) =>
                      setDuplicateForm({ ...duplicateForm, includeShops: e.target.checked })
                    }
                    className="w-5 h-5 mt-0.5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700 block">Include Shop Section</span>
                    <span className="text-xs text-gray-500">Add shop directory with {settings.shopConfig.displayCount} items</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-3 border-2 border-gray-200 rounded-lg hover:border-green-300 transition-all">
                  <input
                    type="checkbox"
                    checked={duplicateForm.includeFunctions}
                    onChange={(e) =>
                      setDuplicateForm({ ...duplicateForm, includeFunctions: e.target.checked })
                    }
                    className="w-5 h-5 mt-0.5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700 block">Include All Functions</span>
                    <span className="text-xs text-gray-500">
                      {Object.values(settings.functions).filter(Boolean).length} active functions (search, filters, etc.)
                    </span>
                  </div>
                </label>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  <strong>What will be included:</strong>
                </p>
                <ul className="text-xs text-gray-600 mt-2 space-y-1 list-disc list-inside">
                  {Object.entries(settings.sections)
                    .filter(([_, enabled]) => enabled)
                    .map(([key]) => (
                      <li key={key}>{key.replace(/([A-Z])/g, ' $1').trim()}</li>
                    ))}
                  {duplicateForm.includeShops && settings.shopConfig.enabled && (
                    <li>Shop Directory ({settings.shopConfig.displayCount} items)</li>
                  )}
                  {duplicateForm.includeFunctions && (
                    <li>
                      Functions ({Object.values(settings.functions).filter(Boolean).length} active)
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Summary Section */}
            {duplicateForm.pageTitle.trim() && (
              <div className="mx-6 mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>✅</span>
                  Page Will Be Saved As:
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-medium">Page Name:</span>
                    <span className="text-gray-900 font-bold">{duplicateForm.pageTitle}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-medium">URL Slug:</span>
                    <code className="text-blue-700 bg-white px-2 py-1 rounded font-mono">/{duplicateForm.pageSlug}</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-medium">Saved Location:</span>
                    <span className="text-gray-900 font-semibold">Pages Management</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-xs text-green-800">
                      <strong>✓ This page will be saved with name "{duplicateForm.pageTitle}" and will appear in your Pages Management list.</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDuplicate}
                disabled={saving || !duplicateForm.pageTitle.trim()}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving Page...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save & Create Page</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

