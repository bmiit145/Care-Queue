import mongoose, { Document } from 'mongoose';
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
export declare const Patient: mongoose.Model<IPatient, {}, {}, {}, mongoose.Document<unknown, {}, IPatient, {}, mongoose.DefaultSchemaOptions> & IPatient & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IPatient>;
//# sourceMappingURL=patient.model.d.ts.map
