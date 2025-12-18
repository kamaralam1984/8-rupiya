import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IShopper extends Document {
  name: string;
  phone: string;
  email: string;
  passwordHash: string;
  shopperCode: string; // Unique shopper identifier
  isActive: boolean;
  isVerified: boolean;
  totalShops: number;
  createdAt: Date;
  updatedAt: Date; // Added for timestamps
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const ShopperSchema = new Schema<IShopper>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^(\+91|91)?[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian phone number'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    shopperCode: {
      type: String,
      required: false, // Will be generated in pre-save hook
      unique: true,
      trim: true,
      uppercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    totalShops: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
ShopperSchema.pre('save', async function (next) {
  if (this.isModified('passwordHash')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    } catch (error: any) {
      return next(error);
    }
  }
  next();
});

// Generate unique shopper code before saving (must run after password hashing)
ShopperSchema.pre('save', async function (next) {
  // Only generate code for new documents and if code doesn't exist
  if (!this.isNew || this.shopperCode) {
    return next();
  }

  try {
    // Use this.constructor to get the model
    const ShopperModel = this.constructor as Model<IShopper>;
    
    if (!ShopperModel || typeof ShopperModel.findOne !== 'function') {
      // Fallback: use mongoose.models
      const model = mongoose.models.Shopper || mongoose.model<IShopper>('Shopper', ShopperSchema);
      if (!model) {
        return next(new Error('Shopper model not available'));
      }
      return generateCode(this, model, next);
    }
    
    return generateCode(this, ShopperModel, next);
  } catch (error: any) {
    console.error('Error in shopper code generation hook:', error);
    return next(error);
  }
});

// Helper function to generate shopper code
async function generateCode(doc: any, ShopperModel: Model<IShopper>, next: Function) {
  try {
    let codeExists = true;
    let shopperCode = '';
    let counter = 1;
    let maxAttempts = 1000;

    while (codeExists && counter < maxAttempts) {
      shopperCode = `SH${String(counter).padStart(4, '0')}`;
      try {
        const existing = await ShopperModel.findOne({ shopperCode }).lean();
        if (!existing) {
          codeExists = false;
        } else {
          counter++;
        }
      } catch (queryError: any) {
        console.error('Error querying for shopper code:', queryError);
        counter++;
        if (counter >= maxAttempts) {
          return next(new Error('Failed to generate unique shopper code'));
        }
      }
    }

    if (counter >= maxAttempts) {
      return next(new Error('Failed to generate unique shopper code after maximum attempts'));
    }

    doc.shopperCode = shopperCode;
    next();
  } catch (error: any) {
    console.error('Error generating shopper code:', error);
    next(error);
  }
}

// Method to compare password
ShopperSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const Shopper: Model<IShopper> = mongoose.models.Shopper || mongoose.model<IShopper>('Shopper', ShopperSchema);

export default Shopper;

