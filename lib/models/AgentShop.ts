import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IAgentShop extends Document {
  shopName: string;
  ownerName: string;
  mobile: string;
  email?: string;
  category: string;
  pincode: string;
  area: string; // Area name (required for pincode system)
  address: string;
  photoUrl: string;
  additionalPhotos?: string[]; // Additional photos (optional, max 9 = total 10 with main photo)
  shopUrl: string; // Unique URL slug for the shop (e.g., "/shop/abc-store-123")
  latitude: number;
  longitude: number;
  paymentStatus: 'PAID' | 'PENDING';
  paymentMode: 'CASH' | 'UPI' | 'NONE';
  receiptNo: string;
  amount: number;
  sendSmsReceipt: boolean;
  agentId: Types.ObjectId;
  paymentExpiryDate: Date; // 365 days from payment date
  lastPaymentDate: Date; // Date when payment was last made
  visitorCount: number; // Number of visitors/views
  // Pricing Plan System
  planType: 'BASIC' | 'PREMIUM' | 'FEATURED' | 'LEFT_BAR' | 'RIGHT_SIDE' | 'BOTTOM_RAIL' | 'BANNER' | 'HERO';
  planAmount: number; // Actual amount paid
  district?: string; // District for revenue tracking
  agentCommission: number; // Commission earned by agent
  paymentScreenshot?: string; // UPI payment screenshot URL
  // Google Business Profile
  googleBusinessAccount?: {
    accountId?: string; // Google Business Profile account ID
    locationId?: string; // Google Business Profile location ID
    status: 'NOT_CREATED' | 'PENDING' | 'CREATED' | 'VERIFIED' | 'FAILED';
    verificationCode?: string; // Verification code if needed
    verificationUrl?: string; // URL for verification
    createdAt?: Date;
    lastUpdated?: Date;
    error?: string; // Error message if creation failed
  };
  createdAt: Date;
}

const AgentShopSchema = new Schema<IAgentShop>(
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
      match: [/^(\+?\d{1,3}[-.\s]?)?(\d{10})$/, 'Please provide a valid 10-digit mobile number'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      // Removed enum to allow any category from admin categories (Flipkart & JustDial)
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
      match: [/^\d{6}$/, 'Pincode must be 6 digits'],
    },
    area: {
      type: String,
      required: [true, 'Area is required'],
      trim: true,
      maxlength: [100, 'Area cannot exceed 100 characters'],
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
    additionalPhotos: {
      type: [String],
      default: [],
      validate: {
        validator: function(v: string[]) {
          return v.length <= 9; // Max 9 additional photos (total 10 with main photo)
        },
        message: 'Maximum 9 additional photos allowed (total 10 with main photo)',
      },
    },
    shopUrl: {
      type: String,
      required: [true, 'Shop URL is required'],
      trim: true,
      unique: true, // Ensure each shop has a unique URL
      index: true, // Index for faster lookups
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
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PENDING'],
      default: 'PENDING',
      required: true,
    },
    paymentMode: {
      type: String,
      enum: ['CASH', 'UPI', 'NONE'],
      default: 'NONE',
      required: true,
    },
    receiptNo: {
      type: String,
      trim: true,
      default: '',
    },
    amount: {
      type: Number,
      default: 100,
      min: [0, 'Amount cannot be negative'],
    },
    sendSmsReceipt: {
      type: Boolean,
      default: false,
    },
    paymentExpiryDate: {
      type: Date,
      default: function() {
        // Default to 365 days from now
        const date = new Date();
        date.setDate(date.getDate() + 365);
        return date;
      },
    },
    lastPaymentDate: {
      type: Date,
      default: Date.now,
    },
    agentId: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
      required: [true, 'Agent ID is required'],
    },
    visitorCount: {
      type: Number,
      default: 0,
      min: [0, 'Visitor count cannot be negative'],
    },
    planType: {
      type: String,
      enum: ['BASIC', 'PREMIUM', 'FEATURED', 'LEFT_BAR', 'RIGHT_SIDE', 'BOTTOM_RAIL', 'BANNER', 'HERO'],
      default: 'BASIC',
      required: true,
    },
    planAmount: {
      type: Number,
      default: 100, // Default ₹100 for Basic
      min: [0, 'Plan amount cannot be negative'],
    },
    district: {
      type: String,
      trim: true,
      maxlength: [100, 'District name cannot exceed 100 characters'],
    },
    paymentScreenshot: {
      type: String,
      trim: true,
    },
    agentCommission: {
      type: Number,
      default: 20, // ₹20 for Basic plan (20% of ₹100)
      min: [0, 'Commission cannot be negative'],
    },
    googleBusinessAccount: {
      accountId: {
        type: String,
        trim: true,
      },
      locationId: {
        type: String,
        trim: true,
      },
      status: {
        type: String,
        enum: ['NOT_CREATED', 'PENDING', 'CREATED', 'VERIFIED', 'FAILED'],
        default: 'NOT_CREATED',
      },
      verificationCode: {
        type: String,
        trim: true,
      },
      verificationUrl: {
        type: String,
        trim: true,
      },
      createdAt: {
        type: Date,
      },
      lastUpdated: {
        type: Date,
      },
      error: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
AgentShopSchema.index({ agentId: 1, createdAt: -1 });
AgentShopSchema.index({ paymentStatus: 1 });
AgentShopSchema.index({ category: 1 });
AgentShopSchema.index({ pincode: 1 });
AgentShopSchema.index({ createdAt: -1 });
AgentShopSchema.index({ latitude: 1, longitude: 1 }); // For geospatial queries
AgentShopSchema.index({ planType: 1, priorityRank: -1 }); // For plan-based sorting
AgentShopSchema.index({ area: 1 }); // For area-based searches
AgentShopSchema.index({ city: 1 }); // For city-based searches
AgentShopSchema.index({ shopName: 'text', category: 'text', area: 'text' }); // Text search index

const AgentShop: Model<IAgentShop> = mongoose.models.AgentShop || mongoose.model<IAgentShop>('AgentShop', AgentShopSchema);

export default AgentShop;


