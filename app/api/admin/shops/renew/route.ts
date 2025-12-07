import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import RenewShop from '@/lib/models/RenewShop';
import AdminShop from '@/lib/models/Shop';
import AgentShop from '@/lib/models/AgentShop';
import Agent from '@/lib/models/Agent';
import RenewalPayment from '@/lib/models/RenewalPayment';
import { requireAdmin } from '@/lib/auth';
import { sendPaymentConfirmation } from '@/lib/services/notificationService';

/**
 * POST /api/admin/shops/renew
 * Renew payment for an expired shop (move back from renew to main collection)
 */
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
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

    const paymentDate = new Date();
    const expiryDate = new Date(paymentDate);
    expiryDate.setDate(expiryDate.getDate() + 365); // 365 days validity

    // Get agent details if agent shop exists
    let agent = null;
    if (renewShop.originalAgentShopId) {
      const agentShop = await AgentShop.findById(renewShop.originalAgentShopId);
      if (agentShop) {
        agent = await Agent.findById(agentShop.agentId);
      }
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
      createdByAdmin: renewShop.originalShopId, // Keep original reference
      lastPaymentDate: paymentDate,
      paymentExpiryDate: expiryDate,
      createdAt: paymentDate, // Update createdAt to renewal date for fresh 365 days calculation
    });

    // Update AgentShop if exists
    if (renewShop.originalAgentShopId) {
      try {
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
          if (agent) {
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
      } catch (agentShopError) {
        console.error('Error updating agent shop:', agentShopError);
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
        agentName: agent?.name || 'N/A',
        agentCode: agent?.agentCode || 'N/A',
        agentId: agent?._id || renewShop.originalAgentShopId || renewShop.originalShopId,
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
});

