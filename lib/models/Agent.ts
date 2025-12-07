import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAgent extends Document {
  name: string;
  phone: string;
  email: string;
  passwordHash: string;
  agentCode: string; // Unique agent identifier
  agentPanelText?: string; // Text to display in agent panel
  agentPanelTextColor?: 'red' | 'green' | 'blue' | 'black'; // Text color for agent panel
  totalShops: number;
  totalEarnings: number; // Total commission earned
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AgentSchema = new Schema<IAgent>(
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
      match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number'],
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
    agentCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    agentPanelText: {
      type: String,
      trim: true,
      maxlength: [500, 'Agent panel text cannot exceed 500 characters'],
    },
    agentPanelTextColor: {
      type: String,
      enum: ['red', 'green', 'blue', 'black'],
      default: 'black',
    },
    totalShops: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
AgentSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
AgentSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Indexes
AgentSchema.index({ agentCode: 1 });
AgentSchema.index({ phone: 1 });
AgentSchema.index({ email: 1 });

const Agent: Model<IAgent> = mongoose.models.Agent || mongoose.model<IAgent>('Agent', AgentSchema);

export default Agent;


