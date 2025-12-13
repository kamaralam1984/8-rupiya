import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Agent from '@/lib/models/Agent';
import AgentShop from '@/lib/models/AgentShop';
import AdminShop from '@/lib/models/Shop';
import { requireAdmin } from '@/lib/auth';

/**
 * Export database to Excel or PDF
 * GET /api/admin/reports/export?format=excel|pdf
 */
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'excel';

    // Fetch all data
    const [agents, agentShops, adminShops] = await Promise.all([
      Agent.find({}).lean(),
      AgentShop.find({}).lean(),
      AdminShop.find({}).lean(),
    ]);

    // Calculate revenue
    const calculateRevenue = (shops: any[]) => {
      const planPrices = {
        BASIC: 50,
        PREMIUM: 150,
        FEATURED: 250,
        LEFT_BAR: 100,
        RIGHT_SIDE: 300,
        BOTTOM_RAIL: 200,
        BANNER: 500,
        HERO: 1000,
      };

      return shops.reduce((total, shop) => {
        if (shop.paymentStatus === 'PAID' && shop.planType) {
          return total + (planPrices[shop.planType as keyof typeof planPrices] || 0);
        }
        return total;
      }, 0);
    };

    const totalRevenue = calculateRevenue([...agentShops, ...adminShops]);

    // Agent performance
    const agentPerformance = await Promise.all(
      agents.map(async (agent) => {
        const shops = await AgentShop.find({ agentCode: agent.agentCode }).lean();
        return {
          name: agent.name,
          code: agent.agentCode,
          totalShops: shops.length,
          earnings: agent.totalEarnings || 0,
          paid: 0, // TODO: Add paidAmount field to Agent model if needed
          pending: agent.totalEarnings || 0,
        };
      })
    );

    if (format === 'excel') {
      // Generate CSV (Excel-compatible format)
      // Helper function to escape CSV values
      const escapeCsvValue = (value: any): string => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        // If value contains comma, newline, or quote, wrap in quotes and escape quotes
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      let csv = '';
      
      // Add UTF-8 BOM for Excel compatibility
      csv += '\uFEFF';
      
      // Summary Section
      csv += 'DATABASE BACKUP REPORT\n';
      csv += `Generated,${new Date().toLocaleString()}\n\n`;
      
      // Revenue Summary
      csv += 'REVENUE SUMMARY\n';
      csv += 'Metric,Value\n';
      csv += `Total Revenue,${totalRevenue}\n`;
      csv += `Total Shops,${agentShops.length + adminShops.length}\n`;
      csv += `Agent Shops,${agentShops.length}\n`;
      csv += `Admin Shops,${adminShops.length}\n`;
      csv += `Total Agents,${agents.length}\n\n`;

      // Agent Performance
      csv += 'AGENT PERFORMANCE\n';
      csv += 'Agent Name,Agent Code,Total Shops,Total Earnings,Paid Amount,Pending Payment\n';
      agentPerformance.forEach((agent) => {
        csv += `${escapeCsvValue(agent.name)},${escapeCsvValue(agent.code)},${agent.totalShops},${agent.earnings},${agent.paid},${agent.pending}\n`;
      });
      csv += '\n';

      // All Shops
      csv += 'ALL SHOPS\n';
      csv += 'Shop Name,Category,Owner,Mobile,Pincode,Area,Plan Type,Payment Status,Agent Code,Created Date\n';
      
      [...agentShops, ...adminShops].forEach((shop: any) => {
        const shopName = escapeCsvValue(shop.shopName || shop.name);
        const category = escapeCsvValue(shop.category);
        const ownerName = escapeCsvValue(shop.ownerName || '');
        const mobile = escapeCsvValue(shop.mobile || '');
        const pincode = escapeCsvValue(shop.pincode || '');
        const area = escapeCsvValue(shop.area || '');
        const planType = escapeCsvValue(shop.planType || 'BASIC');
        const paymentStatus = escapeCsvValue(shop.paymentStatus || 'PENDING');
        const agentCode = escapeCsvValue(shop.agentCode || 'ADMIN');
        const createdDate = shop.createdAt ? new Date(shop.createdAt).toLocaleDateString() : '';
        
        csv += `${shopName},${category},${ownerName},${mobile},${pincode},${area},${planType},${paymentStatus},${agentCode},${createdDate}\n`;
      });

      // Return CSV file with proper headers
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="database-backup-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (format === 'pdf') {
      // Generate HTML that can be printed to PDF
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Database Backup Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
    h2 { color: #4b5563; margin-top: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
    .summary-box { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .summary-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #d1d5db; }
    .summary-item:last-child { border-bottom: none; }
    .label { font-weight: bold; color: #374151; }
    .value { color: #059669; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #2563eb; color: white; padding: 12px; text-align: left; font-weight: bold; }
    td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
    tr:hover { background: #f9fafb; }
    .date { color: #6b7280; font-size: 14px; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>📊 Database Backup Report</h1>
  <p class="date">Generated: ${new Date().toLocaleString()}</p>

  <div class="summary-box">
    <h2>💰 Revenue Summary</h2>
    <div class="summary-item">
      <span class="label">Total Revenue</span>
      <span class="value">₹${totalRevenue.toLocaleString()}</span>
    </div>
    <div class="summary-item">
      <span class="label">Total Shops</span>
      <span class="value">${(agentShops.length + adminShops.length).toLocaleString()}</span>
    </div>
    <div class="summary-item">
      <span class="label">Agent Shops</span>
      <span class="value">${agentShops.length.toLocaleString()}</span>
    </div>
    <div class="summary-item">
      <span class="label">Admin Shops</span>
      <span class="value">${adminShops.length.toLocaleString()}</span>
    </div>
    <div class="summary-item">
      <span class="label">Total Agents</span>
      <span class="value">${agents.length}</span>
    </div>
  </div>

  <h2>👥 Agent Performance</h2>
  <table>
    <thead>
      <tr>
        <th>Agent Name</th>
        <th>Agent Code</th>
        <th>Total Shops</th>
        <th>Total Earnings</th>
        <th>Paid Amount</th>
        <th>Pending</th>
      </tr>
    </thead>
    <tbody>
      ${agentPerformance.map((agent) => `
        <tr>
          <td>${agent.name}</td>
          <td>${agent.code}</td>
          <td>${agent.totalShops}</td>
          <td>₹${agent.earnings.toLocaleString()}</td>
          <td>₹${agent.paid.toLocaleString()}</td>
          <td>₹${agent.pending.toLocaleString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>🏪 All Shops (${agentShops.length + adminShops.length} total)</h2>
  <table>
    <thead>
      <tr>
        <th>Shop Name</th>
        <th>Category</th>
        <th>Pincode</th>
        <th>Plan Type</th>
        <th>Payment Status</th>
        <th>Agent</th>
      </tr>
    </thead>
    <tbody>
      ${[...agentShops, ...adminShops].slice(0, 100).map((shop: any) => `
        <tr>
          <td>${shop.shopName || shop.name}</td>
          <td>${shop.category}</td>
          <td>${shop.pincode}</td>
          <td>${shop.planType || 'BASIC'}</td>
          <td>${shop.paymentStatus || 'PENDING'}</td>
          <td>${shop.agentCode || 'ADMIN'}</td>
        </tr>
      `).join('')}
      ${(agentShops.length + adminShops.length > 100) ? `
        <tr>
          <td colspan="6" style="text-align: center; color: #6b7280; font-style: italic;">
            ... and ${(agentShops.length + adminShops.length - 100)} more shops
          </td>
        </tr>
      ` : ''}
    </tbody>
  </table>

  <div style="margin-top: 40px; padding: 20px; background: #fef3c7; border-radius: 8px;">
    <p style="margin: 0; color: #92400e;">
      <strong>Note:</strong> For complete shop list, please use Excel export or view in admin panel.
      This PDF shows summary and first 100 shops only.
    </p>
  </div>

  <script>
    // Auto-print on load
    window.onload = function() {
      setTimeout(() => window.print(), 500);
    };
  </script>
</body>
</html>
      `;

      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid format. Use format=excel or format=pdf' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export data', details: error.message },
      { status: 500 }
    );
  }
});

