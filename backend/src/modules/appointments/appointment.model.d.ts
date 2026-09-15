import mongoose, { Document } from 'mongoose';
export interface IAppointment extends Document {
    organizationId: mongoose.Types.ObjectId;
    locationId?: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    practitionerId?: mongoose.Types.ObjectId;
    departmentId?: mongoose.Types.ObjectId;
    serviceId?: mongoose.Types.ObjectId;
    date: Date;
    scheduledStartTime?: Date;
    scheduledEndTime?: Date;
    status: string;
    source: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Appointment: mongoose.Model<IAppointment, {}, {}, {}, mongoose.Document<unknown, {}, IAppointment, {}, mongoose.DefaultSchemaOptions> & IAppointment & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IAppointment>;
//# sourceMappingURL=appointment.model.d.ts.map