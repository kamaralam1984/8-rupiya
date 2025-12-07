import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHeroBannerImage extends Document {
  imageUrl: string;
  alt: string;
  title?: string;
  linkUrl?: string;
  // Page-specific targeting
  pageUrl?: string; // Specific page URL (e.g., '/', '/category/restaurants')
  pageId?: string; // Reference to Page model if exists
  category?: string; // Category slug
  // Location-based targeting
  locationId?: string;
  area?: string;
  pincode?: number;
  // Display settings
  order: number;
  isActive: boolean;
  // Effects and Animations
  textEffect?: 'glow' | 'gradient' | 'shadow' | 'outline' | '3d' | 'neon' | 'rainbow' | 'metallic' | 'glass' | 'emboss' | 'anaglyph' | 'retro' | 'holographic' | 'fire' | 'ice' | 'electric' | 'gold' | 'silver' | 'chrome' | 'diamond' | 'none';
  animation?: 'fade' | 'slide' | 'bounce' | 'pulse' | 'shake' | 'rotate' | 'scale' | 'wobble' | 'flip' | 'zoom' | 'glow-pulse' | 'wave' | 'float' | 'spin' | 'shimmer' | 'gradient-shift' | 'typewriter' | 'glitch' | 'morph' | 'elastic' | 'none';
  animationDuration?: number; // in seconds
  animationDelay?: number; // in seconds
  // Text overlay settings
  showTitle?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  titleColor?: string;
  subtitleColor?: string;
  // Background effects
  backgroundEffect?: 'gradient' | 'blur' | 'overlay' | 'particles' | 'none';
  overlayColor?: string;
  overlayOpacity?: number;
  // Timing
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const HeroBannerImageSchema = new Schema<IHeroBannerImage>(
  {
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    alt: {
      type: String,
      required: [true, 'Alt text is required'],
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    linkUrl: {
      type: String,
      default: '#',
    },
    pageUrl: {
      type: String,
      trim: true,
    },
    pageId: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    locationId: {
      type: String,
      trim: true,
    },
    area: {
      type: String,
      trim: true,
    },
    pincode: {
      type: Number,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    textEffect: {
      type: String,
      enum: ['glow', 'gradient', 'shadow', 'outline', '3d', 'neon', 'rainbow', 'metallic', 'glass', 'emboss', 'anaglyph', 'retro', 'holographic', 'fire', 'ice', 'electric', 'gold', 'silver', 'chrome', 'diamond', 'none'],
      default: 'none',
    },
    animation: {
      type: String,
      enum: ['fade', 'slide', 'bounce', 'pulse', 'shake', 'rotate', 'scale', 'wobble', 'flip', 'zoom', 'glow-pulse', 'wave', 'float', 'spin', 'shimmer', 'gradient-shift', 'typewriter', 'glitch', 'morph', 'elastic', 'none'],
      default: 'none',
    },
    animationDuration: {
      type: Number,
      default: 2,
      min: 0.5,
      max: 10,
    },
    animationDelay: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    showTitle: {
      type: Boolean,
      default: false,
    },
    showSubtitle: {
      type: Boolean,
      default: false,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    titleColor: {
      type: String,
      default: '#ffffff',
    },
    subtitleColor: {
      type: String,
      default: '#ffffff',
    },
    backgroundEffect: {
      type: String,
      enum: ['gradient', 'blur', 'overlay', 'particles', 'none'],
      default: 'none',
    },
    overlayColor: {
      type: String,
      default: '#000000',
    },
    overlayOpacity: {
      type: Number,
      default: 0.3,
      min: 0,
      max: 1,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
HeroBannerImageSchema.index({ pageUrl: 1, isActive: 1, order: 1 });
HeroBannerImageSchema.index({ locationId: 1, isActive: 1 });
HeroBannerImageSchema.index({ category: 1, isActive: 1 });
HeroBannerImageSchema.index({ startDate: 1, endDate: 1 });

const HeroBannerImage: Model<IHeroBannerImage> = mongoose.models.HeroBannerImage || mongoose.model<IHeroBannerImage>('HeroBannerImage', HeroBannerImageSchema);

export default HeroBannerImage;




