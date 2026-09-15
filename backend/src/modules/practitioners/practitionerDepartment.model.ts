/**
 * PractitionerDepartment — many-to-many junction model.
 *
 * A practitioner can belong to multiple departments and may offer a subset
 * of services within each department.
 */
import mongoose, { Schema } from 'mongoose';

export interface IPractitionerDepartment {
  organizationId: mongoose.Types.ObjectId;
  practitionerId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  serviceIds: mongoose.Types.ObjectId[];
  slotDurationMin?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PractitionerDepartmentSchema = new Schema<IPractitionerDepartment>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    practitionerId: { type: Schema.Types.ObjectId, ref: 'Practitioner', required: true, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    serviceIds: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
    slotDurationMin: { type: Number, min: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

PractitionerDepartmentSchema.index(
  { organizationId: 1, practitionerId: 1, departmentId: 1 },
  { unique: true }
);

export const PractitionerDepartment = mongoose.model<IPractitionerDepartment>(
  'PractitionerDepartment',
  PractitionerDepartmentSchema
);
