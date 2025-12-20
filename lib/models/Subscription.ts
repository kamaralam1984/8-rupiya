import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ISubscription extends Document {
  // User/Shop reference
  shopId: Types.ObjectId; // Reference to AgentShop
  agentId?: Types.ObjectId; // Reference to Agent (optional)
  shopperId?: Types.ObjectId; // Reference to Shopper (optional)
  
  // Plan details
  planType: 'BASIC' | 'PREMIUM' | 'FEATURED' | 'LEFT_BAR' | 'RIGHT_SIDE' | 'BOTTOM_RAIL' | 'BANNER' | 'HERO';
  planAmount: number; // Amount paid for this subscription
  
  // Subscription status
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  
  // Subscription dates
  startDate: Date; // When subscription started
  expiryDate: Date; // When subscription expires
  
  // Payment reference
  paymentId: Types.ObjectId; // Reference to Payment that activated this subscription
  
  // Metadata
  autoRenew: boolean; // Whether to auto-renew on expiry
  notes?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'AgentShop',
      required: true,
      index: true,
    },
    agentId: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
      index: true,
    },
    shopperId: {
      type: Schema.Types.ObjectId,
      ref: 'Shopper',
      index: true,
    },
    planType: {
      type: String,
      enum: ['BASIC', 'PREMIUM', 'FEATURED', 'LEFT_BAR', 'RIGHT_SIDE', 'BOTTOM_RAIL', 'BANNER', 'HERO'],
      required: true,
      index: true,
    },
    planAmount: {
      type: Number,
      required: true,
      min: [0, 'Plan amount cannot be negative'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING'],
      default: 'PENDING',
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    expiryDate: {
      type: Date,
      required: true,
      index: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
SubscriptionSchema.index({ shopId: 1, status: 1 });
SubscriptionSchema.index({ agentId: 1, status: 1 });
SubscriptionSchema.index({ shopperId: 1, status: 1 });
SubscriptionSchema.index({ status: 1, expiryDate: 1 });
SubscriptionSchema.index({ expiryDate: 1 }); // For finding expired subscriptions

// Method to check if subscription is active
SubscriptionSchema.methods.isActive = function(): boolean {
  const now = new Date();
  return this.status === 'ACTIVE' && 
         this.startDate <= now && 
         this.expiryDate >= now;
};

// Method to get days remaining
SubscriptionSchema.methods.getDaysRemaining = function(): number {
  if (this.status !== 'ACTIVE') return 0;
  const now = new Date();
  const diff = this.expiryDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const Subscription: Model<ISubscription> = mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

export default Subscription;



