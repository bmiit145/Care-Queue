import mongoose, { Document } from 'mongoose';
export interface IVisit extends Document {
    organizationId: mongoose.Types.ObjectId;
    locationId?: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    practitionerId?: mongoose.Types.ObjectId;
    departmentId?: mongoose.Types.ObjectId;
    serviceId?: mongoose.Types.ObjectId;
    appointmentId?: mongoose.Types.ObjectId;
    checkInId?: mongoose.Types.ObjectId;
    queueEntryId?: mongoose.Types.ObjectId;
    status: string;
    startedAt?: Date;
    endedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Visit: mongoose.Model<IVisit, {}, {}, {}, mongoose.Document<unknown, {}, IVisit, {}, mongoose.DefaultSchemaOptions> & IVisit & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IVisit>;
//# sourceMappingURL=visit.model.d.ts.map