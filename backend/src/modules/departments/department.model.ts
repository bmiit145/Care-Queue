import mongoose, { Schema } from 'mongoose';

export interface IDepartment {
  organizationId: mongoose.Types.ObjectId;
  locationId?: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', index: true },
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Department = mongoose.model<IDepartment>('Department', DepartmentSchema);
