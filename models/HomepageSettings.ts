import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHomepageSettings extends Document {
  name?: string; // Template name for saving configurations
  description?: string; // Template description
  sections: {
    hero: boolean;
    categories: boolean;
    offers: boolean;
    featuredBusinesses: boolean;
    topRated: boolean;
    newBusinesses: boolean;
  };
  shopConfig: {
    enabled: boolean;
    featuredShops: string[]; // Business IDs
    categories: string[]; // Category IDs
    displayCount: number;
  };
  functions: {
    searchBar: boolean;
    locationFilter: boolean;
    categoryFilter: boolean;
    priceFilter: boolean;
    ratingFilter: boolean;
    sortOptions: boolean;
    quickView: boolean;
    compare: boolean;
    wishlist: boolean;
  };
  layout: {
    theme: string;
    primaryColor: string;
    secondaryColor: string;
    containerWidth: string;
    sectionSpacing: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HomepageSettingsSchema = new Schema<IHomepageSettings>(
  {
    name: {
      type: String,
      trim: true,
      default: 'Homepage',
    },
    description: {
      type: String,
      trim: true,
    },
    sections: {
      hero: { type: Boolean, default: true },
      categories: { type: Boolean, default: true },
      offers: { type: Boolean, default: true },
      featuredBusinesses: { type: Boolean, default: true },
      topRated: { type: Boolean, default: true },
      newBusinesses: { type: Boolean, default: true },
    },
    shopConfig: {
      enabled: { type: Boolean, default: false },
      featuredShops: [{ type: String }],
      categories: [{ type: String }],
      displayCount: { type: Number, default: 12 },
    },
    functions: {
      searchBar: { type: Boolean, default: true },
      locationFilter: { type: Boolean, default: true },
      categoryFilter: { type: Boolean, default: true },
      priceFilter: { type: Boolean, default: false },
      ratingFilter: { type: Boolean, default: true },
      sortOptions: { type: Boolean, default: true },
      quickView: { type: Boolean, default: false },
      compare: { type: Boolean, default: false },
      wishlist: { type: Boolean, default: false },
    },
    layout: {
      theme: { type: String, default: 'light' },
      primaryColor: { type: String, default: '#3b82f6' },
      secondaryColor: { type: String, default: '#8b5cf6' },
      containerWidth: { type: String, default: '98%' },
      sectionSpacing: { type: String, default: '40px' },
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Only allow one active homepage settings
HomepageSettingsSchema.index({ isActive: 1 });

const HomepageSettings: Model<IHomepageSettings> =
  mongoose.models.HomepageSettings || mongoose.model<IHomepageSettings>('HomepageSettings', HomepageSettingsSchema);

export default HomepageSettings;

