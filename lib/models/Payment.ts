import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPayment extends Document {
  // Payment identification
  orderId: string; // Razorpay order ID
  paymentId?: string; // Razorpay payment ID (after successful payment)
  paymentSignature?: string; // Razorpay payment signature
  
  // Shop and Agent details
  shopId: Types.ObjectId; // Reference to AgentShop
  agentId?: Types.ObjectId; // Reference to Agent (optional, for direct shopkeeper payments)
  
  // Payment details
  amount: number; // Amount in paise (Razorpay uses paise)
  currency: string; // Currency code (default: INR)
  planType: 'BASIC' | 'PREMIUM' | 'FEATURED' | 'LEFT_BAR' | 'RIGHT_SIDE' | 'BOTTOM_RAIL' | 'BANNER' | 'HERO';
  
  // Payment status
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  paymentMode: 'CASH' | 'UPI'; // Payment mode
  
  // Customer details
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  
  // Razorpay details
  razorpayOrderId: string; // Razorpay order ID
  razorpayPaymentId?: string; // Razorpay payment ID
  razorpayPaymentLinkId?: string; // Razorpay Payment Link ID (for QR code payments)
  razorpaySignature?: string; // Razorpay signature for verification
  
  // Payment gateway
  gateway: 'RAZORPAY' | 'PHONEPE'; // Payment gateway used
  
  // Timestamps
  createdAt: Date;
  paidAt?: Date; // When payment was completed
  expiresAt: Date; // Order expiry time (usually 30 minutes)
  
  // Additional metadata
  metadata?: {
    receiptNo?: string;
    notes?: string;
    [key: string]: any;
  };
  
  // Error tracking
  errorMessage?: string;
  retryCount: number;
}

const PaymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    paymentId: {
      type: String,
      trim: true,
      index: true,
    },
    paymentSignature: {
      type: String,
      trim: true,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'AgentShop',
      required: true,
      index: true,
    },
    agentId: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Amount must be at least 1 paise'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    planType: {
      type: String,
      enum: ['BASIC', 'PREMIUM', 'FEATURED', 'LEFT_BAR', 'RIGHT_SIDE', 'BOTTOM_RAIL', 'BANNER', 'HERO'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    paymentMode: {
      type: String,
      enum: ['CASH', 'UPI'],
      default: 'CASH',
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
      index: true,
    },
    razorpayPaymentLinkId: {
      type: String,
      trim: true,
      index: true,
    },
    razorpaySignature: {
      type: String,
      trim: true,
    },
    gateway: {
      type: String,
      enum: ['RAZORPAY', 'PHONEPE'],
      default: 'RAZORPAY',
    },
    paidAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    errorMessage: {
      type: String,
      trim: true,
    },
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
PaymentSchema.index({ shopId: 1, status: 1 });
PaymentSchema.index({ agentId: 1, status: 1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ razorpayOrderId: 1 });
PaymentSchema.index({ razorpayPaymentId: 1 });
PaymentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired pending orders after expiry

const Payment: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;

