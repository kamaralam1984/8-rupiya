import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/lib/models/Payment';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    await connectDB();

    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID or Payment ID is required' },
        { status: 400 }
      );
    }

    // Check if it's a MongoDB ObjectId (24 hex characters)
    const isMongoObjectId = /^[0-9a-fA-F]{24}$/.test(orderId);
    
    let payment;
    if (isMongoObjectId) {
      // Search by Payment document ID
      payment = await Payment.findById(orderId).populate('shopId', 'shopName ownerName mobile');
    } else {
      // Search by Razorpay order ID
      payment = await Payment.findOne({
        razorpayOrderId: orderId,
      }).populate('shopId', 'shopName ownerName mobile');
    }

    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment._id.toString(), // Payment document ID
        orderId: payment.razorpayOrderId,
        paymentId: payment.razorpayPaymentId,
        amount: payment.amount / 100, // Convert paise to rupees
        currency: payment.currency,
        status: payment.status,
        planType: payment.planType,
        customerName: payment.customerName,
        customerPhone: payment.customerPhone,
        receiptNo: payment.metadata?.receiptNo,
        createdAt: payment.createdAt,
        paidAt: payment.paidAt,
        shop: payment.shopId,
      },
    });
  } catch (error: any) {
    console.error('Payment status fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

