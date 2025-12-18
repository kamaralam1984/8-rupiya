import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Analytics from '@/lib/models/Analytics';
import { authenticateRequest } from '@/lib/auth';

/**
 * GET /api/admin/analytics
 * Get analytics data with filters
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const { user, error } = authenticateRequest(request);
    
    if (!user || error) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin or editor
    if (!['admin', 'editor'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Access denied. Admin or Editor role required.' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month
    const metric = searchParams.get('metric') || 'visits'; // visits, pageViews, sessions

    // Build date filter
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.visitedAt = {};
      if (startDate) {
        dateFilter.visitedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.visitedAt.$lte = new Date(endDate);
      }
    } else {
      // Default: Last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter.visitedAt = { $gte: thirtyDaysAgo };
    }

    // Get overall statistics
    const totalVisits = await Analytics.countDocuments(dateFilter);
    const uniqueSessions = await Analytics.distinct('sessionId', dateFilter).then(sessions => sessions.length);
    
    // Get traffic sources
    const trafficSources = await Analytics.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          sessions: { $addToSet: '$sessionId' },
        },
      },
      {
        $project: {
          source: '$_id',
          visits: '$count',
          sessions: { $size: '$sessions' },
        },
      },
      { $sort: { visits: -1 } },
    ]);

    // Get traffic by device
    const trafficByDevice = await Analytics.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$device',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          device: '$_id',
          visits: '$count',
        },
      },
      { $sort: { visits: -1 } },
    ]);

    // Get traffic by browser
    const trafficByBrowser = await Analytics.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$browser',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          browser: '$_id',
          visits: '$count',
        },
      },
      { $sort: { visits: -1 } },
      { $limit: 10 },
    ]);

    // Get traffic by country
    const trafficByCountry = await Analytics.aggregate([
      { $match: { ...dateFilter, country: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$country',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          country: '$_id',
          visits: '$count',
        },
      },
      { $sort: { visits: -1 } },
      { $limit: 10 },
    ]);

    // Get traffic by page type
    const trafficByPageType = await Analytics.aggregate([
      { $match: { ...dateFilter, pageType: { $exists: true } } },
      {
        $group: {
          _id: '$pageType',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          pageType: '$_id',
          visits: '$count',
        },
      },
      { $sort: { visits: -1 } },
    ]);

    // Get top pages
    const topPages = await Analytics.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$page',
          count: { $sum: 1 },
          pageTitle: { $first: '$pageTitle' },
        },
      },
      {
        $project: {
          page: '$_id',
          pageTitle: '$pageTitle',
          visits: '$count',
        },
      },
      { $sort: { visits: -1 } },
      { $limit: 20 },
    ]);

    // Get top shops
    const topShops = await Analytics.aggregate([
      { $match: { ...dateFilter, shopId: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$shopId',
          shopName: { $first: '$shopName' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          shopId: '$_id',
          shopName: '$shopName',
          visits: '$count',
        },
      },
      { $sort: { visits: -1 } },
      { $limit: 20 },
    ]);

    // Get top categories
    const topCategories = await Analytics.aggregate([
      { $match: { ...dateFilter, category: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          category: '$_id',
          visits: '$count',
        },
      },
      { $sort: { visits: -1 } },
      { $limit: 20 },
    ]);

    // Get time series data (visits over time)
    const timeSeriesData = await Analytics.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupBy === 'day' ? '%Y-%m-%d' : groupBy === 'week' ? '%Y-W%V' : '%Y-%m',
              date: '$visitedAt',
            },
          },
          visits: { $sum: 1 },
          sessions: { $addToSet: '$sessionId' },
        },
      },
      {
        $project: {
          date: '$_id',
          visits: 1,
          sessions: { $size: '$sessions' },
        },
      },
      { $sort: { date: 1 } },
    ]);

    // Get referrers
    const topReferrers = await Analytics.aggregate([
      { $match: { ...dateFilter, referrer: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$referrer',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          referrer: '$_id',
          visits: '$count',
        },
      },
      { $sort: { visits: -1 } },
      { $limit: 20 },
    ]);

    // Get traffic by state/region
    const trafficByState = await Analytics.aggregate([
      { $match: { ...dateFilter, region: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$region',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          state: '$_id',
          visits: '$count',
        },
      },
      { $sort: { visits: -1 } },
      { $limit: 20 },
    ]);

    // Get traffic by district
    const trafficByDistrict = await Analytics.aggregate([
      { $match: { ...dateFilter, district: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$district',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          district: '$_id',
          visits: '$count',
        },
      },
      { $sort: { visits: -1 } },
      { $limit: 20 },
    ]);

    // Get traffic by area
    const trafficByArea = await Analytics.aggregate([
      { $match: { ...dateFilter, area: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$area',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          area: '$_id',
          visits: '$count',
        },
      },
      { $sort: { visits: -1 } },
      { $limit: 20 },
    ]);

    // Get shop clicks (actions with type 'shop_click')
    const shopClicks = await Analytics.aggregate([
      { $match: { ...dateFilter, 'actions.type': 'shop_click' } },
      { $unwind: '$actions' },
      { $match: { 'actions.type': 'shop_click' } },
      {
        $group: {
          _id: '$actions.shopId',
          shopName: { $first: '$actions.shopName' },
          count: { $sum: 1 },
          locations: { $addToSet: { country: '$country', state: '$region', district: '$district', area: '$area' } },
        },
      },
      {
        $project: {
          shopId: '$_id',
          shopName: 1,
          clicks: '$count',
          locations: 1,
        },
      },
      { $sort: { clicks: -1 } },
      { $limit: 50 },
    ]);

    // Get average session duration
    const sessionStats = await Analytics.aggregate([
      { $match: { ...dateFilter, sessionDuration: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$sessionDuration' },
          maxDuration: { $max: '$sessionDuration' },
          minDuration: { $min: '$sessionDuration' },
          totalSessions: { $sum: 1 },
        },
      },
    ]);

    // Get session duration distribution
    const sessionDurationDistribution = await Analytics.aggregate([
      { $match: { ...dateFilter, sessionDuration: { $exists: true, $ne: null } } },
      {
        $bucket: {
          groupBy: '$sessionDuration',
          boundaries: [0, 30, 60, 120, 300, 600, 1800, 3600], // 0-30s, 30-60s, 1-2min, 2-5min, 5-10min, 10-30min, 30-60min, 60min+
          default: '3600+',
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ]);

    return NextResponse.json(
      {
        success: true,
        summary: {
          totalVisits,
          uniqueSessions,
          avgSessionDuration: sessionStats[0]?.avgDuration || 0,
          maxSessionDuration: sessionStats[0]?.maxDuration || 0,
          minSessionDuration: sessionStats[0]?.minDuration || 0,
          dateRange: {
            start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: endDate || new Date().toISOString(),
          },
        },
        trafficSources,
        trafficByDevice,
        trafficByBrowser,
        trafficByCountry,
        trafficByState,
        trafficByDistrict,
        trafficByArea,
        trafficByPageType,
        topPages,
        topShops,
        topCategories,
        shopClicks,
        sessionDurationDistribution,
        timeSeriesData,
        topReferrers,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

