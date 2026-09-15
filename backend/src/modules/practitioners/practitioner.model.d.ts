import mongoose, { Document } from 'mongoose';
export interface IPractitioner extends Document {
    organizationId: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    firstName: string;
    lastName: string;
    type: string;
    specializations: string[];
    contactEmail?: string;
    contactPhone?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Practitioner: mongoose.Model<IPractitioner, {}, {}, {}, mongoose.Document<unknown, {}, IPractitioner, {}, mongoose.DefaultSchemaOptions> & IPractitioner & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IPractitioner>;
//# sourceMappingURL=practitioner.model.d.ts.map
