import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDisplayLimits {
  nearbyShops: number; // BottomStrip - default 30
  leftRail: number; // LeftRail - default 3
  featuredShops: number; // FeaturedBusinesses - default 10
  topCategories: number; // CategoryGrid - default 20
  latestOffers: number; // LatestOffers - default 10
  featuredBusinesses: number; // FeaturedBusinesses (same as featuredShops) - default 10
}

export interface IIconSizes {
  bottomStrip: number; // BottomStrip icon size in pixels - default 66
  leftRail: number; // LeftRail icon size in pixels - default 100
  featuredBusinesses: number; // FeaturedBusinesses icon size in pixels - default 200
  latestOffers: number; // LatestOffers icon size in pixels - default 200
  topCategories: number; // CategoryGrid icon size in pixels - default 112
}

export interface ISectionVisibility {
  leftRail: boolean; // LeftRail section visibility - default true
  rightRail: boolean; // RightRail section visibility - default true
  bottomRail: boolean; // BottomRail (Featured Shops) section visibility - default true
  rightSide: boolean; // RightSide section visibility - default true
}

export interface ISettings extends Document {
  displayLimits: IDisplayLimits;
  iconSizes: IIconSizes;
  sectionVisibility: ISectionVisibility;
  updatedAt: Date;
  createdAt: Date;
}

const DisplayLimitsSchema = new Schema<IDisplayLimits>({
  nearbyShops: { type: Number, default: 30, min: 1, max: 100 },
  leftRail: { type: Number, default: 3, min: 1, max: 10 },
  featuredShops: { type: Number, default: 10, min: 1, max: 50 },
  topCategories: { type: Number, default: 20, min: 1, max: 50 },
  latestOffers: { type: Number, default: 10, min: 1, max: 50 },
  featuredBusinesses: { type: Number, default: 10, min: 1, max: 50 },
}, { _id: false });

const IconSizesSchema = new Schema<IIconSizes>({
  bottomStrip: { type: Number, default: 66, min: 30, max: 200 },
  leftRail: { type: Number, default: 100, min: 50, max: 300 },
  featuredBusinesses: { type: Number, default: 200, min: 100, max: 500 },
  latestOffers: { type: Number, default: 200, min: 100, max: 500 },
  topCategories: { type: Number, default: 112, min: 50, max: 200 },
}, { _id: false });

const SectionVisibilitySchema = new Schema<ISectionVisibility>({
  leftRail: { type: Boolean, default: true },
  rightRail: { type: Boolean, default: true },
  bottomRail: { type: Boolean, default: true },
  rightSide: { type: Boolean, default: true },
}, { _id: false });

const SettingsSchema = new Schema<ISettings>({
  displayLimits: { type: DisplayLimitsSchema, default: () => ({}) },
  iconSizes: { type: IconSizesSchema, default: () => ({}) },
  sectionVisibility: { type: SectionVisibilitySchema, default: () => ({}) },
}, {
  timestamps: true,
});

// Ensure only one settings document exists
SettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const Settings: Model<ISettings> = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;

