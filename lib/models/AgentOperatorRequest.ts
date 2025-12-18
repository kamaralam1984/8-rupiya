import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IAgentOperatorRequest extends Document {
  agentId: Types.ObjectId;
  operatorId: Types.ObjectId;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedBy: Types.ObjectId; // Operator who requested
  approvedBy?: Types.ObjectId; // Admin who approved/rejected
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AgentOperatorRequestSchema = new Schema<IAgentOperatorRequest>(
  {
    agentId: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
      required: true,
      index: true,
    },
    operatorId: {
      type: Schema.Types.ObjectId,
      ref: 'Operator',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Operator',
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Admin user
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate pending requests
AgentOperatorRequestSchema.index({ agentId: 1, operatorId: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'PENDING' } });

const AgentOperatorRequest: Model<IAgentOperatorRequest> = 
  mongoose.models.AgentOperatorRequest || 
  mongoose.model<IAgentOperatorRequest>('AgentOperatorRequest', AgentOperatorRequestSchema);

export default AgentOperatorRequest;



