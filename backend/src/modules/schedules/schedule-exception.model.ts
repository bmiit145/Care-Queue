import mongoose, { Schema } from 'mongoose';

export interface IScheduleException {
  organizationId: mongoose.Types.ObjectId;
  practitionerId: mongoose.Types.ObjectId;
  date: Date;
  reason: string;
  isAvailable: boolean;
  startTime?: string;
  endTime?: string;
}

const ScheduleExceptionSchema = new Schema<IScheduleException>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    practitionerId: { type: Schema.Types.ObjectId, ref: 'Practitioner', required: true },
    date: { type: Date, required: true },
    reason: { type: String, required: true },
    isAvailable: { type: Boolean, required: true },
    startTime: { type: String },
    endTime: { type: String },
  },
  { timestamps: true }
);

ScheduleExceptionSchema.index({ practitionerId: 1, date: 1 });

export default mongoose.model<IScheduleException>('ScheduleException', ScheduleExceptionSchema);
