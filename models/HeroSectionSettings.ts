import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHeroSectionSettings extends Document {
  // Section visibility
  sections: {
    slider: boolean;
    leftRail: boolean;
    hero: boolean;
    rightRail: boolean;
    bottomStrip: boolean;
    categories: boolean;
  };
  
  // Slider Settings
  slider: {
    enabled: boolean;
    height: string; // e.g., "h-24", "h-32", "h-36"
    backgroundColor: string;
    autoPlay: boolean;
    transitionDuration: number; // milliseconds
    shopIds: string[]; // Shop IDs to display
  };
  
  // Left Rail Settings
  leftRail: {
    enabled: boolean;
    count: number; // Number of shops (default 3)
    height: string;
    backgroundColor: string;
    borderColor: string;
    shopIds: string[];
  };
  
  // Hero Banner Settings
  hero: {
    enabled: boolean;
    height: string;
    backgroundColor: string;
    borderColor: string;
    borderRadius: string;
    shopId?: string; // Single shop ID
  };
  
  // Right Rail Settings
  rightRail: {
    enabled: boolean;
    count: number; // Number of shops (default 3)
    height: string;
    backgroundColor: string;
    borderColor: string;
    shopIds: string[];
  };
  
  // Bottom Strip Settings
  bottomStrip: {
    enabled: boolean;
    count: number; // Number of shops (default 10)
    height: string;
    backgroundColor: string;
    borderColor: string;
    shopIds: string[];
  };
  
  // Categories Settings
  categories: {
    enabled: boolean;
    count: number; // Number of categories to display (default: show all)
    size: string; // Icon/image size (e.g., "h-24 w-24", "h-28 w-28", "h-32 w-32")
    categoryIds: string[]; // Selected category IDs to display (empty = show all)
  };
  
  // Global Settings
  global: {
    containerWidth: string; // e.g., "98%", "1200px"
    sectionSpacing: string; // e.g., "40px", "60px"
    backgroundColor: string;
    borderRadius: string;
    padding: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const HeroSectionSettingsSchema = new Schema<IHeroSectionSettings>(
  {
    sections: {
      slider: { type: Boolean, default: true },
      leftRail: { type: Boolean, default: true },
      hero: { type: Boolean, default: true },
      rightRail: { type: Boolean, default: true },
      bottomStrip: { type: Boolean, default: true },
      categories: { type: Boolean, default: true },
    },
    slider: {
      enabled: { type: Boolean, default: true },
      height: { type: String, default: 'h-32' },
      backgroundColor: { type: String, default: '#ffffff' },
      autoPlay: { type: Boolean, default: true },
      transitionDuration: { type: Number, default: 5000 },
      shopIds: { type: [String], default: [] },
    },
    leftRail: {
      enabled: { type: Boolean, default: true },
      count: { type: Number, default: 3, min: 0, max: 10 },
      height: { type: String, default: 'h-[391px]' },
      backgroundColor: { type: String, default: '#ffffff' },
      borderColor: { type: String, default: '#e5e7eb' },
      shopIds: { type: [String], default: [] },
    },
    hero: {
      enabled: { type: Boolean, default: true },
      height: { type: String, default: 'h-[391px]' },
      backgroundColor: { type: String, default: '#ffffff' },
      borderColor: { type: String, default: '#e5e7eb' },
      borderRadius: { type: String, default: 'rounded-lg' },
      shopId: { type: String, default: '' },
    },
    rightRail: {
      enabled: { type: Boolean, default: true },
      count: { type: Number, default: 3, min: 0, max: 10 },
      height: { type: String, default: 'h-[391px]' },
      backgroundColor: { type: String, default: '#ffffff' },
      borderColor: { type: String, default: '#e5e7eb' },
      shopIds: { type: [String], default: [] },
    },
    bottomStrip: {
      enabled: { type: Boolean, default: true },
      count: { type: Number, default: 10, min: 0, max: 30 },
      height: { type: String, default: 'h-20' },
      backgroundColor: { type: String, default: '#ffffff' },
      borderColor: { type: String, default: '#e5e7eb' },
      shopIds: { type: [String], default: [] },
    },
    categories: {
      enabled: { type: Boolean, default: true },
      count: { type: Number, default: 0, min: 0 }, // 0 = show all
      size: { type: String, default: 'h-24 w-24 md:h-28 md:w-28' }, // Default size
      categoryIds: { type: [String], default: [] }, // Empty = show all categories
    },
    global: {
      containerWidth: { type: String, default: '98%' },
      sectionSpacing: { type: String, default: '40px' },
      backgroundColor: { type: String, default: '#f9fafb' },
      borderRadius: { type: String, default: 'rounded-xl' },
      padding: { type: String, default: 'p-2' },
    },
  },
  {
    timestamps: true,
    collection: 'herosectionsettings',
  }
);

// Note: _id already has a default index in MongoDB, cannot create custom index on _id
// MongoDB automatically creates a unique index on _id field

const HeroSectionSettings: Model<IHeroSectionSettings> =
  mongoose.models.HeroSectionSettings ||
  mongoose.model<IHeroSectionSettings>('HeroSectionSettings', HeroSectionSettingsSchema);

export default HeroSectionSettings;


