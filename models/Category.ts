import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes - optimized for common queries
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ slug: 1 }); // Already unique, but explicit index helps
CategorySchema.index({ name: 1 }); // For name-based queries

const Category: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export default Category;

