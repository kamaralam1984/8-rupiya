import mongoose, { Schema, Document } from 'mongoose';

export interface ILogo extends Document {
  businessName: string;
  tagline?: string;
  logoType: 'text' | 'icon' | 'combination';
  layout: 'horizontal' | 'vertical' | 'stacked';
  colors: {
    primary: string;
    secondary?: string;
    background?: string;
  };
  fonts: {
    primary: string;
    secondary?: string;
  };
  icon?: string; // Icon name or URL
  iconUrl?: string; // Custom icon image URL
  imageUrl?: string; // Custom image URL for logo background
  iconPosition: 'left' | 'right' | 'top' | 'bottom' | 'center';
  style: string; // Logo style template name
  textAlignment: 'left' | 'center' | 'right';
  spacing: number;
  borderRadius: number;
  borderWidth: number;
  borderColor?: string;
  shadow: boolean;
  gradient: boolean;
  gradientColors?: string[];
  // Generated logo files
  logoUrl?: string; // PNG/JPG URL
  logoSvgUrl?: string; // SVG URL
  logoPdfUrl?: string; // PDF URL
  logoEpsUrl?: string; // EPS URL
  // Metadata
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

const LogoSchema = new Schema<ILogo>(
  {
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    tagline: {
      type: String,
      trim: true,
    },
    logoType: {
      type: String,
      enum: ['text', 'icon', 'combination'],
      default: 'combination',
    },
    layout: {
      type: String,
      enum: ['horizontal', 'vertical', 'stacked'],
      default: 'horizontal',
    },
    colors: {
      primary: {
        type: String,
        required: true,
        default: '#000000',
      },
      secondary: {
        type: String,
      },
      background: {
        type: String,
        default: '#FFFFFF',
      },
    },
    fonts: {
      primary: {
        type: String,
        required: true,
        default: 'Arial',
      },
      secondary: {
        type: String,
      },
    },
    icon: {
      type: String,
    },
    iconUrl: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
    iconPosition: {
      type: String,
      enum: ['left', 'right', 'top', 'bottom', 'center'],
      default: 'left',
    },
    style: {
      type: String,
      default: 'modern',
    },
    textAlignment: {
      type: String,
      enum: ['left', 'center', 'right'],
      default: 'center',
    },
    spacing: {
      type: Number,
      default: 10,
    },
    borderRadius: {
      type: Number,
      default: 0,
    },
    borderWidth: {
      type: Number,
      default: 0,
    },
    borderColor: {
      type: String,
    },
    shadow: {
      type: Boolean,
      default: false,
    },
    gradient: {
      type: Boolean,
      default: false,
    },
    gradientColors: {
      type: [String],
    },
    logoUrl: {
      type: String,
    },
    logoSvgUrl: {
      type: String,
    },
    logoPdfUrl: {
      type: String,
    },
    logoEpsUrl: {
      type: String,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
LogoSchema.index({ businessName: 1 });
LogoSchema.index({ createdBy: 1 });
LogoSchema.index({ isActive: 1 });

export default mongoose.models.Logo || mongoose.model<ILogo>('Logo', LogoSchema);

