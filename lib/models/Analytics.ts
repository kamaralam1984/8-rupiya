import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Analytics Interface - Traffic analysis data
 */
export interface IAnalytics extends Document {
  // Page Information
  page: string; // Page URL or route
  pageTitle?: string; // Page title
  pageType?: 'shop' | 'category' | 'home' | 'search' | 'other'; // Type of page
  
  // Traffic Source
  referrer?: string; // Referring URL
  source: 'direct' | 'google' | 'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'youtube' | 'other'; // Traffic source
  medium?: string; // Traffic medium (organic, cpc, social, etc.)
  campaign?: string; // Campaign name if any
  
  // User Information
  ipAddress?: string; // User IP (hashed for privacy)
  userAgent?: string; // Browser user agent
  device: 'desktop' | 'mobile' | 'tablet'; // Device type
  browser?: string; // Browser name
  os?: string; // Operating system
  
  // Location
  country?: string; // Country code
  city?: string; // City name
  region?: string; // State/Region
  
  // Shop/Category Specific (if applicable)
  shopId?: mongoose.Types.ObjectId; // Shop ID if viewing shop page
  shopName?: string; // Shop name
  category?: string; // Category name
  area?: string; // Area name
  pincode?: string; // Pincode
  
  // Session Information
  sessionId?: string; // Session identifier
  isNewSession?: boolean; // Is this a new session
  
  // Engagement
  timeOnPage?: number; // Time spent on page (seconds)
  scrollDepth?: number; // Scroll depth percentage
  actions?: Array<{
    type: 'click' | 'call' | 'whatsapp' | 'direction' | 'share' | 'visit';
    element?: string;
    timestamp: Date;
  }>;
  
  // Timestamp
  visitedAt: Date; // When the visit occurred
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Analytics Schema
 */
const AnalyticsSchema = new Schema<IAnalytics>(
  {
    page: {
      type: String,
      required: true,
      index: true,
    },
    pageTitle: {
      type: String,
      index: true,
    },
    pageType: {
      type: String,
      enum: ['shop', 'category', 'home', 'search', 'other'],
      index: true,
    },
    referrer: {
      type: String,
      index: true,
    },
    source: {
      type: String,
      enum: ['direct', 'google', 'facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'other'],
      required: true,
      index: true,
    },
    medium: {
      type: String,
      index: true,
    },
    campaign: {
      type: String,
      index: true,
    },
    ipAddress: {
      type: String,
      index: true,
    },
    userAgent: {
      type: String,
    },
    device: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet'],
      required: true,
      index: true,
    },
    browser: {
      type: String,
      index: true,
    },
    os: {
      type: String,
      index: true,
    },
    country: {
      type: String,
      index: true,
    },
    city: {
      type: String,
      index: true,
    },
    region: {
      type: String,
      index: true,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'ShopFromImage',
      index: true,
    },
    shopName: {
      type: String,
      index: true,
    },
    category: {
      type: String,
      index: true,
    },
    area: {
      type: String,
      index: true,
    },
    pincode: {
      type: String,
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    isNewSession: {
      type: Boolean,
      default: true,
    },
    timeOnPage: {
      type: Number,
    },
    scrollDepth: {
      type: Number,
    },
    actions: [{
      type: {
        type: String,
        enum: ['click', 'call', 'whatsapp', 'direction', 'share', 'visit'],
      },
      element: String,
      timestamp: Date,
    }],
    visitedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'analytics',
  }
);

// Compound indexes for better query performance
AnalyticsSchema.index({ visitedAt: -1, source: 1 });
AnalyticsSchema.index({ visitedAt: -1, device: 1 });
AnalyticsSchema.index({ visitedAt: -1, country: 1 });
AnalyticsSchema.index({ pageType: 1, visitedAt: -1 });
AnalyticsSchema.index({ shopId: 1, visitedAt: -1 });
AnalyticsSchema.index({ category: 1, visitedAt: -1 });

const Analytics: Model<IAnalytics> = mongoose.models.Analytics || mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);

export default Analytics;



