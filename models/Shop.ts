import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Shop Interface - TypeScript interface for Shop document
 * Includes all fields including Buffer types for imageData and iconData
 */
export interface IShop extends Document {
  name: string;
  category: string;
  imageUrl: string;        // URL from Cloudinary
  iconUrl: string;         // can be same as imageUrl
  imagePublicId: string;   // Cloudinary public id for later updates/delete
  latitude: number;
  longitude: number;
  area: string;
  address: string;
  imageData: Buffer;       // raw image data saved in MongoDB
  iconData: Buffer;        // icon data (can be same as imageData)
  createdAt: Date;
}

/**
 * Shop Schema - Mongoose schema definition
 * Stores shop information with image URLs (Cloudinary) and raw image data (MongoDB Buffer)
 */
const ShopSchema = new Schema<IShop>(
  {
    name: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
      maxlength: [200, 'Shop name cannot exceed 200 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    iconUrl: {
      type: String,
      required: [true, 'Icon URL is required'],
      trim: true,
    },
    imagePublicId: {
      type: String,
      required: [true, 'Image public ID is required'],
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
    area: {
      type: String,
      required: [true, 'Area is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    imageData: {
      type: Buffer,
      required: [true, 'Image data is required'],
    },
    iconData: {
      type: Buffer,
      required: [true, 'Icon data is required'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We only use createdAt, not updatedAt
  }
);

// Indexes for better query performance
ShopSchema.index({ category: 1 });
ShopSchema.index({ latitude: 1, longitude: 1 });
ShopSchema.index({ area: 1 });

const Shop: Model<IShop> = mongoose.models.Shop || mongoose.model<IShop>('Shop', ShopSchema);

export default Shop;
