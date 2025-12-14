import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Location Interface - TypeScript interface for Location document
 */
export interface ILocation extends Document {
  id: string; // Unique identifier (e.g., "location-name-801101")
  city: string;
  state?: string;
  country: string;
  displayName: string;
  pincode?: number;
  district?: string;
  area?: string; // Area/locality name
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Location Schema - Mongoose schema definition
 * Stores location information for businesses and shops
 */
const LocationSchema = new Schema<ILocation>(
  {
    id: {
      type: String,
      required: [true, 'Location ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters'],
      index: true,
    },
    state: {
      type: String,
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters'],
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
      maxlength: [100, 'Country cannot exceed 100 characters'],
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
      maxlength: [200, 'Display name cannot exceed 200 characters'],
    },
    pincode: {
      type: Number,
      min: [100000, 'Pincode must be 6 digits'],
      max: [999999, 'Pincode must be 6 digits'],
    },
    district: {
      type: String,
      trim: true,
      maxlength: [100, 'District cannot exceed 100 characters'],
    },
    area: {
      type: String,
      trim: true,
      maxlength: [100, 'Area cannot exceed 100 characters'],
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
      index: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: 'locations', // Explicit collection name
  }
);

// Indexes for faster queries
LocationSchema.index({ city: 1, displayName: 1 });
LocationSchema.index({ pincode: 1 });
LocationSchema.index({ district: 1 });
LocationSchema.index({ isActive: 1 });

// Create location from latitude/longitude before saving (GeoJSON format)
LocationSchema.pre('save', function (next) {
  // If both latitude and longitude are provided, we can store them
  // The schema already handles them as separate fields
  next();
});

const Location: Model<ILocation> =
  mongoose.models.Location || mongoose.model<ILocation>('Location', LocationSchema);

export default Location;


