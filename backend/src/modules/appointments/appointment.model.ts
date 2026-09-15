import mongoose, { Document, Schema } from 'mongoose';

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
  status: string; // 'BOOKED', 'CONFIRMED', 'CHECKED_IN', 'IN_QUEUE', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'
  source: string; // 'ONLINE', 'WALK_IN', 'PHONE', 'RECEPTION', 'REFERRAL'
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location' },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    practitionerId: { type: Schema.Types.ObjectId, ref: 'Practitioner' },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
    date: { type: Date, required: true, index: true },
    scheduledStartTime: { type: Date },
    scheduledEndTime: { type: Date },
    status: { 
      type: String, 
      required: true, 
      enum: ['BOOKED', 'CONFIRMED', 'CHECKED_IN', 'IN_QUEUE', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'],
      default: 'BOOKED' 
    },
    source: { 
      type: String, 
      required: true, 
      enum: ['ONLINE', 'WALK_IN', 'PHONE', 'RECEPTION', 'REFERRAL'],
      default: 'ONLINE' 
    }
  },
  { timestamps: true }
);

export const Appointment = mongoose.model<IAppointment>('Appointment', AppointmentSchema);
