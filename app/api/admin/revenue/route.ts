import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Revenue from '@/lib/models/Revenue';
import District from '@/lib/models/District';
import AdminShop from '@/lib/models/Shop';
import AgentShop from '@/lib/models/AgentShop';
import { requireAdmin } from '@/lib/auth';

/**
 * GET /api/admin/revenue
 * Get revenue reports by district, date range, or overall
 */
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    // Connect to database
    try {
      await connectDB();
    } catch (dbError: any) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed', details: dbError.message },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || 'all'; // all, today, week, month, year

    let query: any = {};

    // Filter by district
    if (district && district !== 'all') {
      query.district = district.toUpperCase();
    }

    // Filter by date range
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (period !== 'all') {
      const now = new Date();
      let start: Date;
      
      switch (period) {
        case 'today':
          start = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          start = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          start = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          start = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          start = new Date(0);
      }
      query.date = { $gte: start };
    }

    // Get all shops from database (real-time calculation)
    let shopQuery: any = {};
    
    // If district filter is applied
    if (district && district !== 'all') {
      shopQuery.district = district.toUpperCase();
    }
    
    // Filter by payment status - only count PAID shops for revenue
    // But we'll show all shops for counts
    
    // Get all shops from AdminShop collection (shopsfromimage)
    // Note: Don't filter by district in shopQuery if we want all districts for district list
    // Only filter if specific district is requested
    let adminShopQuery: any = {};
    if (district && district !== 'all') {
      // Try multiple ways to match district
      adminShopQuery.$or = [
        { district: district.toUpperCase() },
        { city: district.toUpperCase() },
        { 'fullAddress': { $regex: district, $options: 'i' } }
      ];
    }
    
    let allShops: any[] = [];
    try {
      allShops = await AdminShop.find(adminShopQuery).lean();
      console.log(`Found ${allShops.length} admin shops for revenue calculation`);
    } catch (shopError: any) {
      console.error('Error fetching admin shops:', shopError);
      allShops = [];
    }
    
    // Calculate totals from actual shop data
    let totals = {
      basicPlanRevenue: 0,
      premiumPlanRevenue: 0,
      featuredPlanRevenue: 0,
      leftBarPlanRevenue: 0,
      rightBarPlanRevenue: 0,
      bannerPlanRevenue: 0,
      heroPlanRevenue: 0,
      advertisementRevenue: 0,
      totalAgentCommission: 0,
      totalRevenue: 0,
      netRevenue: 0,
      basicPlanCount: 0,
      premiumPlanCount: 0,
      featuredPlanCount: 0,
      leftBarPlanCount: 0,
      rightBarPlanCount: 0,
      bannerPlanCount: 0,
      heroPlanCount: 0,
    };

    // Also get agent shops for commission calculation
    let agentShopQuery: any = {};
    if (district && district !== 'all') {
      // Try multiple ways to match district
      agentShopQuery.$or = [
        { district: district.toUpperCase() },
        { city: district.toUpperCase() },
        { 'address': { $regex: district, $options: 'i' } }
      ];
    }
    
    let allAgentShops: any[] = [];
    try {
      allAgentShops = await AgentShop.find(agentShopQuery).lean();
      console.log(`Found ${allAgentShops.length} agent shops`);
    } catch (shopError: any) {
      console.error('Error fetching agent shops:', shopError);
      // Continue with empty array instead of failing
      allAgentShops = [];
    }
    
    // Process each shop
    for (const shop of allShops) {
      try {
        const planType = (shop.planType as string) || 'BASIC';
        // Use yearly prices (all plans are yearly now)
        const planAmount = Number(shop.planAmount) || (planType === 'BASIC' ? 100 : planType === 'PREMIUM' ? 2999 : planType === 'FEATURED' ? 2388 : planType === 'LEFT_BAR' ? 3588 : planType === 'RIGHT_BAR' ? 3588 : planType === 'BANNER' ? 4788 : planType === 'HERO' ? 5988 : 100);
        
        // Check if shop has payment (AdminShop uses lastPaymentDate to determine payment status)
        const lastPaymentDate = (shop as any).lastPaymentDate;
        let paymentExpiryDate: Date | null = null;
        try {
          paymentExpiryDate = (shop as any).paymentExpiryDate ? new Date((shop as any).paymentExpiryDate) : null;
        } catch (dateError) {
          console.error('Error parsing paymentExpiryDate:', dateError);
        }
        const isPaid = !!lastPaymentDate; // Shop has payment if lastPaymentDate exists
        const isExpired = paymentExpiryDate ? paymentExpiryDate < new Date() : false;
      
      // Apply date filter for revenue calculation (not for counts)
      // When period is 'all', include all shops for both counts and revenue
      let includeShopForRevenue = true; // For revenue calculation
      
        if (period !== 'all') {
          let shopDate: Date = new Date();
          try {
            shopDate = (shop as any).lastPaymentDate ? new Date((shop as any).lastPaymentDate) : ((shop as any).createdAt ? new Date((shop as any).createdAt) : new Date());
          } catch (dateError) {
            shopDate = new Date();
          }
          const now = new Date();
          let start: Date = new Date(0);
          
          switch (period) {
            case 'today':
              start = new Date(now);
              start.setHours(0, 0, 0, 0);
              break;
            case 'week':
              start = new Date(now);
              start.setDate(now.getDate() - 7);
              start.setHours(0, 0, 0, 0);
              break;
            case 'month':
              start = new Date(now);
              start.setMonth(now.getMonth() - 1);
              start.setHours(0, 0, 0, 0);
              break;
            case 'year':
              start = new Date(now);
              start.setFullYear(now.getFullYear() - 1);
              start.setHours(0, 0, 0, 0);
              break;
          }
          
          // Only filter revenue, not counts
          if (shopDate < start) {
            includeShopForRevenue = false;
          }
        }
      
      // Always count shops, but only add revenue if within period
      
      // Count all shops (paid or pending) - always count regardless of period
      if (planType === 'BASIC') {
        totals.basicPlanCount++;
        // Only add revenue if shop is PAID, not expired, and within period
        if (isPaid && !isExpired && includeShopForRevenue) {
          totals.basicPlanRevenue += planAmount;
        }
      } else if (planType === 'PREMIUM') {
        totals.premiumPlanCount++;
        if (isPaid && !isExpired && includeShopForRevenue) {
          totals.premiumPlanRevenue += planAmount;
        }
      } else if (planType === 'FEATURED') {
        totals.featuredPlanCount++;
        if (isPaid && !isExpired && includeShopForRevenue) {
          totals.featuredPlanRevenue += planAmount;
        }
      } else if (planType === 'LEFT_BAR') {
        totals.leftBarPlanCount++;
        if (isPaid && !isExpired && includeShopForRevenue) {
          totals.leftBarPlanRevenue += planAmount;
        }
      } else if (planType === 'RIGHT_BAR') {
        totals.rightBarPlanCount++;
        if (isPaid && !isExpired && includeShopForRevenue) {
          totals.rightBarPlanRevenue += planAmount;
        }
      } else if (planType === 'BANNER') {
        totals.bannerPlanCount++;
        if (isPaid && !isExpired && includeShopForRevenue) {
          totals.bannerPlanRevenue += planAmount;
        }
      } else if (planType === 'HERO') {
        totals.heroPlanCount++;
        if (isPaid && !isExpired && includeShopForRevenue) {
          totals.heroPlanRevenue += planAmount;
        }
      }
      } catch (shopProcessError: any) {
        console.error('Error processing shop:', shopProcessError, shop);
        // Continue with next shop
        continue;
      }
    }
    
    // Calculate agent commissions from agent shops
    for (const shop of allAgentShops) {
      try {
        const planType = (shop.planType as string) || 'BASIC';
        // Use yearly prices (all plans are yearly now)
        const planAmount = Number(shop.planAmount) || (planType === 'BASIC' ? 100 : planType === 'PREMIUM' ? 2999 : planType === 'FEATURED' ? 2388 : planType === 'LEFT_BAR' ? 3588 : planType === 'RIGHT_BAR' ? 3588 : planType === 'BANNER' ? 4788 : planType === 'HERO' ? 5988 : 100);
        
        // Check if shop has payment (AgentShop uses paymentStatus)
        const paymentStatus = (shop as any).paymentStatus || 'PENDING';
        let paymentExpiryDate: Date | null = null;
        try {
          paymentExpiryDate = (shop as any).paymentExpiryDate ? new Date((shop as any).paymentExpiryDate) : null;
        } catch (dateError) {
          console.error('Error parsing paymentExpiryDate:', dateError);
        }
        const isPaid = paymentStatus === 'PAID';
        const isExpired = paymentExpiryDate ? paymentExpiryDate < new Date() : false;
      
      // Apply date filter for commission calculation
      let includeShopForCommission = true;
      if (period !== 'all') {
        const shopDate = (shop as any).lastPaymentDate ? new Date((shop as any).lastPaymentDate) : ((shop as any).createdAt ? new Date((shop as any).createdAt) : new Date());
        const now = new Date();
        let start: Date = new Date(0);
        
        switch (period) {
          case 'today':
            start = new Date(now);
            start.setHours(0, 0, 0, 0);
            break;
          case 'week':
            start = new Date(now);
            start.setDate(now.getDate() - 7);
            start.setHours(0, 0, 0, 0);
            break;
          case 'month':
            start = new Date(now);
            start.setMonth(now.getMonth() - 1);
            start.setHours(0, 0, 0, 0);
            break;
          case 'year':
            start = new Date(now);
            start.setFullYear(now.getFullYear() - 1);
            start.setHours(0, 0, 0, 0);
            break;
        }
        
        if (shopDate < start) {
          includeShopForCommission = false;
        }
      }
      
        // Add agent commission if shop is paid and within period
        if (isPaid && !isExpired && includeShopForCommission) {
          const commission = Number(shop.agentCommission) || 0;
          totals.totalAgentCommission += commission;
        }
      } catch (shopProcessError: any) {
        console.error('Error processing agent shop:', shopProcessError, shop);
        // Continue with next shop
        continue;
      }
    }
    
    // Calculate total revenue and net revenue (ensure all values are numbers)
    totals.totalRevenue = (totals.basicPlanRevenue || 0) + (totals.premiumPlanRevenue || 0) + (totals.featuredPlanRevenue || 0) +
                         (totals.leftBarPlanRevenue || 0) + (totals.rightBarPlanRevenue || 0) + (totals.bannerPlanRevenue || 0) + (totals.heroPlanRevenue || 0);
    totals.netRevenue = (totals.totalRevenue || 0) - (totals.totalAgentCommission || 0);
    
    // Get revenue records for historical tracking (optional)
    let revenues: any[] = [];
    try {
      revenues = await Revenue.find(query)
        .sort({ date: -1 })
        .limit(1000)
        .lean();
    } catch (revenueError: any) {
      console.error('Error fetching revenue records:', revenueError);
      revenues = [];
    }

    // Calculate district statistics from actual shop data
    // IMPORTANT: For district list, we need ALL shops regardless of period/district filter
    // So we fetch all shops again for district statistics
    let allShopsForDistricts: any[] = [];
    let allAgentShopsForDistricts: any[] = [];
    try {
      allShopsForDistricts = await AdminShop.find({}).lean();
      allAgentShopsForDistricts = await AgentShop.find({}).lean();
      console.log(`Found ${allShopsForDistricts.length} admin shops and ${allAgentShopsForDistricts.length} agent shops for district stats`);
    } catch (districtError: any) {
      console.error('Error fetching shops for district stats:', districtError);
      // Continue with empty arrays
      allShopsForDistricts = [];
      allAgentShopsForDistricts = [];
    }

    const districtMap = new Map<string, {
      name: string;
      state: string;
      area: string; // Area field
      totalShops: number;
      basicPlanShops: number;
      premiumPlanShops: number;
      featuredPlanShops: number;
      leftBarPlanShops: number;
      rightBarPlanShops: number;
      bannerPlanShops: number;
      heroPlanShops: number;
      totalRevenue: number;
      targetShops: number;
      progressPercentage: number;
    }>();

    // Process all shops to calculate district statistics (for dropdown list)
    for (const shop of allShopsForDistricts) {
      try {
        // Try to get district from district field, or extract from city/address
        let shopDistrict = ((shop as any).district as string)?.trim().toUpperCase();
        if (!shopDistrict) {
          // Try to extract from city
          const city = ((shop as any).city as string)?.trim();
          if (city) {
            shopDistrict = city.toUpperCase();
          } else {
            // Try to extract from address (last part before pincode)
            const address = ((shop as any).fullAddress as string) || '';
            const addressParts = address.split(',').map(p => p.trim());
            if (addressParts.length > 0) {
              shopDistrict = addressParts[addressParts.length - 1].toUpperCase();
            }
          }
        }
        if (!shopDistrict || shopDistrict.length < 2) continue; // Skip shops without valid district
        
        // Get area from shop
        const shopArea = ((shop as any).area as string)?.trim() || '';

        const planType = (shop.planType as string) || 'BASIC';
        // Use yearly prices (all plans are yearly now)
        const planAmount = Number(shop.planAmount) || (planType === 'BASIC' ? 100 : planType === 'PREMIUM' ? 2999 : planType === 'FEATURED' ? 2388 : planType === 'LEFT_BAR' ? 3588 : planType === 'RIGHT_BAR' ? 3588 : planType === 'BANNER' ? 4788 : planType === 'HERO' ? 5988 : 100);
        const lastPaymentDate = (shop as any).lastPaymentDate;
        let paymentExpiryDate: Date | null = null;
        try {
          paymentExpiryDate = (shop as any).paymentExpiryDate ? new Date((shop as any).paymentExpiryDate) : null;
        } catch (dateError) {
          // Ignore date parsing errors
        }
        const isPaid = !!lastPaymentDate;
        const isExpired = paymentExpiryDate ? paymentExpiryDate < new Date() : false;

        // Initialize district if not exists
        if (!districtMap.has(shopDistrict)) {
          districtMap.set(shopDistrict, {
            name: shopDistrict,
            state: 'Unknown', // You can extract state from address if needed
            area: shopArea || '', // Set area from first shop
            totalShops: 0,
            basicPlanShops: 0,
            premiumPlanShops: 0,
            featuredPlanShops: 0,
            leftBarPlanShops: 0,
            rightBarPlanShops: 0,
            bannerPlanShops: 0,
            heroPlanShops: 0,
            totalRevenue: 0,
            targetShops: 1000000, // 10 lakh target
            progressPercentage: 0,
          });
        } else {
          // Update area if current shop has area and district doesn't have one
          const districtData = districtMap.get(shopDistrict)!;
          if (shopArea && !districtData.area) {
            districtData.area = shopArea;
          }
        }

        const districtData = districtMap.get(shopDistrict)!;
        districtData.totalShops++;

        // Count by plan type
        if (planType === 'BASIC') {
          districtData.basicPlanShops++;
          if (isPaid && !isExpired) {
            districtData.totalRevenue += planAmount;
          }
        } else if (planType === 'PREMIUM') {
          districtData.premiumPlanShops++;
          if (isPaid && !isExpired) {
            districtData.totalRevenue += planAmount;
          }
        } else if (planType === 'FEATURED') {
          districtData.featuredPlanShops++;
          if (isPaid && !isExpired) {
            districtData.totalRevenue += planAmount;
          }
        } else if (planType === 'LEFT_BAR') {
          districtData.leftBarPlanShops++;
          if (isPaid && !isExpired) {
            districtData.totalRevenue += planAmount;
          }
        } else if (planType === 'RIGHT_BAR') {
          districtData.rightBarPlanShops++;
          if (isPaid && !isExpired) {
            districtData.totalRevenue += planAmount;
          }
        } else if (planType === 'BANNER') {
          districtData.bannerPlanShops++;
          if (isPaid && !isExpired) {
            districtData.totalRevenue += planAmount;
          }
        } else if (planType === 'HERO') {
          districtData.heroPlanShops++;
          if (isPaid && !isExpired) {
            districtData.totalRevenue += planAmount;
          }
        }
      } catch (shopError: any) {
        console.error('Error processing shop for district stats:', shopError);
        continue;
      }
    }

    // Also process agent shops (for district list)
    for (const shop of allAgentShopsForDistricts) {
      try {
        // Try to get district from district field, or extract from city/address
        let shopDistrict = ((shop as any).district as string)?.trim().toUpperCase();
        if (!shopDistrict) {
          // Try to extract from city
          const city = ((shop as any).city as string)?.trim();
          if (city) {
            shopDistrict = city.toUpperCase();
          } else {
            // Try to extract from address
            const address = ((shop as any).address as string) || '';
            const addressParts = address.split(',').map(p => p.trim());
            if (addressParts.length > 0) {
              shopDistrict = addressParts[addressParts.length - 1].toUpperCase();
            }
          }
        }
        if (!shopDistrict || shopDistrict.length < 2) continue; // Skip shops without valid district
        
        // Get area from shop (agent shops might not have area field, but check anyway)
        const shopArea = ((shop as any).area as string)?.trim() || '';

        const planType = (shop.planType as string) || 'BASIC';
        // Use yearly prices (all plans are yearly now)
        const planAmount = Number(shop.planAmount) || (planType === 'BASIC' ? 100 : planType === 'PREMIUM' ? 2999 : planType === 'FEATURED' ? 2388 : planType === 'LEFT_BAR' ? 3588 : planType === 'RIGHT_BAR' ? 3588 : planType === 'BANNER' ? 4788 : planType === 'HERO' ? 5988 : 100);
        const paymentStatus = (shop as any).paymentStatus || 'PENDING';
        let paymentExpiryDate: Date | null = null;
        try {
          paymentExpiryDate = (shop as any).paymentExpiryDate ? new Date((shop as any).paymentExpiryDate) : null;
        } catch (dateError) {
          // Ignore date parsing errors
        }
        const isPaid = paymentStatus === 'PAID';
        const isExpired = paymentExpiryDate ? paymentExpiryDate < new Date() : false;

        if (!districtMap.has(shopDistrict)) {
          districtMap.set(shopDistrict, {
            name: shopDistrict,
            state: 'Unknown',
            area: shopArea || '', // Set area from first shop
            totalShops: 0,
            basicPlanShops: 0,
            premiumPlanShops: 0,
            featuredPlanShops: 0,
            leftBarPlanShops: 0,
            rightBarPlanShops: 0,
            bannerPlanShops: 0,
            heroPlanShops: 0,
            totalRevenue: 0,
            targetShops: 1000000,
            progressPercentage: 0,
          });
        } else {
          // Update area if current shop has area and district doesn't have one
          const districtData = districtMap.get(shopDistrict)!;
          if (shopArea && !districtData.area) {
            districtData.area = shopArea;
          }
        }

        const districtData = districtMap.get(shopDistrict)!;
        districtData.totalShops++;

        if (planType === 'BASIC') {
          districtData.basicPlanShops++;
          if (isPaid && !isExpired) {
            districtData.totalRevenue += planAmount;
          }
        } else if (planType === 'PREMIUM') {
          districtData.premiumPlanShops++;
          if (isPaid && !isExpired) {
            districtData.totalRevenue += planAmount;
          }
        } else if (planType === 'FEATURED') {
          districtData.featuredPlanShops++;
          if (isPaid && !isExpired) {
            districtData.totalRevenue += planAmount;
          }
        } else if (planType === 'LEFT_BAR') {
          districtData.leftBarPlanShops++;
          if (isPaid && !isExpired) {
            districtData.totalRevenue += planAmount;
          }
        } else if (planType === 'RIGHT_BAR') {
          districtData.rightBarPlanShops++;
          if (isPaid && !isExpired) {
            districtData.totalRevenue += planAmount;
          }
        } else if (planType === 'BANNER') {
          districtData.bannerPlanShops++;
          if (isPaid && !isExpired) {
            districtData.totalRevenue += planAmount;
          }
        } else if (planType === 'HERO') {
          districtData.heroPlanShops++;
          if (isPaid && !isExpired) {
            districtData.totalRevenue += planAmount;
          }
        }
      } catch (shopError: any) {
        console.error('Error processing agent shop for district stats:', shopError);
        continue;
      }
    }

    // Calculate progress percentage and convert to array
    const districts = Array.from(districtMap.values()).map(district => {
      district.progressPercentage = district.targetShops > 0 
        ? Math.round((district.totalShops / district.targetShops) * 100 * 100) / 100 // Round to 2 decimals
        : 0;
      return {
        _id: district.name, // Use name as ID for now
        name: district.name,
        state: district.state,
        area: district.area || '', // Include area field
        totalShops: district.totalShops,
        basicPlanShops: district.basicPlanShops,
        premiumPlanShops: district.premiumPlanShops,
        featuredPlanShops: district.featuredPlanShops,
        leftBarPlanShops: district.leftBarPlanShops,
        rightBarPlanShops: district.rightBarPlanShops,
        bannerPlanShops: district.bannerPlanShops,
        heroPlanShops: district.heroPlanShops,
        totalRevenue: district.totalRevenue,
        targetShops: district.targetShops,
        progressPercentage: Math.min(district.progressPercentage, 100), // Cap at 100%
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue); // Sort by revenue descending

    // Use districts for both dropdown and table (filtered districts logic can be added later if needed)
    // For now, if district filter is applied, filter districts array
    let filteredDistrictsForDisplay = districts;
    if (district && district !== 'all') {
      filteredDistrictsForDisplay = districts.filter(d => 
        d.name.toUpperCase() === district.toUpperCase() ||
        d.area?.toUpperCase() === district.toUpperCase()
      );
    }

    return NextResponse.json(
      {
        success: true,
        revenues,
        totals,
        districts: districts || [], // All districts for dropdown
        filteredDistricts: filteredDistrictsForDisplay || districts || [], // Filtered districts for table display
        count: revenues.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Revenue fetch error:', error);
    console.error('Error stack:', error.stack);
    
    // Return safe default values on error
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message || 'Unknown error',
        totals: {
          basicPlanRevenue: 0,
          premiumPlanRevenue: 0,
          featuredPlanRevenue: 0,
          leftBarPlanRevenue: 0,
          rightBarPlanRevenue: 0,
          bannerPlanRevenue: 0,
          heroPlanRevenue: 0,
          advertisementRevenue: 0,
          totalAgentCommission: 0,
          totalRevenue: 0,
          netRevenue: 0,
          basicPlanCount: 0,
          premiumPlanCount: 0,
          featuredPlanCount: 0,
          leftBarPlanCount: 0,
          rightBarPlanCount: 0,
          bannerPlanCount: 0,
          heroPlanCount: 0,
        },
        districts: [],
        filteredDistricts: [],
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/revenue/calculate
 * Calculate and update revenue for a specific date/district
 */
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const body = await request.json();
    const { district, date } = body;

    if (!district) {
      return NextResponse.json(
        { error: 'District is required' },
        { status: 400 }
      );
    }

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Get all shops for this district
    const [adminShops, agentShops] = await Promise.all([
      AdminShop.find({ district: district.toUpperCase() }).lean(),
      AgentShop.find({ district: district.toUpperCase() }).lean(),
    ]);

    // Calculate revenue by plan type
    let basicPlanRevenue = 0;
    let premiumPlanRevenue = 0;
    let featuredPlanRevenue = 0;
    let leftBarPlanRevenue = 0;
    let rightBarPlanRevenue = 0;
    let bannerPlanRevenue = 0;
    let heroPlanRevenue = 0;
    let basicPlanCount = 0;
    let premiumPlanCount = 0;
    let featuredPlanCount = 0;
    let leftBarPlanCount = 0;
    let rightBarPlanCount = 0;
    let bannerPlanCount = 0;
    let heroPlanCount = 0;
    let totalAgentCommission = 0;

    // Process admin shops
    for (const shop of adminShops) {
      const planType = shop.planType || 'BASIC';
      const planAmount = shop.planAmount || 100;
      const paymentDate = shop.lastPaymentDate ? new Date(shop.lastPaymentDate) : new Date(shop.createdAt);
      
      // Check if payment was made on target date
      if (paymentDate.toDateString() === targetDate.toDateString()) {
        if (planType === 'BASIC') {
          basicPlanRevenue += planAmount;
          basicPlanCount++;
        } else if (planType === 'PREMIUM') {
          premiumPlanRevenue += planAmount;
          premiumPlanCount++;
        } else if (planType === 'FEATURED') {
          featuredPlanRevenue += planAmount;
          featuredPlanCount++;
        } else if (planType === 'LEFT_BAR') {
          leftBarPlanRevenue += planAmount;
          leftBarPlanCount++;
        } else if (planType === 'RIGHT_BAR') {
          rightBarPlanRevenue += planAmount;
          rightBarPlanCount++;
        } else if (planType === 'BANNER') {
          bannerPlanRevenue += planAmount;
          bannerPlanCount++;
        } else if (planType === 'HERO') {
          heroPlanRevenue += planAmount;
          heroPlanCount++;
        }
      }
    }

    // Process agent shops
    for (const shop of agentShops) {
      const planType = shop.planType || 'BASIC';
      const planAmount = shop.planAmount || 100;
      const commission = shop.agentCommission || (planType === 'BASIC' ? 20 : planType === 'PREMIUM' ? 50 : 200);
      const paymentDate = shop.lastPaymentDate ? new Date(shop.lastPaymentDate) : new Date(shop.createdAt);
      
      // Check if payment was made on target date
      if (paymentDate.toDateString() === targetDate.toDateString()) {
        if (planType === 'BASIC') {
          basicPlanRevenue += planAmount;
          basicPlanCount++;
        } else if (planType === 'PREMIUM') {
          premiumPlanRevenue += planAmount;
          premiumPlanCount++;
        } else if (planType === 'FEATURED') {
          featuredPlanRevenue += planAmount;
          featuredPlanCount++;
        } else if (planType === 'LEFT_BAR') {
          leftBarPlanRevenue += planAmount;
          leftBarPlanCount++;
        } else if (planType === 'RIGHT_BAR') {
          rightBarPlanRevenue += planAmount;
          rightBarPlanCount++;
        } else if (planType === 'BANNER') {
          bannerPlanRevenue += planAmount;
          bannerPlanCount++;
        } else if (planType === 'HERO') {
          heroPlanRevenue += planAmount;
          heroPlanCount++;
        }
        totalAgentCommission += commission;
      }
    }

    const totalRevenue = basicPlanRevenue + premiumPlanRevenue + featuredPlanRevenue + 
                         leftBarPlanRevenue + rightBarPlanRevenue + bannerPlanRevenue + heroPlanRevenue;
    const netRevenue = totalRevenue - totalAgentCommission;

    // Update or create revenue record
    const revenue = await Revenue.findOneAndUpdate(
      {
        district: district.toUpperCase(),
        date: targetDate,
      },
      {
        district: district.toUpperCase(),
        date: targetDate,
        basicPlanRevenue,
        premiumPlanRevenue,
        featuredPlanRevenue,
        leftBarPlanRevenue,
        rightBarPlanRevenue,
        bannerPlanRevenue,
        heroPlanRevenue,
        advertisementRevenue: 0, // Can be updated separately
        basicPlanCount,
        premiumPlanCount,
        featuredPlanCount,
        leftBarPlanCount,
        rightBarPlanCount,
        bannerPlanCount,
        heroPlanCount,
        totalAgentCommission,
        totalRevenue,
        netRevenue,
      },
      {
        upsert: true,
        new: true,
      }
    );

    // Update district statistics
    await District.findOneAndUpdate(
      { name: district.toUpperCase() },
      {
        $set: {
          totalShops: adminShops.length + agentShops.length,
          basicPlanShops: adminShops.filter((s: any) => (s.planType || 'BASIC') === 'BASIC').length + 
                         agentShops.filter((s: any) => (s.planType || 'BASIC') === 'BASIC').length,
          premiumPlanShops: adminShops.filter((s: any) => s.planType === 'PREMIUM').length + 
                           agentShops.filter((s: any) => s.planType === 'PREMIUM').length,
          featuredPlanShops: adminShops.filter((s: any) => s.planType === 'FEATURED').length + 
                            agentShops.filter((s: any) => s.planType === 'FEATURED').length,
          totalRevenue: totalRevenue,
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Revenue calculated and updated',
        revenue,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Revenue calculation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});
