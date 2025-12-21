import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IAgentLocation extends Document {
  agentId: Types.ObjectId;
  latitude: number;
  longitude: number;
  address?: string; // Reverse geocoded address
  city?: string;
  area?: string;
  pincode?: string;
  isOnline: boolean;
  lastSeen: Date;
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AgentLocationSchema = new Schema<IAgentLocation>(
  {
    agentId: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
      required: true,
      unique: true, // One location record per agent
      index: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    area: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
    isOnline: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
      index: true,
    },
    deviceInfo: {
      userAgent: String,
      platform: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
AgentLocationSchema.index({ agentId: 1, lastSeen: -1 });
AgentLocationSchema.index({ isOnline: 1, lastSeen: -1 });

// Auto-update isOnline based on lastSeen (if last seen > 5 minutes ago, mark as offline)
AgentLocationSchema.pre('save', function (next) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (this.lastSeen < fiveMinutesAgo) {
    this.isOnline = false;
  }
  next();
});

const AgentLocation: Model<IAgentLocation> =
  mongoose.models.AgentLocation || mongoose.model<IAgentLocation>('AgentLocation', AgentLocationSchema);

export default AgentLocation;


