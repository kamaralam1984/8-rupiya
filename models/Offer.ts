import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IOffer extends Document {
  headline: string;
  description?: string;
  shopId?: string;
  shopName: string;
  shopLogo?: string;
  imageUrl?: string;
  discount?: string;
  cta: string;
  sponsored: boolean;
  businessId?: Types.ObjectId;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  expiresAt?: Date;
  linkUrl?: string;
  position?: number;
  createdAt: Date;
  updatedAt: Date;
}

const OfferSchema = new Schema<IOffer>(
  {
    headline: {
      type: String,
      required: [true, 'Offer headline is required'],
      trim: true,
      maxlength: [200, 'Headline cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    shopId: {
      type: String,
      trim: true,
    },
    shopName: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
      maxlength: [200, 'Shop name cannot exceed 200 characters'],
    },
    shopLogo: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    discount: {
      type: String,
      trim: true,
      maxlength: [100, 'Discount text cannot exceed 100 characters'],
    },
    cta: {
      type: String,
      required: [true, 'CTA text is required'],
      trim: true,
      maxlength: [50, 'CTA text cannot exceed 50 characters'],
      default: 'View Offer',
    },
    sponsored: {
      type: Boolean,
      default: false,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    linkUrl: {
      type: String,
      trim: true,
    },
    position: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
OfferSchema.index({ businessId: 1 });
OfferSchema.index({ isActive: 1 });
OfferSchema.index({ startDate: 1, endDate: 1 });
OfferSchema.index({ expiresAt: 1 });
OfferSchema.index({ position: 1 });
OfferSchema.index({ sponsored: 1 });

const Offer: Model<IOffer> = mongoose.models.Offer || mongoose.model<IOffer>('Offer', OfferSchema);

export default Offer;

