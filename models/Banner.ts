import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBanner extends Document {
  section: 'hero' | 'left' | 'right' | 'top' | 'bottom' | 'banner';
  imageUrl: string;
  iconUrl?: string; // Icon image URL for banner
  title?: string;
  cta?: string;
  ctaText?: string;
  linkUrl: string;
  alt?: string;
  advertiser?: string;
  sponsored: boolean;
  position?: number;
  // Page-specific targeting
  pageUrl?: string; // Specific page URL (e.g., '/', '/category/restaurants')
  pageId?: string; // Reference to Page model if exists
  category?: string; // Category slug
  // Location-based fields
  area?: string; // e.g., "A.H. Guard", "B.C. Road"
  pincode?: number;
  locationId?: string; // Reference to location
  // Shop coordinates for distance calculation
  lat?: number;
  lng?: number;
  // Shop information
  shopName?: string; // Shop name associated with this banner
  shopId?: string; // Reference to shop (can be AdminShop or AgentShop ID)
  // Effects and Animations
  textEffect?: 'glow' | 'gradient' | 'shadow' | 'outline' | '3d' | 'neon' | 'rainbow' | 'metallic' | 'glass' | 'emboss' | 'anaglyph' | 'retro' | 'holographic' | 'fire' | 'ice' | 'electric' | 'gold' | 'silver' | 'chrome' | 'diamond' | 'none';
  animation?: 'fade' | 'slide' | 'bounce' | 'pulse' | 'shake' | 'rotate' | 'scale' | 'wobble' | 'flip' | 'zoom' | 'glow-pulse' | 'wave' | 'float' | 'spin' | 'shimmer' | 'gradient-shift' | 'typewriter' | 'glitch' | 'morph' | 'elastic' | 'none';
  animationDuration?: number; // in seconds
  animationDelay?: number; // in seconds
  // Background effects
  backgroundEffect?: 'gradient' | 'blur' | 'overlay' | 'particles' | 'none';
  overlayColor?: string;
  overlayOpacity?: number;
  // Active status
  isActive: boolean;
  // Order/priority for sorting
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    section: {
      type: String,
      required: [true, 'Section is required'],
      enum: ['hero', 'left', 'right', 'top', 'bottom', 'banner'],
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    iconUrl: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    cta: {
      type: String,
      trim: true,
    },
    ctaText: {
      type: String,
      trim: true,
    },
    linkUrl: {
      type: String,
      required: [true, 'Link URL is required'],
      default: '#',
    },
    alt: {
      type: String,
      trim: true,
    },
    advertiser: {
      type: String,
      trim: true,
    },
    sponsored: {
      type: Boolean,
      default: false,
    },
    position: {
      type: Number,
      min: 0,
    },
    area: {
      type: String,
      trim: true,
    },
    pincode: {
      type: Number,
    },
    locationId: {
      type: String,
      trim: true,
    },
    lat: {
      type: Number,
    },
    lng: {
      type: Number,
    },
    shopName: {
      type: String,
      trim: true,
    },
    shopId: {
      type: String,
      trim: true,
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
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
BannerSchema.index({ section: 1, isActive: 1, order: 1 });
BannerSchema.index({ area: 1, pincode: 1 });
BannerSchema.index({ locationId: 1 });

const Banner: Model<IBanner> = mongoose.models.Banner || mongoose.model<IBanner>('Banner', BannerSchema);

export default Banner;

