import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentPanelSettings from '@/lib/models/AgentPanelSettings';
import { authenticateRequest } from '@/lib/auth';

/**
 * GET /api/admin/agent-panel-settings
 * Get agent panel settings
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = authenticateRequest(request);
    if (!authResult.user || authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    if (!['admin', 'editor'].includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin or Editor access required' },
        { status: 403 }
      );
    }

    await connectDB();

    // Get the active settings or create default if none exists
    let settings = await AgentPanelSettings.findOne({ isActive: true });

    if (!settings) {
      // Create default settings
      settings = await AgentPanelSettings.create({
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
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error('Error fetching agent panel settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/agent-panel-settings
 * Update agent panel settings
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = authenticateRequest(request);
    if (!authResult.user || authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    if (!['admin', 'editor'].includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin or Editor access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();

    // Find existing active settings or create new
    let settings = await AgentPanelSettings.findOne({ isActive: true });

    if (!settings) {
      // Create new settings with provided data
      settings = await AgentPanelSettings.create(body);
    } else {
      // Update existing settings
      Object.assign(settings, body);
      await settings.save();
    }

    return NextResponse.json({
      success: true,
      settings,
      message: 'Agent panel settings updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating agent panel settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/agent-panel-settings/reset
 * Reset to default settings
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = authenticateRequest(request);
    if (!authResult.user || authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    if (!['admin'].includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'reset') {
      // Deactivate all existing settings
      await AgentPanelSettings.updateMany({}, { isActive: false });

      // Create default settings
      const defaultSettings = await AgentPanelSettings.create({
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

      return NextResponse.json({
        success: true,
        settings: defaultSettings,
        message: 'Settings reset to default',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error resetting agent panel settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reset settings' },
      { status: 500 }
    );
  }
}

