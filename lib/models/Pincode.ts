import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPincode extends Document {
  pincode: string; // 6-digit pincode
  area: string; // Area name
  createdAt: Date;
  updatedAt: Date;
}

const PincodeSchema = new Schema<IPincode>(
  {
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
      match: [/^\d{6}$/, 'Pincode must be 6 digits'],
    },
    area: {
      type: String,
      required: [true, 'Area is required'],
      trim: true,
      maxlength: [100, 'Area cannot exceed 100 characters'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: same pincode + same area = unique entry
// Different areas with same pincode = different entries
PincodeSchema.index({ pincode: 1, area: 1 }, { unique: true });

// Index for faster pincode lookups
PincodeSchema.index({ pincode: 1 });

const Pincode: Model<IPincode> = mongoose.models.Pincode || mongoose.model<IPincode>('Pincode', PincodeSchema);

export default Pincode;

