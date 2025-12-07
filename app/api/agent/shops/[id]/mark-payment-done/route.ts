import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop';
import Agent from '@/lib/models/Agent';
import AdminShop from '@/lib/models/Shop';
import { verifyAgentToken, getAgentTokenFromRequest } from '@/lib/utils/agentAuth';
import { sendPaymentConfirmation } from '@/lib/services/notificationService';
import mongoose from 'mongoose';

/**
 * POST /api/agent/shops/[id]/mark-payment-done
 * Mark payment as done and send notification to shop owner
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: shopId } = await params;
    const body = await request.json();
    const { paymentMode, receiptNo, amount } = body;

    // Find the shop
    const shop = await AgentShop.findById(shopId);
    
    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Verify agent owns this shop
    if (shop.agentId.toString() !== payload.agentId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update payment status
    const paymentDate = new Date();
    const expiryDate = new Date(paymentDate);
    expiryDate.setDate(expiryDate.getDate() + 365); // 365 days validity

    shop.paymentStatus = 'PAID';
    shop.paymentMode = paymentMode || shop.paymentMode || 'CASH';
    shop.receiptNo = receiptNo || shop.receiptNo || `REC${Date.now()}`;
    shop.amount = amount || shop.amount || 100;
    shop.lastPaymentDate = paymentDate;
    shop.paymentExpiryDate = expiryDate;

    await shop.save();

    // Update corresponding admin shop if exists
    try {
      const adminShop = await AdminShop.findOne({
        shopName: shop.shopName,
        ownerName: shop.ownerName,
        mobile: shop.mobile,
      });

      if (adminShop) {
        adminShop.lastPaymentDate = paymentDate;
        adminShop.paymentExpiryDate = expiryDate;
        await adminShop.save();
      }
    } catch (adminShopError) {
      console.error('Error updating admin shop:', adminShopError);
      // Continue even if admin shop update fails
    }

    // Send notification to shop owner with complete bill/receipt
    try {
      // Get agent details
      const agent = await Agent.findById(payload.agentId);
      const agentName = agent?.name;
      const agentCode = agent?.agentCode;

      await sendPaymentConfirmation({
        mobile: shop.mobile,
        shopName: shop.shopName,
        ownerName: shop.ownerName,
        amount: shop.amount,
        receiptNo: shop.receiptNo,
        paymentDate: paymentDate,
        paymentMode: shop.paymentMode || 'CASH',
        category: shop.category,
        address: shop.address,
        pincode: shop.pincode,
        agentName: agentName,
        agentCode: agentCode,
      });
    } catch (notificationError) {
      console.error('Notification sending failed:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Payment marked as done and notification sent',
        shop,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Mark payment done error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

