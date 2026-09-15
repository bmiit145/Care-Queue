import mongoose, { Schema } from 'mongoose';

export interface ISchedule {
  organizationId: mongoose.Types.ObjectId;
  locationId?: mongoose.Types.ObjectId;
  practitionerId: mongoose.Types.ObjectId;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  departmentId?: mongoose.Types.ObjectId;
  isActive: boolean;
}

const ScheduleSchema = new Schema<ISchedule>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location' },
    practitionerId: { type: Schema.Types.ObjectId, ref: 'Practitioner', required: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ScheduleSchema.index({ practitionerId: 1, dayOfWeek: 1 });

export default mongoose.model<ISchedule>('Schedule', ScheduleSchema);
