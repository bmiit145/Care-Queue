import mongoose, { Document } from 'mongoose';
export interface ISchedule extends Document {
    organizationId: mongoose.Types.ObjectId;
    locationId?: mongoose.Types.ObjectId;
    practitionerId: mongoose.Types.ObjectId;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    departmentId?: mongoose.Types.ObjectId;
    isActive: boolean;
}
declare const _default: mongoose.Model<ISchedule, {}, {}, {}, mongoose.Document<unknown, {}, ISchedule, {}, mongoose.DefaultSchemaOptions> & ISchedule & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ISchedule>;
export default _default;
//# sourceMappingURL=schedule.model.d.ts.map