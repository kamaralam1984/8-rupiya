import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Shop Interface - TypeScript interface for Shop document
 * Used for creating shops from images with GPS data
 */
export interface IShop extends Document {
  shopName: string;
  ownerName: string;
  category: string;
  categoryRef?: Types.ObjectId; // Reference to Category model
  mobile?: string;
  area?: string;
  fullAddress: string;
  city?: string;
  pincode?: string;
  district?: string; // District name for revenue tracking
  latitude: number;
  longitude: number;
  photoUrl: string;      // original image URL
  iconUrl: string;       // same as photoUrl for now
  shopUrl: string;       // Unique URL slug for the shop (e.g., "/shop/abc-store-123")
  createdByAdmin?: Types.ObjectId; // Reference to User (admin) - optional for agent-created shops
  createdByAgent?: Types.ObjectId; // Reference to Agent - for agent-created shops
  agentName?: string; // Agent name for quick reference
  agentCode?: string; // Agent code for quick reference
  paymentStatus: 'PAID' | 'PENDING'; // Payment status
  paymentExpiryDate: Date; // 365 days from payment date
  lastPaymentDate: Date; // Date when payment was last made
  visitorCount: number; // Number of visitors/views
  // Pricing Plan System
  planType: 'BASIC' | 'PREMIUM' | 'FEATURED' | 'LEFT_BAR' | 'RIGHT_SIDE' | 'BOTTOM_RAIL' | 'BANNER' | 'HERO';
  planAmount: number; // Actual amount paid
  planStartDate: Date; // When plan was activated
  planEndDate: Date; // When plan expires
  // Premium/Featured Features
  additionalPhotos?: string[]; // Unlimited photos for Premium/Featured
  shopLogo?: string; // Shop logo for Premium/Featured
  offers?: Array<{ title: string; description: string; validTill: Date }>; // Offers section
  whatsappNumber?: string; // WhatsApp button for Premium/Featured
  priorityRank: number; // Higher rank = shows first
  isHomePageBanner: boolean; // Featured/Banner shops on homepage
  isTopSlider: boolean; // Featured shops in top slider
  isLeftBar: boolean; // Left Bar Plan shops
  isRightBar: boolean; // Right Bar Plan shops
  isHero: boolean; // Hero Plan shops
  isVisible?: boolean; // Control shop visibility (true = show, false = hide)
  createdAt: Date;
}

/**
 * Shop Schema - Mongoose schema definition
 * Stores shop information extracted from images with GPS data
 */
const ShopSchema = new Schema<IShop>(
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
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      // Category name (for display and backward compatibility)
    },
    categoryRef: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: false, // Optional reference to Category model
    },
    mobile: {
      type: String,
      trim: true,
      match: [/^(\+?\d{1,3}[-.\s]?)?(\d{10})$/, 'Please provide a valid 10-digit mobile number'],
    },
    area: {
      type: String,
      trim: true,
      maxlength: [100, 'Area cannot exceed 100 characters'],
    },
    fullAddress: {
      type: String,
      required: [true, 'Full address is required'],
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters'],
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters'],
    },
    pincode: {
      type: String,
      trim: true,
      match: [/^\d{6}$/, 'Pincode must be 6 digits'],
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
    photoUrl: {
      type: String,
      required: [true, 'Photo URL is required'],
      trim: true,
    },
    iconUrl: {
      type: String,
      required: [true, 'Icon URL is required'],
      trim: true,
    },
    shopUrl: {
      type: String,
      required: [true, 'Shop URL is required'],
      trim: true,
      unique: true, // Ensure each shop has a unique URL
      index: true, // Index for faster lookups
    },
    createdByAdmin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Made optional to allow agent-created shops
    },
    createdByAgent: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
      required: false, // For agent-created shops
    },
    agentName: {
      type: String,
      trim: true,
      maxlength: [100, 'Agent name cannot exceed 100 characters'],
    },
    agentCode: {
      type: String,
      trim: true,
      maxlength: [50, 'Agent code cannot exceed 50 characters'],
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PENDING'],
      default: 'PENDING',
      required: true,
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
    visitorCount: {
      type: Number,
      default: 0,
      min: [0, 'Visitor count cannot be negative'],
    },
    district: {
      type: String,
      trim: true,
      maxlength: [100, 'District name cannot exceed 100 characters'],
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
    planStartDate: {
      type: Date,
      default: Date.now,
    },
    planEndDate: {
      type: Date,
      default: function() {
        const date = new Date();
        date.setDate(date.getDate() + 365); // 1 year validity
        return date;
      },
    },
    additionalPhotos: {
      type: [String],
      default: [],
    },
    shopLogo: {
      type: String,
      trim: true,
    },
    offers: {
      type: [{
        title: String,
        description: String,
        validTill: Date,
      }],
      default: [],
    },
    whatsappNumber: {
      type: String,
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid WhatsApp number'],
    },
    priorityRank: {
      type: Number,
      default: 0, // Basic shops = 0, Premium = 10, Featured = 100
      min: [0, 'Priority rank cannot be negative'],
    },
    isHomePageBanner: {
      type: Boolean,
      default: false, // Only for Featured shops
    },
    isTopSlider: {
      type: Boolean,
      default: false, // Only for Featured shops
    },
    isLeftBar: {
      type: Boolean,
      default: false, // Only for Left Bar Plan
    },
    isRightBar: {
      type: Boolean,
      default: false, // Only for Right Bar Plan
    },
    isHero: {
      type: Boolean,
      default: false, // Only for Hero Plan
    },
    isVisible: {
      type: Boolean,
      default: true, // By default, shops are visible
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We only use createdAt, not updatedAt
    collection: 'shopsfromimage', // Explicit collection name
  }
);

// Indexes for better query performance
ShopSchema.index({ category: 1 });
ShopSchema.index({ latitude: 1, longitude: 1 });
ShopSchema.index({ area: 1 });
ShopSchema.index({ city: 1 });
ShopSchema.index({ pincode: 1 });
ShopSchema.index({ district: 1 }); // For district-wise revenue tracking
ShopSchema.index({ createdByAdmin: 1 });
ShopSchema.index({ visitorCount: -1 }); // For sorting by popularity
ShopSchema.index({ planType: 1, priorityRank: -1 }); // For plan-based sorting
ShopSchema.index({ isHomePageBanner: 1 }); // For featured shops
ShopSchema.index({ isTopSlider: 1 }); // For slider shops
ShopSchema.index({ paymentStatus: 1 }); // For pending/paid shops filtering

// Use a unique model name to avoid conflicts with old Shop model
const Shop: Model<IShop> = mongoose.models.ShopFromImage || mongoose.model<IShop>('ShopFromImage', ShopSchema);

export default Shop;

