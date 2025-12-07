import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * RenewalPayment Interface - Tracks renewal payments with shop and agent details
 */
export interface IRenewalPayment extends Document {
  shopName: string;
  ownerName: string;
  mobile: string;
  category: string;
  pincode: string;
  address: string;
  photoUrl: string;
  latitude: number;
  longitude: number;
  agentName: string;
  agentCode: string;
  agentId: Types.ObjectId;
  renewalAmount: number;
  renewalDate: Date;
  receiptNo: string;
  paymentMode: 'CASH' | 'UPI' | 'NONE';
  originalShopId: Types.ObjectId; // Reference to original shop
  originalAgentShopId?: Types.ObjectId; // Reference to original AgentShop if exists
  createdAt: Date;
}

/**
 * RenewalPayment Schema - Stores renewal payment records
 */
const RenewalPaymentSchema = new Schema<IRenewalPayment>(
  {
    shopName: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    photoUrl: {
      type: String,
      required: [true, 'Photo URL is required'],
      trim: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
    },
    agentName: {
      type: String,
      required: [true, 'Agent name is required'],
      trim: true,
    },
    agentCode: {
      type: String,
      required: [true, 'Agent code is required'],
      trim: true,
    },
    agentId: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
      required: [true, 'Agent ID is required'],
    },
    renewalAmount: {
      type: Number,
      required: [true, 'Renewal amount is required'],
      default: 100,
    },
    renewalDate: {
      type: Date,
      default: Date.now,
    },
    receiptNo: {
      type: String,
      required: [true, 'Receipt number is required'],
      trim: true,
    },
    paymentMode: {
      type: String,
      enum: ['CASH', 'UPI', 'NONE'],
      default: 'CASH',
    },
    originalShopId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Original shop ID is required'],
    },
    originalAgentShopId: {
      type: Schema.Types.ObjectId,
      ref: 'AgentShop',
    },
  },
  {
    timestamps: true,
    collection: 'renewalpayments', // Explicit collection name
  }
);

// Indexes
RenewalPaymentSchema.index({ agentId: 1, renewalDate: -1 });
RenewalPaymentSchema.index({ agentCode: 1 });
RenewalPaymentSchema.index({ renewalDate: -1 });
RenewalPaymentSchema.index({ originalShopId: 1 });

const RenewalPayment: Model<IRenewalPayment> = mongoose.models.RenewalPayment || mongoose.model<IRenewalPayment>('RenewalPayment', RenewalPaymentSchema);

export default RenewalPayment;

