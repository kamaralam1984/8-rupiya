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

    return NextResponse.json(
      {
        success: true,
        summary: {
          totalVisits,
          uniqueSessions,
          dateRange: {
            start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: endDate || new Date().toISOString(),
          },
        },
        trafficSources,
        trafficByDevice,
        trafficByBrowser,
        trafficByCountry,
        trafficByPageType,
        topPages,
        topShops,
        topCategories,
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

