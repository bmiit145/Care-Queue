/**
 * PractitionerDepartment — many-to-many junction model.
 *
 * Architecture requirement:
 *   Dr. Patel → Cardiology (Consultation, ECG)
 *   Dr. Patel → General Medicine (Consultation)
 *
 * This replaces a single `departmentId` field on the Practitioner model.
 * A practitioner can belong to multiple departments; per department they
 * may offer a subset of services.
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IPractitionerDepartment extends Document {
  organizationId: mongoose.Types.ObjectId;
  practitionerId: mongoose.Types.ObjectId;
  departmentId:   mongoose.Types.ObjectId;
  /** Services this practitioner provides within this department */
  serviceIds:     mongoose.Types.ObjectId[];
  /** Appointment slot duration override for this dept (minutes) */
  slotDurationMin?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PractitionerDepartmentSchema = new Schema<IPractitionerDepartment>(
  {
    organizationId:  { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    practitionerId:  { type: Schema.Types.ObjectId, ref: 'Practitioner', required: true, index: true },
    departmentId:    { type: Schema.Types.ObjectId, ref: 'Department',   required: true, index: true },
    serviceIds:      [{ type: Schema.Types.ObjectId, ref: 'Service' }],
    slotDurationMin: { type: Number, min: 1 },
    isActive:        { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Unique compound index — one practitioner can have ONE record per department per org
PractitionerDepartmentSchema.index(
  { organizationId: 1, practitionerId: 1, departmentId: 1 },
  { unique: true }
);

export const PractitionerDepartment = mongoose.model<IPractitionerDepartment>(
  'PractitionerDepartment',
  PractitionerDepartmentSchema
);
