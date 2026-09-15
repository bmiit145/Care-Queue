import mongoose, { Schema } from 'mongoose';

export interface ILocation {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  type: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    address: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Location = mongoose.model<ILocation>('Location', LocationSchema);
