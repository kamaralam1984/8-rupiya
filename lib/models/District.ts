import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * District Interface - Tracks district-wise statistics
 */
export interface IDistrict extends Document {
  name: string;
  state: string;
  totalShops: number;
  basicPlanShops: number;
  premiumPlanShops: number;
  featuredPlanShops: number;
  totalRevenue: number;
  targetShops: number; // Target: 10 lakh shops
  progressPercentage: number; // Progress towards target
  createdAt: Date;
  updatedAt: Date;
}

const DistrictSchema = new Schema<IDistrict>(
  {
    name: {
      type: String,
      required: [true, 'District name is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    totalShops: {
      type: Number,
      default: 0,
      min: [0, 'Total shops cannot be negative'],
    },
    basicPlanShops: {
      type: Number,
      default: 0,
      min: [0, 'Basic plan shops cannot be negative'],
    },
    premiumPlanShops: {
      type: Number,
      default: 0,
      min: [0, 'Premium plan shops cannot be negative'],
    },
    featuredPlanShops: {
      type: Number,
      default: 0,
      min: [0, 'Featured plan shops cannot be negative'],
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: [0, 'Total revenue cannot be negative'],
    },
    targetShops: {
      type: Number,
      default: 1000000, // 10 lakh target
      min: [0, 'Target cannot be negative'],
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: [0, 'Progress cannot be negative'],
      max: [100, 'Progress cannot exceed 100'],
    },
  },
  {
    timestamps: true,
    collection: 'districts',
  }
);

// Indexes
DistrictSchema.index({ name: 1 });
DistrictSchema.index({ state: 1 });
DistrictSchema.index({ totalRevenue: -1 });

// Calculate progress before saving
DistrictSchema.pre('save', function(next) {
  if (this.targetShops > 0) {
    this.progressPercentage = Math.round((this.totalShops / this.targetShops) * 100);
  }
  next();
});

const District: Model<IDistrict> = mongoose.models.District || mongoose.model<IDistrict>('District', DistrictSchema);

export default District;

