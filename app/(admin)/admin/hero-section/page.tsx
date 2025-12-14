'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';

interface Shop {
  id?: string;
  _id?: string;
  shopName: string;
  ownerName: string;
  category: string;
  imageUrl?: string;
  photoUrl?: string;
  planType?: string;
}

interface HeroSectionSettings {
  sections: {
    slider: boolean;
    leftRail: boolean;
    hero: boolean;
    rightRail: boolean;
    bottomStrip: boolean;
  };
  slider: {
    enabled: boolean;
    height: string;
    backgroundColor: string;
    autoPlay: boolean;
    transitionDuration: number;
    shopIds: string[];
  };
  leftRail: {
    enabled: boolean;
    count: number;
    height: string;
    backgroundColor: string;
    borderColor: string;
    shopIds: string[];
  };
  hero: {
    enabled: boolean;
    height: string;
    backgroundColor: string;
    borderColor: string;
    borderRadius: string;
    shopId?: string;
  };
  rightRail: {
    enabled: boolean;
    count: number;
    height: string;
    backgroundColor: string;
    borderColor: string;
    shopIds: string[];
  };
  bottomStrip: {
    enabled: boolean;
    count: number;
    height: string;
    backgroundColor: string;
    borderColor: string;
    shopIds: string[];
  };
  global: {
    containerWidth: string;
    sectionSpacing: string;
    backgroundColor: string;
    borderRadius: string;
    padding: string;
  };
}

export default function HeroSectionPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState<HeroSectionSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'slider' | 'leftRail' | 'hero' | 'rightRail' | 'bottomStrip' | 'global'>('slider');

  useEffect(() => {
    fetchSettings();
    fetchShops();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/hero-section', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchShops = async () => {
    try {
      const res = await fetch('/api/admin/shops', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setShops(data.shops || []);
      }
    } catch (error: any) {
      console.error('Error fetching shops:', error);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const res = await fetch('/api/admin/hero-section', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Settings saved successfully!');
        setSettings(data.settings);
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all settings to default?')) return;

    try {
      const res = await fetch('/api/admin/hero-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'reset' }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Settings reset to default');
        setSettings(data.settings);
      }
    } catch (error: any) {
      console.error('Error resetting settings:', error);
      toast.error('Failed to reset settings');
    }
  };

  const updateSettings = (path: string, value: any) => {
    if (!settings) return;

    const keys = path.split('.');
    const newSettings = { ...settings };
    let current: any = newSettings;

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
  };

  const addShopToSection = (section: 'slider' | 'leftRail' | 'rightRail' | 'bottomStrip', shopId: string) => {
    if (!settings) return;

    const sectionKey = `${section}.shopIds` as const;
    const currentIds = settings[section].shopIds || [];
    const shopIdToAdd = shopId || '';
    if (shopIdToAdd && !currentIds.includes(shopIdToAdd)) {
      updateSettings(sectionKey, [...currentIds, shopIdToAdd]);
    }
  };

  const removeShopFromSection = (section: 'slider' | 'leftRail' | 'rightRail' | 'bottomStrip', shopId: string) => {
    if (!settings) return;

    const sectionKey = `${section}.shopIds` as const;
    const currentIds = settings[section].shopIds || [];
    updateSettings(sectionKey, currentIds.filter((id) => id !== shopId));
  };

  const filteredShops = shops.filter((shop) => {
    const shopId = shop.id || shop._id || '';
    return (
      shop.shopName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Hero Section Control
          </h1>
          <p className="text-gray-600 mt-1">Manage Best Deals Slider, Left Rail, Hero Banner, Right Rail, and Bottom Strip</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Quick On/Off Toggles */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Section Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Best Deals Slider Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎠</span>
              <div>
                <p className="font-medium text-gray-900">Best Deals Slider</p>
                <p className="text-xs text-gray-500">Slider section</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.sections.slider && settings.slider.enabled}
                onChange={(e) => {
                  updateSettings('sections.slider', e.target.checked);
                  updateSettings('slider.enabled', e.target.checked);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Left Rail Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⬅️</span>
              <div>
                <p className="font-medium text-gray-900">Left Rail</p>
                <p className="text-xs text-gray-500">{settings.leftRail.count} shops</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.sections.leftRail && settings.leftRail.enabled}
                onChange={(e) => {
                  updateSettings('sections.leftRail', e.target.checked);
                  updateSettings('leftRail.enabled', e.target.checked);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Hero Banner Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⭐</span>
              <div>
                <p className="font-medium text-gray-900">Hero Banner</p>
                <p className="text-xs text-gray-500">Center banner</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.sections.hero && settings.hero.enabled}
                onChange={(e) => {
                  updateSettings('sections.hero', e.target.checked);
                  updateSettings('hero.enabled', e.target.checked);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Right Rail Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">➡️</span>
              <div>
                <p className="font-medium text-gray-900">Right Rail</p>
                <p className="text-xs text-gray-500">{settings.rightRail.count} shops</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.sections.rightRail && settings.rightRail.enabled}
                onChange={(e) => {
                  updateSettings('sections.rightRail', e.target.checked);
                  updateSettings('rightRail.enabled', e.target.checked);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Bottom Strip Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⬇️</span>
              <div>
                <p className="font-medium text-gray-900">Bottom Strip</p>
                <p className="text-xs text-gray-500">{settings.bottomStrip.count} shops</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.sections.bottomStrip && settings.bottomStrip.enabled}
                onChange={(e) => {
                  updateSettings('sections.bottomStrip', e.target.checked);
                  updateSettings('bottomStrip.enabled', e.target.checked);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2 border-b border-gray-200">
          {[
            { id: 'slider', label: 'Best Deals Slider', icon: '🎠' },
            { id: 'leftRail', label: 'Left Rail', icon: '⬅️' },
            { id: 'hero', label: 'Hero Banner', icon: '⭐' },
            { id: 'rightRail', label: 'Right Rail', icon: '➡️' },
            { id: 'bottomStrip', label: 'Bottom Strip', icon: '⬇️' },
            { id: 'global', label: 'Global Settings', icon: '⚙️' },
          ].map((tab, index) => (
            <button
              key={tab.id || `tab-${index}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Slider Tab */}
          {activeTab === 'slider' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Best Deals Slider Settings</h3>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.sections.slider}
                    onChange={(e) => updateSettings('sections.slider', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span>Show Section</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enabled</label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.slider.enabled}
                      onChange={(e) => updateSettings('slider.enabled', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span>Enable Slider</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                  <select
                    value={settings.slider.height}
                    onChange={(e) => updateSettings('slider.height', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="h-20">Small (h-20)</option>
                    <option value="h-24">Medium (h-24)</option>
                    <option value="h-32">Large (h-32)</option>
                    <option value="h-36">Extra Large (h-36)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.slider.backgroundColor}
                      onChange={(e) => updateSettings('slider.backgroundColor', e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={settings.slider.backgroundColor}
                      onChange={(e) => updateSettings('slider.backgroundColor', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transition Duration (ms)</label>
                  <input
                    type="number"
                    value={settings.slider.transitionDuration || ''}
                    onChange={(e) => updateSettings('slider.transitionDuration', parseInt(e.target.value) || 5000)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min="1000"
                    max="10000"
                    step="500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Auto Play</label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.slider.autoPlay}
                      onChange={(e) => updateSettings('slider.autoPlay', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span>Enable Auto Play</span>
                  </label>
                </div>
              </div>

              {/* Shop Selection */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-4">Selected Shops ({settings.slider.shopIds.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {settings.slider.shopIds.map((shopId, index) => {
                    const shop = shops.find((s) => (s.id || s._id) === shopId);
                    if (!shop) return null;
                    return (
                      <div key={`slider-selected-${shopId}-${index}`} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{shop.shopName}</p>
                          <p className="text-sm text-gray-500">{shop.ownerName}</p>
                        </div>
                        <button
                          onClick={() => removeShopFromSection('slider', shopId)}
                          className="text-red-600 hover:text-red-800 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Shop Search */}
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Search shops to add..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                  />
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    {filteredShops
                      .filter((shop) => {
                        const shopId = shop.id || shop._id || '';
                        return !settings.slider.shopIds.includes(shopId);
                      })
                      .slice(0, 20)
                      .map((shop, index) => {
                        const shopId = shop.id || shop._id || `slider-shop-${index}`;
                        return (
                          <div
                            key={shopId}
                            className="p-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-100"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{shop.shopName}</p>
                              <p className="text-sm text-gray-500">{shop.ownerName} • {shop.category}</p>
                            </div>
                            <button
                              onClick={() => addShopToSection('slider', shopId)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                              Add
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Left Rail Tab */}
          {activeTab === 'leftRail' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Left Rail Settings</h3>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.sections.leftRail}
                    onChange={(e) => updateSettings('sections.leftRail', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span>Show Section</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enabled</label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.leftRail.enabled}
                      onChange={(e) => updateSettings('leftRail.enabled', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span>Enable Left Rail</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shop Count</label>
                  <input
                    type="number"
                    value={settings.leftRail.count ?? ''}
                    onChange={(e) => updateSettings('leftRail.count', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min="0"
                    max="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                  <input
                    type="text"
                    value={settings.leftRail.height}
                    onChange={(e) => updateSettings('leftRail.height', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="h-[391px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.leftRail.backgroundColor}
                      onChange={(e) => updateSettings('leftRail.backgroundColor', e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={settings.leftRail.backgroundColor}
                      onChange={(e) => updateSettings('leftRail.backgroundColor', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Border Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.leftRail.borderColor}
                      onChange={(e) => updateSettings('leftRail.borderColor', e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={settings.leftRail.borderColor}
                      onChange={(e) => updateSettings('leftRail.borderColor', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Shop Selection */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-4">Selected Shops ({settings.leftRail.shopIds.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {settings.leftRail.shopIds.map((shopId, index) => {
                    const shop = shops.find((s) => s.id === shopId || s._id === shopId);
                    if (!shop) return null;
                    return (
                      <div key={`leftrail-selected-${shopId}-${index}`} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{shop.shopName}</p>
                          <p className="text-sm text-gray-500">{shop.ownerName}</p>
                        </div>
                        <button
                          onClick={() => removeShopFromSection('leftRail', shopId)}
                          className="text-red-600 hover:text-red-800 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Search shops to add..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                  />
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    {filteredShops
                      .filter((shop) => {
                        const shopId = shop.id || shop._id || '';
                        return !settings.leftRail.shopIds.includes(shopId);
                      })
                      .slice(0, 20)
                      .map((shop, index) => {
                        const shopId = shop.id || shop._id || `leftrail-shop-${index}`;
                        return (
                          <div
                            key={shopId}
                            className="p-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-100"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{shop.shopName}</p>
                              <p className="text-sm text-gray-500">{shop.ownerName} • {shop.category}</p>
                            </div>
                            <button
                              onClick={() => addShopToSection('leftRail', shopId)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                              Add
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hero Banner Tab */}
          {activeTab === 'hero' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Hero Banner Settings</h3>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.sections.hero}
                    onChange={(e) => updateSettings('sections.hero', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span>Show Section</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enabled</label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.hero.enabled}
                      onChange={(e) => updateSettings('hero.enabled', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span>Enable Hero Banner</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                  <input
                    type="text"
                    value={settings.hero.height}
                    onChange={(e) => updateSettings('hero.height', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="h-[391px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.hero.backgroundColor}
                      onChange={(e) => updateSettings('hero.backgroundColor', e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={settings.hero.backgroundColor}
                      onChange={(e) => updateSettings('hero.backgroundColor', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Border Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.hero.borderColor}
                      onChange={(e) => updateSettings('hero.borderColor', e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={settings.hero.borderColor}
                      onChange={(e) => updateSettings('hero.borderColor', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Border Radius</label>
                  <select
                    value={settings.hero.borderRadius}
                    onChange={(e) => updateSettings('hero.borderRadius', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="rounded-none">None</option>
                    <option value="rounded-sm">Small</option>
                    <option value="rounded">Medium</option>
                    <option value="rounded-lg">Large</option>
                    <option value="rounded-xl">Extra Large</option>
                    <option value="rounded-2xl">2XL</option>
                  </select>
                </div>
              </div>

              {/* Shop Selection for Hero */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-4">Selected Shop</h4>
                {settings.hero.shopId && (
                  <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between mb-4">
                    <div className="flex-1">
                      {(() => {
                        const shop = shops.find((s) => s.id === settings.hero.shopId);
                        return shop ? (
                          <>
                            <p className="font-medium">{shop.shopName}</p>
                            <p className="text-sm text-gray-500">{shop.ownerName}</p>
                          </>
                        ) : (
                          <p className="text-gray-500">Shop not found</p>
                        );
                      })()}
                    </div>
                    <button
                      onClick={() => updateSettings('hero.shopId', '')}
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Search shop for hero banner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                />
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredShops
                    .filter((shop) => {
                      const shopId = shop.id || shop._id || '';
                      return shopId !== settings.hero.shopId;
                    })
                    .slice(0, 20)
                    .map((shop, index) => {
                      const shopId = shop.id || shop._id || `hero-shop-${index}`;
                      return (
                        <div
                          key={shopId}
                          className="p-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-100"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{shop.shopName}</p>
                            <p className="text-sm text-gray-500">{shop.ownerName} • {shop.category}</p>
                          </div>
                          <button
                            onClick={() => updateSettings('hero.shopId', shopId)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            Select
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Right Rail Tab - Similar to Left Rail */}
          {activeTab === 'rightRail' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Right Rail Settings</h3>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.sections.rightRail}
                    onChange={(e) => updateSettings('sections.rightRail', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span>Show Section</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enabled</label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.rightRail.enabled}
                      onChange={(e) => updateSettings('rightRail.enabled', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span>Enable Right Rail</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shop Count</label>
                  <input
                    type="number"
                    value={settings.rightRail.count ?? ''}
                    onChange={(e) => updateSettings('rightRail.count', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min="0"
                    max="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                  <input
                    type="text"
                    value={settings.rightRail.height}
                    onChange={(e) => updateSettings('rightRail.height', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.rightRail.backgroundColor}
                      onChange={(e) => updateSettings('rightRail.backgroundColor', e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={settings.rightRail.backgroundColor}
                      onChange={(e) => updateSettings('rightRail.backgroundColor', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Border Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.rightRail.borderColor}
                      onChange={(e) => updateSettings('rightRail.borderColor', e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={settings.rightRail.borderColor}
                      onChange={(e) => updateSettings('rightRail.borderColor', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Shop Selection */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-4">Selected Shops ({settings.rightRail.shopIds.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {settings.rightRail.shopIds.map((shopId, index) => {
                    const shop = shops.find((s) => s.id === shopId || s._id === shopId);
                    if (!shop) return null;
                    return (
                      <div key={`rightrail-selected-${shopId}-${index}`} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{shop.shopName}</p>
                          <p className="text-sm text-gray-500">{shop.ownerName}</p>
                        </div>
                        <button
                          onClick={() => removeShopFromSection('rightRail', shopId)}
                          className="text-red-600 hover:text-red-800 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Search shops to add..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                  />
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    {filteredShops
                      .filter((shop) => {
                        const shopId = shop.id || shop._id || '';
                        return !settings.rightRail.shopIds.includes(shopId);
                      })
                      .slice(0, 20)
                      .map((shop, index) => {
                        const shopId = shop.id || shop._id || `rightrail-shop-${index}`;
                        return (
                          <div
                            key={shopId}
                            className="p-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-100"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{shop.shopName}</p>
                              <p className="text-sm text-gray-500">{shop.ownerName} • {shop.category}</p>
                            </div>
                            <button
                              onClick={() => addShopToSection('rightRail', shopId)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                              Add
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Strip Tab */}
          {activeTab === 'bottomStrip' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Bottom Strip Settings</h3>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.sections.bottomStrip}
                    onChange={(e) => updateSettings('sections.bottomStrip', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span>Show Section</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enabled</label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.bottomStrip.enabled}
                      onChange={(e) => updateSettings('bottomStrip.enabled', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span>Enable Bottom Strip</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shop Count</label>
                  <input
                    type="number"
                    value={settings.bottomStrip.count ?? ''}
                    onChange={(e) => updateSettings('bottomStrip.count', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min="0"
                    max="30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                  <input
                    type="text"
                    value={settings.bottomStrip.height}
                    onChange={(e) => updateSettings('bottomStrip.height', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.bottomStrip.backgroundColor}
                      onChange={(e) => updateSettings('bottomStrip.backgroundColor', e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={settings.bottomStrip.backgroundColor}
                      onChange={(e) => updateSettings('bottomStrip.backgroundColor', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Border Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.bottomStrip.borderColor}
                      onChange={(e) => updateSettings('bottomStrip.borderColor', e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={settings.bottomStrip.borderColor}
                      onChange={(e) => updateSettings('bottomStrip.borderColor', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Shop Selection */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-4">Selected Shops ({settings.bottomStrip.shopIds.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {settings.bottomStrip.shopIds.map((shopId, index) => {
                    const shop = shops.find((s) => s.id === shopId || s._id === shopId);
                    if (!shop) return null;
                    return (
                      <div key={`bottomstrip-selected-${shopId}-${index}`} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{shop.shopName}</p>
                          <p className="text-sm text-gray-500">{shop.ownerName}</p>
                        </div>
                        <button
                          onClick={() => removeShopFromSection('bottomStrip', shopId)}
                          className="text-red-600 hover:text-red-800 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Search shops to add..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                  />
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    {filteredShops
                      .filter((shop) => {
                        const shopId = shop.id || shop._id || '';
                        return !settings.bottomStrip.shopIds.includes(shopId);
                      })
                      .slice(0, 20)
                      .map((shop, index) => {
                        const shopId = shop.id || shop._id || `bottomstrip-shop-${index}`;
                        return (
                          <div
                            key={shopId}
                            className="p-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-100"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{shop.shopName}</p>
                              <p className="text-sm text-gray-500">{shop.ownerName} • {shop.category}</p>
                            </div>
                            <button
                              onClick={() => addShopToSection('bottomStrip', shopId)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                              Add
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Global Settings Tab */}
          {activeTab === 'global' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Global Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Container Width</label>
                  <input
                    type="text"
                    value={settings.global.containerWidth}
                    onChange={(e) => updateSettings('global.containerWidth', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="98%"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Section Spacing</label>
                  <input
                    type="text"
                    value={settings.global.sectionSpacing}
                    onChange={(e) => updateSettings('global.sectionSpacing', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="40px"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.global.backgroundColor}
                      onChange={(e) => updateSettings('global.backgroundColor', e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={settings.global.backgroundColor}
                      onChange={(e) => updateSettings('global.backgroundColor', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Border Radius</label>
                  <select
                    value={settings.global.borderRadius}
                    onChange={(e) => updateSettings('global.borderRadius', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="rounded-none">None</option>
                    <option value="rounded-sm">Small</option>
                    <option value="rounded">Medium</option>
                    <option value="rounded-lg">Large</option>
                    <option value="rounded-xl">Extra Large</option>
                    <option value="rounded-2xl">2XL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Padding</label>
                  <input
                    type="text"
                    value={settings.global.padding}
                    onChange={(e) => updateSettings('global.padding', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="p-2"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

