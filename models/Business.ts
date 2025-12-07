import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IBusiness extends Document {
  name: string;
  slug: string;
  categoryId: Types.ObjectId;
  address: string;
  pincode: string;
  area: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  isFeatured: boolean;
  specialOffers?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema = new Schema<IBusiness>(
  {
    name: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: [200, 'Business name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Business slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
    },
    area: {
      type: String,
      required: [true, 'Area is required'],
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    specialOffers: [{
      type: Schema.Types.ObjectId,
      ref: 'Offer',
    }],
    // GeoJSON location for geospatial queries
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create location from latitude/longitude before saving
BusinessSchema.pre('save', function(next) {
  if (this.latitude && this.longitude) {
    this.location = {
      type: 'Point',
      coordinates: [this.longitude, this.latitude], // MongoDB uses [lng, lat]
    };
  }
  next();
});

// Indexes
BusinessSchema.index({ categoryId: 1 });
BusinessSchema.index({ isFeatured: 1 });
// Geospatial index for location-based queries (2dsphere for spherical calculations)
BusinessSchema.index({ location: '2dsphere' });
// Compound index for category + location queries
BusinessSchema.index({ categoryId: 1, location: '2dsphere' });
// Compound index for featured + location queries
BusinessSchema.index({ isFeatured: 1, location: '2dsphere' });

const Business: Model<IBusiness> = mongoose.models.Business || mongoose.model<IBusiness>('Business', BusinessSchema);

export default Business;

