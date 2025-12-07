import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'user' | 'admin' | 'editor' | 'operator';
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    phone: {
      type: String,
      required: false, // Phone is optional
      unique: true,
      sparse: true, // Allow multiple null values (for unique constraint)
      trim: true,
      validate: {
        validator: function(v: string | undefined) {
          // If phone is provided, validate it; otherwise allow empty
          if (!v || v.trim() === '') return true;
          // Accept Indian phone numbers: +91XXXXXXXXXX or 0XXXXXXXXXX or XXXXXXXXXX
          return /^(\+91|91|0)?[6-9]\d{9}$/.test(v.replace(/\s+/g, ''));
        },
        message: 'Please provide a valid phone number (Indian format: +91XXXXXXXXXX or 0XXXXXXXXXX)',
      },
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'editor', 'operator'],
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) {
    throw new Error('Password field is not available. Please select password field in query.');
  }
  if (!candidatePassword) {
    return false;
  }
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error: any) {
    console.error('bcrypt.compare error:', error);
    throw new Error('Password comparison failed');
  }
};

// Note: Indexes are automatically created by unique: true in schema fields above
// No need to explicitly create them again to avoid duplicate index warnings

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;


