import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Google Business Profile Interface
 * Tracks Google Business Profile creation status for shops
 */
export interface IGoogleBusinessProfile extends Document {
  shopId: Types.ObjectId; // Reference to Shop
  shopName: string;
  ownerName: string;
  mobile?: string;
  email?: string;
  address: string;
  area?: string; // Area/locality
  city?: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  category: string;
  photoUrl?: string; // Shop image/photo URL
  
  // Google Business Profile Details
  googleBusinessId?: string; // Google Business Profile ID (if created)
  googleBusinessUrl?: string; // Google Business Profile URL
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED' | 'NOT_CREATED';
  verificationMethod?: 'PHONE' | 'EMAIL' | 'POSTCARD' | 'VIDEO';
  
  // Creation Details
  createdBy: Types.ObjectId; // Admin/Operator who created
  createdByRole: 'admin' | 'editor' | 'operator';
  createdAt: Date;
  updatedAt: Date;
  
  // Additional Info
  notes?: string; // Operator notes
  retryCount: number; // Number of retry attempts
  lastRetryAt?: Date;
}

const GoogleBusinessProfileSchema = new Schema<IGoogleBusinessProfile>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      // Index created explicitly below
    },
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
      trim: true,
      match: [/^(\+?\d{1,3}[-.\s]?)?(\d{10})$/, 'Please provide a valid mobile number'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    area: {
      type: String,
      trim: true,
      maxlength: [100, 'Area cannot exceed 100 characters'],
    },
    pincode: {
      type: String,
      trim: true,
    },
    photoUrl: {
      type: String,
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
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    googleBusinessId: {
      type: String,
      trim: true,
      // Index created explicitly below with sparse option
    },
    googleBusinessUrl: {
      type: String,
      trim: true,
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'FAILED', 'NOT_CREATED'],
      default: 'NOT_CREATED',
      // Index created explicitly below
    },
    verificationMethod: {
      type: String,
      enum: ['PHONE', 'EMAIL', 'POSTCARD', 'VIDEO'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required'],
    },
    createdByRole: {
      type: String,
      enum: ['admin', 'editor', 'operator'],
      required: [true, 'Created by role is required'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    retryCount: {
      type: Number,
      default: 0,
      min: [0, 'Retry count cannot be negative'],
    },
    lastRetryAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'googlebusinessprofiles',
  }
);

// Indexes
GoogleBusinessProfileSchema.index({ shopId: 1 });
GoogleBusinessProfileSchema.index({ verificationStatus: 1 });
GoogleBusinessProfileSchema.index({ createdAt: -1 });
GoogleBusinessProfileSchema.index({ googleBusinessId: 1 }, { sparse: true });

const GoogleBusinessProfile: Model<IGoogleBusinessProfile> =
  mongoose.models.GoogleBusinessProfile ||
  mongoose.model<IGoogleBusinessProfile>('GoogleBusinessProfile', GoogleBusinessProfileSchema);

export default GoogleBusinessProfile;

