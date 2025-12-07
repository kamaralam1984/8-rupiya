import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * RenewShop Interface - For shops that have expired and need renewal
 */
export interface IRenewShop extends Document {
  shopName: string;
  ownerName: string;
  mobile: string;
  category: string;
  pincode: string;
  address: string;
  photoUrl: string;
  latitude: number;
  longitude: number;
  originalShopId: Types.ObjectId; // Reference to original shop in shopsfromimage collection
  originalAgentShopId?: Types.ObjectId; // Reference to original AgentShop if exists
  expiredDate: Date; // Date when shop expired
  createdAt: Date; // Original creation date
  lastPaymentDate: Date; // Last payment date before expiry
}

/**
 * RenewShop Schema - Stores expired shops that need payment renewal
 */
const RenewShopSchema = new Schema<IRenewShop>(
  {
    shopName: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
      maxlength: [200, 'Shop name cannot exceed 200 characters'],
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
      maxlength: [100, 'Owner name cannot exceed 100 characters'],
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid mobile number'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: ['Grocery', 'Clothes', 'Electronics', 'Restaurant', 'Medical', 'Other', 'Others'],
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
      match: [/^\d{6}$/, 'Pincode must be 6 digits'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters'],
    },
    photoUrl: {
      type: String,
      required: [true, 'Photo URL is required'],
      trim: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
    originalShopId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Original shop ID is required'],
    },
    originalAgentShopId: {
      type: Schema.Types.ObjectId,
      ref: 'AgentShop',
    },
    expiredDate: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      required: true,
    },
    lastPaymentDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: false,
    collection: 'renewshops', // Explicit collection name
  }
);

// Indexes
RenewShopSchema.index({ originalShopId: 1 });
RenewShopSchema.index({ originalAgentShopId: 1 });
RenewShopSchema.index({ expiredDate: 1 });
RenewShopSchema.index({ category: 1 });
RenewShopSchema.index({ pincode: 1 });

const RenewShop: Model<IRenewShop> = mongoose.models.RenewShop || mongoose.model<IRenewShop>('RenewShop', RenewShopSchema);

export default RenewShop;

