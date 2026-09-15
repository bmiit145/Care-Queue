import mongoose, { Document } from 'mongoose';
export interface IService extends Document {
    organizationId: mongoose.Types.ObjectId;
    departmentId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    durationInMinutes: number;
    price?: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Service: mongoose.Model<IService, {}, {}, {}, mongoose.Document<unknown, {}, IService, {}, mongoose.DefaultSchemaOptions> & IService & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IService>;
//# sourceMappingURL=service.model.d.ts.map