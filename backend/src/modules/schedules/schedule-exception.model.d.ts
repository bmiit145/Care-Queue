import mongoose, { Document } from 'mongoose';
export interface IScheduleException extends Document {
    organizationId: mongoose.Types.ObjectId;
    practitionerId: mongoose.Types.ObjectId;
    date: Date;
    reason: string;
    isAvailable: boolean;
    startTime?: string;
    endTime?: string;
}
declare const _default: mongoose.Model<IScheduleException, {}, {}, {}, mongoose.Document<unknown, {}, IScheduleException, {}, mongoose.DefaultSchemaOptions> & IScheduleException & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IScheduleException>;
export default _default;
//# sourceMappingURL=schedule-exception.model.d.ts.map
