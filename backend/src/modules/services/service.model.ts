import mongoose, { Schema } from 'mongoose';

export interface IService {
  organizationId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  durationInMinutes: number;
  price?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    durationInMinutes: { type: Number, required: true, default: 15 },
    price: { type: Number },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Service = mongoose.model<IService>('Service', ServiceSchema);
