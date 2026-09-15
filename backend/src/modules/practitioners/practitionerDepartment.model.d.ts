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
import mongoose, { Document } from 'mongoose';
export interface IPractitionerDepartment extends Document {
    organizationId: mongoose.Types.ObjectId;
    practitionerId: mongoose.Types.ObjectId;
    departmentId: mongoose.Types.ObjectId;
    /** Services this practitioner provides within this department */
    serviceIds: mongoose.Types.ObjectId[];
    /** Appointment slot duration override for this dept (minutes) */
    slotDurationMin?: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const PractitionerDepartment: mongoose.Model<IPractitionerDepartment, {}, {}, {}, mongoose.Document<unknown, {}, IPractitionerDepartment, {}, mongoose.DefaultSchemaOptions> & IPractitionerDepartment & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IPractitionerDepartment>;
//# sourceMappingURL=practitionerDepartment.model.d.ts.map
