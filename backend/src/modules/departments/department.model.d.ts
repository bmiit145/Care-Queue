import mongoose, { Document } from 'mongoose';
export interface IDepartment extends Document {
    organizationId: mongoose.Types.ObjectId;
    locationId?: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Department: mongoose.Model<IDepartment, {}, {}, {}, mongoose.Document<unknown, {}, IDepartment, {}, mongoose.DefaultSchemaOptions> & IDepartment & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IDepartment>;
//# sourceMappingURL=department.model.d.ts.map