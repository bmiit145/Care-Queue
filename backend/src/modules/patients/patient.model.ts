import mongoose, { Schema } from 'mongoose';

export interface IPatient {
  organizationId: mongoose.Types.ObjectId;
  /**
   * The login identity this clinical record belongs to, when the patient has
   * one. Optional because reception creates records for walk-ins who will
   * never sign in. Without this link there is no way to answer "which patient
   * am I?", which is why /appointments/mine could never match a row.
   */
  userId?: mongoose.Types.ObjectId;
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
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
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

// One clinical record per login per organization. Partial so the many
// reception-created records that carry no userId are unaffected.
PatientSchema.index(
  { organizationId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { userId: { $exists: true } } }
);

export const Patient = mongoose.model<IPatient>('Patient', PatientSchema);
