import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * SEO Interface - TypeScript interface for SEO document
 * Stores comprehensive SEO information for shops with ranking system
 */
export interface ISEO extends Document {
  shopName: string;
  area: string;
  category: string;
  pincode?: string; // Optional pincode
  emailId: string;
  ranking: number; // SEO ranking (1, 2, 3, etc.) - Lower number = Higher priority
  shopId?: Types.ObjectId; // Reference to shop (optional, can be linked later)
  shopUrl?: string; // Shop URL for reference
  
  // Enhanced SEO Fields
  metaTitle?: string; // Custom meta title (if not provided, auto-generated)
  metaDescription?: string; // Custom meta description (max 160 chars)
  metaKeywords?: string[]; // Custom keywords array
  ogImage?: string; // Custom Open Graph image URL
  ogTitle?: string; // Custom Open Graph title
  ogDescription?: string; // Custom Open Graph description
  
  // Social Media Links
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  youtubeUrl?: string;
  whatsappNumber?: string;
  
  // Google Business & Local SEO
  googleBusinessId?: string;
  googleMapsUrl?: string;
  
  // Additional SEO Settings
  enableSocialSharing?: boolean; // Show social sharing popup when shop opens
  socialSharingMessage?: string; // Custom message for social sharing
  enableWhatsAppSharing?: boolean; // Enable WhatsApp sharing
  enableFacebookSharing?: boolean; // Enable Facebook sharing
  enableTwitterSharing?: boolean; // Enable Twitter sharing
  enableLinkedInSharing?: boolean; // Enable LinkedIn sharing
  
  // Analytics & Tracking
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SEO Schema - Mongoose schema definition
 */
const SEOSchema = new Schema<ISEO>(
  {
    shopName: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
      maxlength: [200, 'Shop name cannot exceed 200 characters'],
      index: true,
    },
    area: {
      type: String,
      required: [true, 'Area is required'],
      trim: true,
      maxlength: [100, 'Area cannot exceed 100 characters'],
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    pincode: {
      type: String,
      required: false, // Pincode is optional
      trim: true,
      validate: {
        validator: function(v: string | null | undefined) {
          // If pincode is not provided (null, undefined, or empty string), it's valid
          if (!v || v === '' || v === null || v === undefined) {
            return true;
          }
          // If pincode is provided, it must be 6 digits
          return /^\d{6}$/.test(v.toString());
        },
        message: 'Pincode must be 6 digits if provided',
      },
      index: true,
    },
    emailId: {
      type: String,
      required: [true, 'Email ID is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    ranking: {
      type: Number,
      required: [true, 'Ranking is required'],
      min: [1, 'Ranking must be at least 1'],
      default: 1,
      index: true,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'ShopFromImage',
      required: false,
    },
    shopUrl: {
      type: String,
      trim: true,
      index: true,
    },
    // Enhanced SEO Fields
    metaTitle: {
      type: String,
      trim: true,
      maxlength: [70, 'Meta title should not exceed 70 characters'],
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: [160, 'Meta description should not exceed 160 characters'],
    },
    metaKeywords: {
      type: [String],
      default: [],
    },
    ogImage: {
      type: String,
      trim: true,
    },
    ogTitle: {
      type: String,
      trim: true,
      maxlength: [70, 'OG title should not exceed 70 characters'],
    },
    ogDescription: {
      type: String,
      trim: true,
      maxlength: [200, 'OG description should not exceed 200 characters'],
    },
    // Social Media Links
    facebookUrl: {
      type: String,
      trim: true,
    },
    instagramUrl: {
      type: String,
      trim: true,
    },
    twitterUrl: {
      type: String,
      trim: true,
    },
    linkedinUrl: {
      type: String,
      trim: true,
    },
    youtubeUrl: {
      type: String,
      trim: true,
    },
    whatsappNumber: {
      type: String,
      trim: true,
    },
    // Google Business & Local SEO
    googleBusinessId: {
      type: String,
      trim: true,
    },
    googleMapsUrl: {
      type: String,
      trim: true,
    },
    // Additional SEO Settings
    enableSocialSharing: {
      type: Boolean,
      default: true,
    },
    socialSharingMessage: {
      type: String,
      trim: true,
      maxlength: [200, 'Social sharing message should not exceed 200 characters'],
    },
    enableWhatsAppSharing: {
      type: Boolean,
      default: true,
    },
    enableFacebookSharing: {
      type: Boolean,
      default: true,
    },
    enableTwitterSharing: {
      type: Boolean,
      default: true,
    },
    enableLinkedInSharing: {
      type: Boolean,
      default: true,
    },
    // Analytics & Tracking
    googleAnalyticsId: {
      type: String,
      trim: true,
    },
    facebookPixelId: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: 'seo', // Explicit collection name
  }
);

// Compound indexes for better query performance
SEOSchema.index({ category: 1, area: 1, pincode: 1 });
SEOSchema.index({ ranking: 1, category: 1 });
SEOSchema.index({ emailId: 1 });

// Ensure unique ranking per category/area/pincode combination (optional - can have multiple shops with same ranking)
// SEOSchema.index({ ranking: 1, category: 1, area: 1, pincode: 1 }, { unique: true });

const SEO: Model<ISEO> = mongoose.models.SEO || mongoose.model<ISEO>('SEO', SEOSchema);

export default SEO;

