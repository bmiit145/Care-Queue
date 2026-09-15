import mongoose, { Document } from 'mongoose';
export interface IQueueEntry extends Document {
    organizationId: mongoose.Types.ObjectId;
    locationId?: mongoose.Types.ObjectId;
    departmentId?: mongoose.Types.ObjectId;
    practitionerId?: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    checkInId?: mongoose.Types.ObjectId;
    appointmentId?: mongoose.Types.ObjectId;
    queueId: mongoose.Types.ObjectId;
    tokenNumber: string;
    queueDate: Date;
    status: string;
    priority: string;
    joinedAt: Date;
    calledAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const QueueEntry: mongoose.Model<IQueueEntry, {}, {}, {}, mongoose.Document<unknown, {}, IQueueEntry, {}, mongoose.DefaultSchemaOptions> & IQueueEntry & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IQueueEntry>;
//# sourceMappingURL=queueEntry.model.d.ts.map