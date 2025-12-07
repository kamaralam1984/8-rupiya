import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISliderImage extends Document {
  imageUrl: string;
  alt: string;
  title?: string;
  linkUrl?: string;
  // Page-specific targeting
  pageUrl?: string; // Specific page URL (e.g., '/', '/category/restaurants')
  pageId?: string; // Reference to Page model if exists
  category?: string; // Category slug
  order: number;
  isActive: boolean;
  transitionEffect?: 'fade' | 'slide' | 'zoom' | 'flip' | 'cube' | 'coverflow' | 'cards' | 'creative' | 'shuffle';
  duration?: number; // Auto-slide duration in milliseconds
  createdAt: Date;
  updatedAt: Date;
}

const SliderImageSchema = new Schema<ISliderImage>(
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
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    transitionEffect: {
      type: String,
      enum: ['fade', 'slide', 'zoom', 'flip', 'cube', 'coverflow', 'cards', 'creative', 'shuffle'],
      default: 'fade',
    },
    duration: {
      type: Number,
      default: 5000, // 5 seconds
      min: 1000, // Minimum 1 second
      max: 30000, // Maximum 30 seconds
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
SliderImageSchema.index({ isActive: 1, order: 1 });
SliderImageSchema.index({ pageUrl: 1, isActive: 1, order: 1 });
SliderImageSchema.index({ category: 1, isActive: 1 });
SliderImageSchema.index({ createdAt: -1 });

const SliderImage: Model<ISliderImage> = mongoose.models.SliderImage || mongoose.model<ISliderImage>('SliderImage', SliderImageSchema);

export default SliderImage;

