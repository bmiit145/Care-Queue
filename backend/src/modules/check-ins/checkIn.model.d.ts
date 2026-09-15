import mongoose, { Document } from 'mongoose';
export interface ICheckIn extends Document {
    organizationId: mongoose.Types.ObjectId;
    locationId?: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    appointmentId?: mongoose.Types.ObjectId;
    checkInTime: Date;
    source: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const CheckIn: mongoose.Model<ICheckIn, {}, {}, {}, mongoose.Document<unknown, {}, ICheckIn, {}, mongoose.DefaultSchemaOptions> & ICheckIn & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICheckIn>;
//# sourceMappingURL=checkIn.model.d.ts.map