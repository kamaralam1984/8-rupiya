import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * SEO Interface - TypeScript interface for SEO document
 * Stores SEO information for shops with ranking system
 */
export interface ISEO extends Document {
  shopName: string;
  area: string;
  category: string;
  pincode: string;
  emailId: string;
  ranking: number; // SEO ranking (1, 2, 3, etc.)
  shopId?: Types.ObjectId; // Reference to shop (optional, can be linked later)
  shopUrl?: string; // Shop URL for reference
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SEO Schema - Mongoose schema definition
 */
const SEOSchema = new Schema<ISEO>(
  {
    shopName: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
      maxlength: [200, 'Shop name cannot exceed 200 characters'],
      index: true,
    },
    area: {
      type: String,
      required: [true, 'Area is required'],
      trim: true,
      maxlength: [100, 'Area cannot exceed 100 characters'],
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
      match: [/^\d{6}$/, 'Pincode must be 6 digits'],
      index: true,
    },
    emailId: {
      type: String,
      required: [true, 'Email ID is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    ranking: {
      type: Number,
      required: [true, 'Ranking is required'],
      min: [1, 'Ranking must be at least 1'],
      default: 1,
      index: true,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'ShopFromImage',
      required: false,
    },
    shopUrl: {
      type: String,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: 'seo', // Explicit collection name
  }
);

// Compound indexes for better query performance
SEOSchema.index({ category: 1, area: 1, pincode: 1 });
SEOSchema.index({ ranking: 1, category: 1 });
SEOSchema.index({ emailId: 1 });

// Ensure unique ranking per category/area/pincode combination (optional - can have multiple shops with same ranking)
// SEOSchema.index({ ranking: 1, category: 1, area: 1, pincode: 1 }, { unique: true });

const SEO: Model<ISEO> = mongoose.models.SEO || mongoose.model<ISEO>('SEO', SEOSchema);

export default SEO;

