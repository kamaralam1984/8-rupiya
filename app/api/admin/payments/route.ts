import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/lib/models/Payment';
import Agent from '@/lib/models/Agent';
import Shopper from '@/lib/models/Shopper';
import { requireAdmin } from '@/lib/auth';
import mongoose from 'mongoose';

/**
 * GET /api/admin/payments
 * Get all payments with filters (Admin only)
 */
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const dateRange = searchParams.get('dateRange') || 'all';
    const planType = searchParams.get('planType');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query: any = {};

    // Filter by user ID / Code (can be ObjectId, agentCode, orderId, or paymentId)
    if (userId && userId.trim()) {
      const userIdTrimmed = userId.trim();
      let agentIdFound = null;
      let orderIdFilter = null;
      let paymentIdFilter = null;
      
      // Check if it's an order ID or payment ID (starts with "order_" or "pay_")
      if (userIdTrimmed.startsWith('order_')) {
        orderIdFilter = userIdTrimmed;
        // Search in both orderId and razorpayOrderId fields
        query.$or = [
          { orderId: orderIdFilter },
          { razorpayOrderId: orderIdFilter }
        ];
        if (process.env.NODE_ENV === 'development') {
          console.log('Filtering by orderId:', orderIdFilter);
        }
      } else if (userIdTrimmed.startsWith('pay_')) {
        paymentIdFilter = userIdTrimmed;
        // Search in both paymentId and razorpayPaymentId fields
        query.$or = [
          { paymentId: paymentIdFilter },
          { razorpayPaymentId: paymentIdFilter }
        ];
        if (process.env.NODE_ENV === 'development') {
          console.log('Filtering by paymentId:', paymentIdFilter);
        }
      } else {
        // Try as ObjectId first
        if (mongoose.Types.ObjectId.isValid(userIdTrimmed)) {
          try {
            const userIdObj = new mongoose.Types.ObjectId(userIdTrimmed);
            // Verify the ObjectId exists as an agent
            const agent = await Agent.findById(userIdObj).select('_id').lean();
            if (agent) {
              agentIdFound = userIdObj;
              if (process.env.NODE_ENV === 'development') {
                console.log('Found agent by ObjectId:', agentIdFound);
              }
            }
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Error finding agent by ObjectId:', error);
            }
          }
        }
        
        // If not found as ObjectId, try as agentCode
        if (!agentIdFound) {
          try {
            const agent = await Agent.findOne({ 
              agentCode: userIdTrimmed.toUpperCase().trim() 
            }).select('_id').lean();
            
            if (agent) {
              agentIdFound = agent._id;
              if (process.env.NODE_ENV === 'development') {
                console.log('Found agent by agentCode:', agentIdFound, 'for code:', userIdTrimmed.toUpperCase());
              }
            } else {
              if (process.env.NODE_ENV === 'development') {
                console.log('No agent found for code:', userIdTrimmed.toUpperCase());
              }
            }
          } catch (searchError) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Error searching by agentCode:', searchError);
            }
          }
        }
        
        // If agent found, apply filter; otherwise return empty results
        if (agentIdFound) {
          query.agentId = agentIdFound;
          if (process.env.NODE_ENV === 'development') {
            console.log('Applying agentId filter:', agentIdFound);
          }
        } else {
          // No matching agent found, return empty results
          if (process.env.NODE_ENV === 'development') {
            console.log('No agent found for userId:', userIdTrimmed, '- returning empty results');
          }
          return NextResponse.json(
            {
              success: true,
              payments: [],
              count: 0,
              message: `No agent found with ID/Code: ${userIdTrimmed}`,
            },
            { status: 200 }
          );
        }
      }
    }

    // Filter by plan type
    if (planType && planType !== 'all' && planType !== 'none') {
      query.planType = planType;
    }

    // Filter by status
    if (status && status !== 'all' && status !== 'none') {
      query.status = status;
    }

    // Filter by date range
    if ((dateRange && dateRange !== 'all' && dateRange !== 'none') || startDate || endDate) {
      query.createdAt = {};
      
      if (dateRange === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query.createdAt.$gte = today;
      } else if (dateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        query.createdAt.$gte = weekAgo;
      } else if (dateRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        monthAgo.setHours(0, 0, 0, 0);
        query.createdAt.$gte = monthAgo;
      } else if (dateRange === 'custom') {
        if (startDate) {
          query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.createdAt.$lte = end;
        }
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Final query:', JSON.stringify(query, null, 2));
    }
    
    const payments = await Payment.find(query)
      .populate({
        path: 'shopId',
        select: 'shopName ownerName mobile email',
        model: 'AgentShop',
      })
      .populate({
        path: 'agentId',
        select: 'name agentCode',
        model: 'Agent',
      })
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();

    if (process.env.NODE_ENV === 'development') {
      console.log('Found payments:', payments.length);
    }

    return NextResponse.json(
      {
        success: true,
        payments,
        count: payments.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching payments:', error);
    }
    return NextResponse.json(
      {
        error: 'Failed to fetch payments',
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
});




