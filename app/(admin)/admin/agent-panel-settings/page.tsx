'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';

interface AgentPanelSettings {
  _id?: string;
  panelText: string;
  panelTextColor: 'red' | 'green' | 'blue' | 'black' | 'purple' | 'orange' | 'yellow';
  dashboard: {
    showStats: boolean;
    showRecentShops: boolean;
    showEarnings: boolean;
    showQuickActions: boolean;
    statsRefreshInterval: number;
  };
  shopManagement: {
    allowAddShop: boolean;
    allowEditShop: boolean;
    allowDeleteShop: boolean;
    allowBulkUpload: boolean;
    maxShopsPerAgent: number;
    requirePaymentBeforePublish: boolean;
  };
  payment: {
    allowMarkPayment: boolean;
    allowCreatePaymentLink: boolean;
    allowedPaymentModes: ('CASH' | 'UPI' | 'RAZORPAY' | 'PHONEPE')[];
    defaultPaymentMode: 'CASH' | 'UPI' | 'RAZORPAY' | 'PHONEPE';
    showPaymentHistory: boolean;
  };
  features: {
    showDashboard: boolean;
    showShops: boolean;
    showPayments: boolean;
    showReports: boolean;
    showProfile: boolean;
    showMap: boolean;
    showGoogleBusiness: boolean;
  };
  layout: {
    theme: 'light' | 'dark' | 'auto';
    primaryColor: string;
    secondaryColor: string;
    sidebarCollapsed: boolean;
    showNotifications: boolean;
  };
  permissions: {
    canViewAllShops: boolean;
    canEditOtherAgentsShops: boolean;
    canDeleteShops: boolean;
    canExportData: boolean;
    canViewAnalytics: boolean;
  };
  notifications: {
    emailOnNewShop: boolean;
    emailOnPayment: boolean;
    smsOnNewShop: boolean;
    smsOnPayment: boolean;
  };
  customSettings: Record<string, any>;
  isActive: boolean;
}

export default function AgentPanelSettingsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AgentPanelSettings>({
    panelText: '',
    panelTextColor: 'black',
    dashboard: {
      showStats: true,
      showRecentShops: true,
      showEarnings: true,
      showQuickActions: true,
      statsRefreshInterval: 120,
    },
    shopManagement: {
      allowAddShop: true,
      allowEditShop: true,
      allowDeleteShop: false,
      allowBulkUpload: false,
      maxShopsPerAgent: 0,
      requirePaymentBeforePublish: false,
    },
    payment: {
      allowMarkPayment: true,
      allowCreatePaymentLink: true,
      allowedPaymentModes: ['CASH', 'UPI'],
      defaultPaymentMode: 'UPI',
      showPaymentHistory: true,
    },
    features: {
      showDashboard: true,
      showShops: true,
      showPayments: true,
      showReports: true,
      showProfile: true,
      showMap: true,
      showGoogleBusiness: true,
    },
    layout: {
      theme: 'light',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      sidebarCollapsed: false,
      showNotifications: true,
    },
    permissions: {
      canViewAllShops: false,
      canEditOtherAgentsShops: false,
      canDeleteShops: false,
      canExportData: true,
      canViewAnalytics: true,
    },
    notifications: {
      emailOnNewShop: false,
      emailOnPayment: false,
      smsOnNewShop: false,
      smsOnPayment: false,
    },
    customSettings: {},
    isActive: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/agent-panel-settings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.success && result.settings) {
        setSettings(result.settings);
      }
    } catch (error: any) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/agent-panel-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Settings saved successfully!');
      } else {
        toast.error(result.error || 'Failed to save settings');
      }
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all settings to default?')) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/agent-panel-settings?action=reset', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        setSettings(result.settings);
        toast.success('Settings reset to default!');
      } else {
        toast.error(result.error || 'Failed to reset settings');
      }
    } catch (error: any) {
      console.error('Failed to reset settings:', error);
      toast.error('Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  const updateNestedSetting = (path: string[], value: any) => {
    setSettings((prev) => {
      const newSettings = { ...prev };
      let current: any = newSettings;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]] = { ...current[path[i]] };
      }
      current[path[path.length - 1]] = value;
      return newSettings;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Agent Panel Settings</h1>
            <p className="text-gray-600 mt-2">Configure and manage agent panel features and settings</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Reset to Default
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Panel Text & Colors */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Panel Text & Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Panel Text
            </label>
            <textarea
              value={settings.panelText}
              onChange={(e) => updateNestedSetting(['panelText'], e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Text to display in agent panel"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Color
            </label>
            <select
              value={settings.panelTextColor}
              onChange={(e) => updateNestedSetting(['panelTextColor'], e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="black">Black</option>
              <option value="red">Red</option>
              <option value="green">Green</option>
              <option value="blue">Blue</option>
              <option value="purple">Purple</option>
              <option value="orange">Orange</option>
              <option value="yellow">Yellow</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dashboard Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Dashboard Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(settings.dashboard).map(([key, value]) => (
            <div key={key}>
              {typeof value === 'boolean' ? (
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => updateNestedSetting(['dashboard', key], e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                  </span>
                </label>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())} (seconds)
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => updateNestedSetting(['dashboard', key], parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Shop Management Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Shop Management Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(settings.shopManagement).map(([key, value]) => (
            <div key={key}>
              {typeof value === 'boolean' ? (
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => updateNestedSetting(['shopManagement', key], e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                  </span>
                </label>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())} (0 = unlimited)
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => updateNestedSetting(['shopManagement', key], parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Payment Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Payment Settings</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.payment.allowMarkPayment}
                onChange={(e) => updateNestedSetting(['payment', 'allowMarkPayment'], e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Allow Mark Payment</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.payment.allowCreatePaymentLink}
                onChange={(e) => updateNestedSetting(['payment', 'allowCreatePaymentLink'], e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Allow Create Payment Link</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.payment.showPaymentHistory}
                onChange={(e) => updateNestedSetting(['payment', 'showPaymentHistory'], e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Show Payment History</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allowed Payment Modes
            </label>
            <div className="flex flex-wrap gap-3">
              {['CASH', 'UPI', 'RAZORPAY', 'PHONEPE'].map((mode) => (
                <label key={mode} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.payment.allowedPaymentModes.includes(mode as any)}
                    onChange={(e) => {
                      const current = settings.payment.allowedPaymentModes;
                      const updated = e.target.checked
                        ? [...current, mode as any]
                        : current.filter((m) => m !== mode);
                      updateNestedSetting(['payment', 'allowedPaymentModes'], updated);
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{mode}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Payment Mode
            </label>
            <select
              value={settings.payment.defaultPaymentMode}
              onChange={(e) => updateNestedSetting(['payment', 'defaultPaymentMode'], e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {settings.payment.allowedPaymentModes.map((mode) => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Features Visibility */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Features Visibility</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(settings.features).map(([key, value]) => (
            <label key={key} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => updateNestedSetting(['features', key], e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Layout Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Layout Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
            <select
              value={settings.layout.theme}
              onChange={(e) => updateNestedSetting(['layout', 'theme'], e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
            <input
              type="color"
              value={settings.layout.primaryColor}
              onChange={(e) => updateNestedSetting(['layout', 'primaryColor'], e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
            <input
              type="color"
              value={settings.layout.secondaryColor}
              onChange={(e) => updateNestedSetting(['layout', 'secondaryColor'], e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.layout.sidebarCollapsed}
              onChange={(e) => updateNestedSetting(['layout', 'sidebarCollapsed'], e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Sidebar Collapsed by Default</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.layout.showNotifications}
              onChange={(e) => updateNestedSetting(['layout', 'showNotifications'], e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Show Notifications</span>
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Permissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(settings.permissions).map(([key, value]) => (
            <label key={key} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => updateNestedSetting(['permissions', key], e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Notifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(settings.notifications).map(([key, value]) => (
            <label key={key} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => updateNestedSetting(['notifications', key], e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-end gap-3">
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

