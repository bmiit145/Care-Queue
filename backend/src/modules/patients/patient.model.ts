import mongoose, { Document, Schema } from 'mongoose';

export interface IPatient extends Document {
  organizationId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email?: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    mobileNumber: { type: String, required: true, index: true },
    email: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] },
    address: { type: String },
    emergencyContact: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Patient = mongoose.model<IPatient>('Patient', PatientSchema);
