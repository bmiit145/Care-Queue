import mongoose, { Document } from 'mongoose';
export interface IQueue extends Document {
    organizationId: mongoose.Types.ObjectId;
    locationId?: mongoose.Types.ObjectId;
    departmentId?: mongoose.Types.ObjectId;
    practitionerId?: mongoose.Types.ObjectId;
    serviceId?: mongoose.Types.ObjectId;
    name: string;
    currentTokenNumber: number;
    queueDate: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Queue: mongoose.Model<IQueue, {}, {}, {}, mongoose.Document<unknown, {}, IQueue, {}, mongoose.DefaultSchemaOptions> & IQueue & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IQueue>;
//# sourceMappingURL=queue.model.d.ts.map
