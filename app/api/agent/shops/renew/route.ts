import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import RenewShop from '@/lib/models/RenewShop';
import AdminShop from '@/lib/models/Shop';
import AgentShop from '@/lib/models/AgentShop';
import Agent from '@/lib/models/Agent';
import RenewalPayment from '@/lib/models/RenewalPayment';
import { verifyAgentToken, getAgentTokenFromRequest } from '@/lib/utils/agentAuth';
import { sendPaymentConfirmation } from '@/lib/services/notificationService';
import mongoose from 'mongoose';

/**
 * POST /api/agent/shops/renew
 * Agent can renew payment for their expired shops
 */
export async function POST(request: NextRequest) {
  try {
    const token = getAgentTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyAgentToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { renewShopId, paymentMode, receiptNo, amount } = body;

    if (!renewShopId) {
      return NextResponse.json(
        { error: 'Renew shop ID is required' },
        { status: 400 }
      );
    }

    // Find the renew shop
    const renewShop = await RenewShop.findById(renewShopId);
    
    if (!renewShop) {
      return NextResponse.json(
        { error: 'Renew shop not found' },
        { status: 404 }
      );
    }

    // Verify agent owns this shop
    if (renewShop.originalAgentShopId) {
      const agentShop = await AgentShop.findById(renewShop.originalAgentShopId);
      if (!agentShop || agentShop.agentId.toString() !== payload.agentId) {
        return NextResponse.json(
          { error: 'Unauthorized - This shop does not belong to you' },
          { status: 403 }
        );
      }
    }

    const paymentDate = new Date();
    const expiryDate = new Date(paymentDate);
    expiryDate.setDate(expiryDate.getDate() + 365); // 365 days validity

    // Get agent details
    const agent = await Agent.findById(payload.agentId);
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Create shop back in main collection with updated createdAt (renewal date)
    const newShop = await AdminShop.create({
      shopName: renewShop.shopName,
      ownerName: renewShop.ownerName,
      category: renewShop.category,
      mobile: renewShop.mobile !== 'N/A' ? renewShop.mobile : undefined,
      area: renewShop.address.split(',')[0]?.trim() || undefined,
      fullAddress: renewShop.address,
      city: renewShop.address.split(',')[renewShop.address.split(',').length - 1]?.trim() || undefined,
      pincode: renewShop.pincode || undefined,
      latitude: renewShop.latitude,
      longitude: renewShop.longitude,
      photoUrl: renewShop.photoUrl,
      iconUrl: renewShop.photoUrl,
      createdByAdmin: renewShop.originalShopId,
      lastPaymentDate: paymentDate,
      paymentExpiryDate: expiryDate,
      createdAt: paymentDate, // Update createdAt to renewal date for fresh 365 days calculation
    });

    // Update AgentShop if exists
    if (renewShop.originalAgentShopId) {
      const agentShop = await AgentShop.findById(renewShop.originalAgentShopId);
      if (agentShop) {
        agentShop.paymentStatus = 'PAID';
        agentShop.paymentMode = paymentMode || 'CASH';
        agentShop.receiptNo = receiptNo || `REC${Date.now()}`;
        agentShop.amount = amount || 100;
        agentShop.lastPaymentDate = paymentDate;
        agentShop.paymentExpiryDate = expiryDate;
        agentShop.createdAt = paymentDate; // Update createdAt to renewal date
        await agentShop.save();

        // Add commission to agent (20% of renewal amount)
        try {
          const commission = Math.round((amount || 100) * 0.2);
          agent.totalEarnings = (agent.totalEarnings || 0) + commission;
          await agent.save();
          
          console.log('Agent commission added for renewal:', {
            agentId: agent._id.toString(),
            agentName: agent.name,
            commission,
            newTotalEarnings: agent.totalEarnings,
          });
        } catch (commissionError) {
          console.error('Error adding commission for renewal:', commissionError);
        }
      }
    }

    // Create renewal payment record
    try {
      await RenewalPayment.create({
        shopName: renewShop.shopName,
        ownerName: renewShop.ownerName,
        mobile: renewShop.mobile,
        category: renewShop.category,
        pincode: renewShop.pincode,
        address: renewShop.address,
        photoUrl: renewShop.photoUrl,
        latitude: renewShop.latitude,
        longitude: renewShop.longitude,
        agentName: agent.name,
        agentCode: agent.agentCode,
        agentId: agent._id,
        renewalAmount: amount || 100,
        renewalDate: paymentDate,
        receiptNo: receiptNo || `REC${Date.now()}`,
        paymentMode: paymentMode || 'CASH',
        originalShopId: renewShop.originalShopId,
        originalAgentShopId: renewShop.originalAgentShopId,
      });
      
      console.log('Renewal payment record created');
    } catch (renewalPaymentError) {
      console.error('Error creating renewal payment record:', renewalPaymentError);
      // Continue even if record creation fails
    }

    // Delete from renew collection
    await RenewShop.findByIdAndDelete(renewShopId);

    // Send notification with complete bill/receipt
    try {
      // Get agent details
      const agent = await Agent.findById(payload.agentId);
      
      await sendPaymentConfirmation({
        mobile: renewShop.mobile,
        shopName: renewShop.shopName,
        ownerName: renewShop.ownerName,
        amount: amount || 100,
        receiptNo: receiptNo || `REC${Date.now()}`,
        paymentDate: paymentDate,
        paymentMode: paymentMode || 'CASH',
        category: renewShop.category,
        address: renewShop.address,
        pincode: renewShop.pincode,
        agentName: agent?.name,
        agentCode: agent?.agentCode,
      });
    } catch (notificationError) {
      console.error('Notification sending failed:', notificationError);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Shop renewed successfully',
        shop: newShop,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Renew shop error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent/shops/renew
 * Get list of expired shops that need renewal (for the logged-in agent)
 */
export async function GET(request: NextRequest) {
  try {
    const token = getAgentTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyAgentToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find all agent shops
    const agentShops = await AgentShop.find({
      agentId: new mongoose.Types.ObjectId(payload.agentId),
    }).select('_id').lean();

    const agentShopIds = agentShops.map(s => s._id);

    // Find renew shops that belong to this agent
    const renewShops = await RenewShop.find({
      originalAgentShopId: { $in: agentShopIds },
    }).sort({ expiredDate: -1 }).lean();

    return NextResponse.json(
      {
        success: true,
        shops: renewShops,
        count: renewShops.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get renew shops error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

