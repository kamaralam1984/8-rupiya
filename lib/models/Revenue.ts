import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Revenue Interface - Tracks all revenue by district, plan type, and date
 */
export interface IRevenue extends Document {
  district: string;
  date: Date;
  // Plan-wise revenue
  basicPlanRevenue: number; // ₹100 per shop
  premiumPlanRevenue: number; // ₹2999 per shop
  featuredPlanRevenue: number; // ₹199+ per shop
  leftBarPlanRevenue: number; // ₹299 per shop
  rightBarPlanRevenue: number; // ₹299 per shop
  bannerPlanRevenue: number; // ₹399 per shop
  heroPlanRevenue: number; // ₹499 per shop
  advertisementRevenue: number; // Additional ad revenue
  // Counts
  basicPlanCount: number;
  premiumPlanCount: number;
  featuredPlanCount: number;
  leftBarPlanCount: number;
  rightBarPlanCount: number;
  bannerPlanCount: number;
  heroPlanCount: number;
  advertisementCount: number;
  // Agent commissions
  totalAgentCommission: number;
  // Net revenue
  totalRevenue: number;
  netRevenue: number; // After agent commission
  createdAt: Date;
}

const RevenueSchema = new Schema<IRevenue>(
  {
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    basicPlanRevenue: {
      type: Number,
      default: 0,
      min: [0, 'Revenue cannot be negative'],
    },
    premiumPlanRevenue: {
      type: Number,
      default: 0,
      min: [0, 'Revenue cannot be negative'],
    },
    featuredPlanRevenue: {
      type: Number,
      default: 0,
      min: [0, 'Revenue cannot be negative'],
    },
    leftBarPlanRevenue: {
      type: Number,
      default: 0,
      min: [0, 'Revenue cannot be negative'],
    },
    rightBarPlanRevenue: {
      type: Number,
      default: 0,
      min: [0, 'Revenue cannot be negative'],
    },
    bannerPlanRevenue: {
      type: Number,
      default: 0,
      min: [0, 'Revenue cannot be negative'],
    },
    heroPlanRevenue: {
      type: Number,
      default: 0,
      min: [0, 'Revenue cannot be negative'],
    },
    advertisementRevenue: {
      type: Number,
      default: 0,
      min: [0, 'Revenue cannot be negative'],
    },
    basicPlanCount: {
      type: Number,
      default: 0,
      min: [0, 'Count cannot be negative'],
    },
    premiumPlanCount: {
      type: Number,
      default: 0,
      min: [0, 'Count cannot be negative'],
    },
    featuredPlanCount: {
      type: Number,
      default: 0,
      min: [0, 'Count cannot be negative'],
    },
    leftBarPlanCount: {
      type: Number,
      default: 0,
      min: [0, 'Count cannot be negative'],
    },
    rightBarPlanCount: {
      type: Number,
      default: 0,
      min: [0, 'Count cannot be negative'],
    },
    bannerPlanCount: {
      type: Number,
      default: 0,
      min: [0, 'Count cannot be negative'],
    },
    heroPlanCount: {
      type: Number,
      default: 0,
      min: [0, 'Count cannot be negative'],
    },
    advertisementCount: {
      type: Number,
      default: 0,
      min: [0, 'Count cannot be negative'],
    },
    totalAgentCommission: {
      type: Number,
      default: 0,
      min: [0, 'Commission cannot be negative'],
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: [0, 'Total revenue cannot be negative'],
    },
    netRevenue: {
      type: Number,
      default: 0,
      min: [0, 'Net revenue cannot be negative'],
    },
  },
  {
    timestamps: true,
    collection: 'revenues',
  }
);

// Indexes for efficient queries
RevenueSchema.index({ district: 1, date: -1 });
RevenueSchema.index({ date: -1 });

// Calculate totals before saving
RevenueSchema.pre('save', function(next) {
  this.totalRevenue = 
    this.basicPlanRevenue + 
    this.premiumPlanRevenue + 
    this.featuredPlanRevenue + 
    this.leftBarPlanRevenue +
    this.rightBarPlanRevenue +
    this.bannerPlanRevenue +
    this.heroPlanRevenue +
    this.advertisementRevenue;
  
  this.netRevenue = this.totalRevenue - this.totalAgentCommission;
  next();
});

const Revenue: Model<IRevenue> = mongoose.models.Revenue || mongoose.model<IRevenue>('Revenue', RevenueSchema);

export default Revenue;

