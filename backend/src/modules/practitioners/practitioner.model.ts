import mongoose, { Document, Schema } from 'mongoose';

export interface IPractitioner extends Document {
  organizationId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId; // Optional if Practitioner doesn't log in
  firstName: string;
  lastName: string;
  type: string; // 'DOCTOR', 'DENTIST', 'PHYSIOTHERAPIST', etc.
  specializations: string[];
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PractitionerSchema = new Schema<IPractitioner>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    type: { type: String, required: true, enum: ['DOCTOR', 'DENTIST', 'PHYSIOTHERAPIST', 'PSYCHOLOGIST', 'OTHER'] },
    specializations: [{ type: String }],
    contactEmail: { type: String },
    contactPhone: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Practitioner = mongoose.model<IPractitioner>('Practitioner', PractitionerSchema);
