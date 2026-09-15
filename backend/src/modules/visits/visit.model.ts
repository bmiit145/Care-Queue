import mongoose, { Schema } from 'mongoose';

export interface IVisit {
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

const VisitSchema = new Schema<IVisit>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location' },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    practitionerId: { type: Schema.Types.ObjectId, ref: 'Practitioner' },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    checkInId: { type: Schema.Types.ObjectId, ref: 'CheckIn' },
    queueEntryId: { type: Schema.Types.ObjectId, ref: 'QueueEntry' },
    status: {
      type: String,
      enum: ['CREATED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'CREATED',
    },
    startedAt: { type: Date },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

export const Visit = mongoose.model<IVisit>('Visit', VisitSchema);
