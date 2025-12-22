import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/lib/models/Payment';
import AgentShop from '@/lib/models/AgentShop';
import Agent from '@/lib/models/Agent';
import Operator from '@/lib/models/Operator';
import { verifyPaymentSignature, getPaymentDetails } from '@/lib/utils/razorpay';
import { calculateAgentCommission, calculateOperatorCommission } from '@/app/utils/pricing';

/**
 * POST /api/payment/verify-razorpay
 * Verify Razorpay payment after successful payment
 * 
 * Body:
 * - razorpay_order_id: string
 * - razorpay_payment_id: string
 * - razorpay_signature: string
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    console.log('🔍 Payment verification request:', {
      razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id?.substring(0, 20) + '...',
      has_signature: !!razorpay_signature,
    });

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error('❌ Missing required payment parameters:', {
        has_order_id: !!razorpay_order_id,
        has_payment_id: !!razorpay_payment_id,
        has_signature: !!razorpay_signature,
      });
      return NextResponse.json(
        { error: 'Missing required payment parameters' },
        { status: 400 }
      );
    }

    // Find payment record - try both razorpayOrderId and orderId
    let payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    // If not found by razorpayOrderId, try by orderId (for backward compatibility)
    if (!payment) {
      payment = await Payment.findOne({
        orderId: razorpay_order_id,
      });
    }

    if (!payment) {
      console.error('Payment not found for order:', razorpay_order_id);
      return NextResponse.json(
        { 
          error: 'Payment order not found',
          details: `No payment record found for order ID: ${razorpay_order_id}`,
          receivedOrderId: razorpay_order_id,
        },
        { status: 404 }
      );
    }

    // Check if already processed
    if (payment.status === 'SUCCESS') {
      return NextResponse.json(
        { 
          success: true, 
          message: 'Payment already verified',
          payment: {
            id: payment._id,
            status: payment.status,
            shopId: payment.shopId,
          }
        },
        { status: 200 }
      );
    }

    // Verify payment signature
    console.log('🔐 Verifying payment signature...');
    const isValidSignature = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValidSignature) {
      console.error('❌ Invalid payment signature');
      payment.status = 'FAILED';
      payment.errorMessage = 'Invalid payment signature';
      await payment.save();

      return NextResponse.json(
        { error: 'Invalid payment signature', details: 'The payment signature verification failed. Please contact support.' },
        { status: 400 }
      );
    }
    console.log('✅ Payment signature verified');

    // Fetch payment details from Razorpay
    console.log('📞 Fetching payment details from Razorpay...');
    let razorpayPayment;
    try {
      razorpayPayment = await getPaymentDetails(razorpay_payment_id);
      console.log('✅ Payment details fetched:', {
        status: razorpayPayment.status,
        amount: razorpayPayment.amount,
        currency: razorpayPayment.currency,
      });
    } catch (error: any) {
      console.error('❌ Error fetching payment from Razorpay:', error);
      payment.status = 'FAILED';
      payment.errorMessage = `Failed to fetch payment details: ${error.message}`;
      await payment.save();

      return NextResponse.json(
        { 
          error: 'Failed to verify payment with Razorpay',
          details: error.message || 'Could not fetch payment details from Razorpay. Please check your Razorpay credentials.',
        },
        { status: 500 }
      );
    }

    // Verify payment status
    if (razorpayPayment.status !== 'captured' && razorpayPayment.status !== 'authorized') {
      payment.status = 'FAILED';
      payment.errorMessage = `Payment status: ${razorpayPayment.status}`;
      await payment.save();

      return NextResponse.json(
        { error: `Payment not successful. Status: ${razorpayPayment.status}` },
        { status: 400 }
      );
    }

    // Verify amount matches
    const expectedAmount = payment.amount; // Already in paise
    if (razorpayPayment.amount !== expectedAmount) {
      payment.status = 'FAILED';
      payment.errorMessage = `Amount mismatch. Expected: ${expectedAmount}, Got: ${razorpayPayment.amount}`;
      await payment.save();

      return NextResponse.json(
        { error: 'Payment amount mismatch' },
        { status: 400 }
      );
    }

    // Update payment record
    payment.status = 'SUCCESS';
    payment.paymentId = razorpay_payment_id;
    payment.paymentSignature = razorpay_signature;
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.paidAt = new Date();
    
    // Add success message to metadata
    if (!payment.metadata) {
      payment.metadata = {};
    }
    payment.metadata.successMessage = `Payment Successful`;
    
    await payment.save();

    // Update shop payment status (only if shopId exists - for new shop registrations, shopId might be null)
    let shop = null;
    if (payment.shopId) {
      try {
        shop = await AgentShop.findById(payment.shopId);
      } catch (shopError: any) {
        console.error('Error finding shop:', shopError);
        // Continue even if shop lookup fails - payment is still successful
      }
    }
    
    if (shop) {
      try {
        const wasPending = shop.paymentStatus === 'PENDING';
        
        // Calculate commission
        const planAmount = payment.amount / 100; // Convert paise to rupees
        const agentCommission = calculateAgentCommission(payment.planType, planAmount);
        const operatorCommission = calculateOperatorCommission(payment.planType, planAmount, agentCommission);

        // Update shop payment details
        shop.paymentStatus = 'PAID';
        shop.paymentMode = 'UPI'; // Online payment via Razorpay
        shop.planType = payment.planType;
        shop.planAmount = planAmount;
        shop.amount = planAmount;
        shop.agentCommission = agentCommission;
        shop.operatorCommission = operatorCommission;
        shop.receiptNo = payment.metadata?.receiptNo || `REC${Date.now()}`;
        shop.lastPaymentDate = new Date();
        
        // Set expiry date (365 days)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 365);
        shop.paymentExpiryDate = expiryDate;

        await shop.save();

        // Update agent earnings if payment was pending
        if (wasPending && payment.agentId) {
          try {
            const agent = await Agent.findById(payment.agentId);
            if (agent) {
              agent.totalEarnings = (agent.totalEarnings || 0) + agentCommission;
              agent.totalShops = (agent.totalShops || 0) + 1;
              await agent.save();

              // Update operator commission if agent has an operator
              if (agent.operatorId && operatorCommission > 0) {
                try {
                  const operator = await Operator.findById(agent.operatorId);
                  if (operator) {
                    operator.totalEarnings = (operator.totalEarnings || 0) + operatorCommission;
                    await operator.save();
                  }
                } catch (operatorError: any) {
                  console.error('Error updating operator commission:', operatorError);
                }
              }
            }
          } catch (agentError: any) {
            console.error('Error updating agent earnings:', agentError);
            // Continue even if agent update fails
          }
        }
      } catch (shopUpdateError: any) {
        console.error('Error updating shop payment status:', shopUpdateError);
        // Payment is still successful even if shop update fails
        // This can happen for new shop registrations where shop doesn't exist yet
      }
    } else {
      // Shop not found - this is normal for new shop registrations
      console.log('Shop not found for payment - this is normal for new shop registrations');
    }

    console.log('✅ Payment verification successful!', {
      paymentId: payment._id,
      orderId: payment.orderId,
      amount: payment.amount / 100,
      shopId: payment.shopId || 'New shop registration',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Payment verified successfully',
        payment: {
          id: payment._id,
          orderId: payment.orderId,
          status: payment.status,
          amount: payment.amount / 100, // Convert paise to rupees
          shopId: payment.shopId,
          planType: payment.planType,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { 
        error: 'Payment verification failed', 
        details: error.message || 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}

