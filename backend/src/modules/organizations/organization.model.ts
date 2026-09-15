import mongoose, { Schema } from 'mongoose';

export interface IOrganization {
  name: string;
  type: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['HOSPITAL', 'CLINIC', 'PRIVATE_PRACTICE', 'DIAGNOSTIC_CENTER', 'HEALTHCARE_CENTER'],
    },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String },
    address: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
