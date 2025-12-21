import mongoose, { Schema, Document } from 'mongoose';

/**
 * Agent Panel Settings Interface
 */
export interface IAgentPanelSettings extends Document {
  // Panel Text & Colors
  panelText: string;
  panelTextColor: 'red' | 'green' | 'blue' | 'black' | 'purple' | 'orange' | 'yellow';
  
  // Dashboard Settings
  dashboard: {
    showStats: boolean;
    showRecentShops: boolean;
    showEarnings: boolean;
    showQuickActions: boolean;
    statsRefreshInterval: number; // seconds
  };
  
  // Shop Management Settings
  shopManagement: {
    allowAddShop: boolean;
    allowEditShop: boolean;
    allowDeleteShop: boolean;
    allowBulkUpload: boolean;
    maxShopsPerAgent: number; // 0 = unlimited
    requirePaymentBeforePublish: boolean;
  };
  
  // Payment Settings
  payment: {
    allowMarkPayment: boolean;
    allowCreatePaymentLink: boolean;
    allowedPaymentModes: ('CASH' | 'UPI' | 'RAZORPAY' | 'PHONEPE')[];
    defaultPaymentMode: 'CASH' | 'UPI' | 'RAZORPAY' | 'PHONEPE';
    showPaymentHistory: boolean;
  };
  
  // Features Visibility
  features: {
    showDashboard: boolean;
    showShops: boolean;
    showPayments: boolean;
    showReports: boolean;
    showProfile: boolean;
    showMap: boolean;
    showGoogleBusiness: boolean;
  };
  
  // Layout Settings
  layout: {
    theme: 'light' | 'dark' | 'auto';
    primaryColor: string;
    secondaryColor: string;
    sidebarCollapsed: boolean;
    showNotifications: boolean;
  };
  
  // Permissions
  permissions: {
    canViewAllShops: boolean;
    canEditOtherAgentsShops: boolean;
    canDeleteShops: boolean;
    canExportData: boolean;
    canViewAnalytics: boolean;
  };
  
  // Notifications
  notifications: {
    emailOnNewShop: boolean;
    emailOnPayment: boolean;
    smsOnNewShop: boolean;
    smsOnPayment: boolean;
  };
  
  // Custom Settings (JSON for flexibility)
  customSettings: Record<string, any>;
  
  // Active Status
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Agent Panel Settings Schema
 */
const AgentPanelSettingsSchema = new Schema<IAgentPanelSettings>(
  {
    panelText: {
      type: String,
      trim: true,
      maxlength: [500, 'Panel text cannot exceed 500 characters'],
      default: '',
    },
    panelTextColor: {
      type: String,
      enum: ['red', 'green', 'blue', 'black', 'purple', 'orange', 'yellow'],
      default: 'black',
    },
    dashboard: {
      showStats: { type: Boolean, default: true },
      showRecentShops: { type: Boolean, default: true },
      showEarnings: { type: Boolean, default: true },
      showQuickActions: { type: Boolean, default: true },
      statsRefreshInterval: { type: Number, default: 120 }, // 2 minutes
    },
    shopManagement: {
      allowAddShop: { type: Boolean, default: true },
      allowEditShop: { type: Boolean, default: true },
      allowDeleteShop: { type: Boolean, default: false },
      allowBulkUpload: { type: Boolean, default: false },
      maxShopsPerAgent: { type: Number, default: 0 }, // 0 = unlimited
      requirePaymentBeforePublish: { type: Boolean, default: false },
    },
    payment: {
      allowMarkPayment: { type: Boolean, default: true },
      allowCreatePaymentLink: { type: Boolean, default: true },
      allowedPaymentModes: [{ 
        type: String, 
        enum: ['CASH', 'UPI', 'RAZORPAY', 'PHONEPE'],
        default: ['CASH', 'UPI']
      }],
      defaultPaymentMode: { 
        type: String, 
        enum: ['CASH', 'UPI', 'RAZORPAY', 'PHONEPE'],
        default: 'UPI'
      },
      showPaymentHistory: { type: Boolean, default: true },
    },
    features: {
      showDashboard: { type: Boolean, default: true },
      showShops: { type: Boolean, default: true },
      showPayments: { type: Boolean, default: true },
      showReports: { type: Boolean, default: true },
      showProfile: { type: Boolean, default: true },
      showMap: { type: Boolean, default: true },
      showGoogleBusiness: { type: Boolean, default: true },
    },
    layout: {
      theme: { 
        type: String, 
        enum: ['light', 'dark', 'auto'],
        default: 'light'
      },
      primaryColor: { type: String, default: '#3b82f6' },
      secondaryColor: { type: String, default: '#8b5cf6' },
      sidebarCollapsed: { type: Boolean, default: false },
      showNotifications: { type: Boolean, default: true },
    },
    permissions: {
      canViewAllShops: { type: Boolean, default: false },
      canEditOtherAgentsShops: { type: Boolean, default: false },
      canDeleteShops: { type: Boolean, default: false },
      canExportData: { type: Boolean, default: true },
      canViewAnalytics: { type: Boolean, default: true },
    },
    notifications: {
      emailOnNewShop: { type: Boolean, default: false },
      emailOnPayment: { type: Boolean, default: false },
      smsOnNewShop: { type: Boolean, default: false },
      smsOnPayment: { type: Boolean, default: false },
    },
    customSettings: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'agentpanelsettings',
  }
);

// Ensure only one settings document exists
AgentPanelSettingsSchema.index({ isActive: 1 });

const AgentPanelSettings = mongoose.models.AgentPanelSettings || 
  mongoose.model<IAgentPanelSettings>('AgentPanelSettings', AgentPanelSettingsSchema);

export default AgentPanelSettings;



