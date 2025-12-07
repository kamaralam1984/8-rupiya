import mongoose, { Schema, Document, Model } from 'mongoose';

export interface PageDesignSettings {
  backgroundColor?: string;
  textColor?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  linkColor?: string;
  layout?: string;
  maxWidth?: string;
  padding?: string;
  margin?: string;
  fontFamily?: string;
  fontSize?: string;
  lineHeight?: string;
  headingFont?: string;
  headingSize?: string;
  sectionSpacing?: string;
  contentSpacing?: string;
  borderRadius?: string;
  effects?: Record<string, boolean>;
  functions?: Record<string, boolean>;
  customCSS?: string;
  customJS?: string;
}

export interface IPage extends Document {
  title: string;
  slug: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  isPublished: boolean;
  designSettings?: PageDesignSettings;
  createdAt: Date;
  updatedAt: Date;
}

const PageSchema = new Schema<IPage>(
  {
    title: {
      type: String,
      required: [true, 'Page title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Page slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'],
    },
    content: {
      type: String,
      required: [true, 'Page content is required'],
      trim: true,
    },
    seoTitle: {
      type: String,
      trim: true,
      maxlength: [60, 'SEO title should not exceed 60 characters'],
    },
    seoDescription: {
      type: String,
      trim: true,
      maxlength: [160, 'SEO description should not exceed 160 characters'],
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    designSettings: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PageSchema.index({ isPublished: 1 });

const Page: Model<IPage> = mongoose.models.Page || mongoose.model<IPage>('Page', PageSchema);

export default Page;

