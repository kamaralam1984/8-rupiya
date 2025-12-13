'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';

interface DisplayLimits {
  nearbyShops: number;
  leftRail: number;
  featuredShops: number;
  topCategories: number;
  latestOffers: number;
  featuredBusinesses: number;
}

interface IconSizes {
  bottomStrip: number;
  leftRail: number;
  featuredBusinesses: number;
  latestOffers: number;
  topCategories: number;
}

interface SectionVisibility {
  leftRail: boolean;
  rightRail: boolean;
  bottomRail: boolean;
  rightSide: boolean;
}

export default function DisplayLimitsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [limits, setLimits] = useState<DisplayLimits>({
    nearbyShops: 30,
    leftRail: 3,
    featuredShops: 10,
    topCategories: 20,
    latestOffers: 10,
    featuredBusinesses: 10,
  });
  const [iconSizes, setIconSizes] = useState<IconSizes>({
    bottomStrip: 66,
    leftRail: 100,
    featuredBusinesses: 200,
    latestOffers: 200,
    topCategories: 112,
  });
  const [sectionVisibility, setSectionVisibility] = useState<SectionVisibility>({
    leftRail: true,
    rightRail: true,
    bottomRail: true,
    rightSide: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.settings) {
        if (data.settings.displayLimits) {
          setLimits(data.settings.displayLimits);
        }
        if (data.settings.iconSizes) {
          setIconSizes(data.settings.iconSizes);
        }
        if (data.settings.sectionVisibility) {
          setSectionVisibility(data.settings.sectionVisibility);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ displayLimits: limits, iconSizes: iconSizes, sectionVisibility: sectionVisibility }),
      });

      const data = await res.json();
      console.log('💾 Save response:', data);
      if (data.success) {
        toast.success('Settings updated successfully!');
        // Reload settings to reflect changes
        await fetchSettings();
      } else {
        toast.error(data.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: keyof DisplayLimits, value: number) => {
    setLimits((prev) => ({
      ...prev,
      [key]: Math.max(1, Math.min(100, value)),
    }));
  };

  const handleIconSizeChange = (key: keyof IconSizes, value: number) => {
    setIconSizes((prev) => ({
      ...prev,
      [key]: Math.max(30, Math.min(500, value)),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  const limitConfigs = [
    {
      key: 'nearbyShops' as keyof DisplayLimits,
      label: 'Nearby Shops (Bottom Strip)',
      description: 'Number of shops to display in the "Nearby Shops" section at the bottom',
      min: 1,
      max: 100,
      default: 30,
    },
    {
      key: 'leftRail' as keyof DisplayLimits,
      label: 'Left Rail Shops',
      description: 'Number of shops to display in the left sidebar',
      min: 1,
      max: 10,
      default: 3,
    },
    {
      key: 'featuredShops' as keyof DisplayLimits,
      label: 'Featured Shops',
      description: 'Number of featured shops to display',
      min: 1,
      max: 50,
      default: 10,
    },
    {
      key: 'topCategories' as keyof DisplayLimits,
      label: 'Top Categories',
      description: 'Number of categories to display in the Top Categories section',
      min: 1,
      max: 50,
      default: 20,
    },
    {
      key: 'latestOffers' as keyof DisplayLimits,
      label: 'Latest Offers Patna',
      description: 'Number of offers to display in the Latest Offers section',
      min: 1,
      max: 50,
      default: 10,
    },
    {
      key: 'featuredBusinesses' as keyof DisplayLimits,
      label: 'Featured Businesses',
      description: 'Number of featured businesses to display',
      min: 1,
      max: 50,
      default: 10,
    },
  ];

  const iconSizeConfigs = [
    {
      key: 'bottomStrip' as keyof IconSizes,
      label: 'Bottom Strip (Nearby Shops)',
      description: 'Icon/image size in pixels for shops in the bottom strip',
      min: 30,
      max: 200,
      default: 66,
    },
    {
      key: 'leftRail' as keyof IconSizes,
      label: 'Left Rail Shops',
      description: 'Icon/image size in pixels for shops in the left sidebar',
      min: 50,
      max: 300,
      default: 100,
    },
    {
      key: 'featuredBusinesses' as keyof IconSizes,
      label: 'Featured Businesses',
      description: 'Icon/image size in pixels for featured businesses',
      min: 100,
      max: 500,
      default: 200,
    },
    {
      key: 'latestOffers' as keyof IconSizes,
      label: 'Latest Offers',
      description: 'Icon/image size in pixels for latest offers',
      min: 100,
      max: 500,
      default: 200,
    },
    {
      key: 'topCategories' as keyof IconSizes,
      label: 'Top Categories',
      description: 'Icon/image size in pixels for category icons',
      min: 50,
      max: 200,
      default: 112,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Display Limits Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">⚙️ Display Limits Configuration</h1>
        <p className="text-gray-600 mb-6">
          Configure how many items are displayed in each section of the homepage
        </p>

        <div className="space-y-6">
          {limitConfigs.map((config) => (
            <div key={config.key} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    {config.label}
                  </label>
                  <p className="text-sm text-gray-600">{config.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Range: {config.min} - {config.max} | Default: {config.default}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={config.min}
                    max={config.max}
                    value={limits[config.key]}
                    onChange={(e) => handleChange(config.key, parseInt(e.target.value) || config.min)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-semibold"
                  />
                  <button
                    onClick={() => handleChange(config.key, config.default)}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Reset to default"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={fetchSettings}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>

      {/* Icon Sizes Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">🖼️ Icon/Image Sizes Configuration</h1>
        <p className="text-gray-600 mb-6">
          Configure the size of icons and images in each section (in pixels)
        </p>

        <div className="space-y-6">
          {iconSizeConfigs.map((config) => (
            <div key={config.key} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    {config.label}
                  </label>
                  <p className="text-sm text-gray-600">{config.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Range: {config.min}px - {config.max}px | Default: {config.default}px
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={config.min}
                    max={config.max}
                    value={iconSizes[config.key]}
                    onChange={(e) => handleIconSizeChange(config.key, parseInt(e.target.value) || config.min)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-semibold"
                  />
                  <span className="text-sm text-gray-500">px</span>
                  <button
                    onClick={() => handleIconSizeChange(config.key, config.default)}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Reset to default"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={fetchSettings}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>

      {/* Section Visibility Configuration */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">👁️ Section Visibility Configuration</h1>
        <p className="text-gray-600 mb-6">
          Turn sections ON/OFF. When a section is OFF, other sections will automatically adjust to fill the space.
        </p>

        <div className="space-y-4">
          {[
            { key: 'leftRail' as keyof SectionVisibility, label: 'Left Rail', description: 'Left sidebar section with shops' },
            { key: 'rightRail' as keyof SectionVisibility, label: 'Right Rail', description: 'Right rail section with shops (vertical list)' },
            { key: 'bottomRail' as keyof SectionVisibility, label: 'Bottom Rail (Featured Shops)', description: 'Featured Shops grid section' },
            { key: 'rightSide' as keyof SectionVisibility, label: 'Right Side', description: 'Right side section with shops (single large)' },
          ].map((config) => (
            <div key={config.key} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    {config.label}
                  </label>
                  <p className="text-sm text-gray-600">{config.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSectionVisibility((prev) => ({
                      ...prev,
                      [config.key]: !prev[config.key],
                    }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      sectionVisibility[config.key] ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        sectionVisibility[config.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-sm font-medium ${sectionVisibility[config.key] ? 'text-green-600' : 'text-gray-500'}`}>
                    {sectionVisibility[config.key] ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={fetchSettings}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

