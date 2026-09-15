import mongoose, { Document, Schema } from 'mongoose';

export interface IQueueEntry extends Document {
  organizationId: mongoose.Types.ObjectId;
  locationId?: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  practitionerId?: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  checkInId: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
  tokenNumber: string;
  queueDate: Date;
  status: string; // 'WAITING', 'IN_CONSULTATION', 'COMPLETED', 'SKIPPED', 'CANCELLED', 'NO_SHOW'
  joinedAt: Date;
  calledAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QueueEntrySchema = new Schema<IQueueEntry>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location' },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    practitionerId: { type: Schema.Types.ObjectId, ref: 'Practitioner' },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    checkInId: { type: Schema.Types.ObjectId, ref: 'CheckIn', required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    tokenNumber: { type: String, required: true },
    queueDate: { type: Date, required: true, index: true },
    status: { 
      type: String, 
      enum: ['WAITING', 'IN_CONSULTATION', 'COMPLETED', 'SKIPPED', 'CANCELLED', 'NO_SHOW'], 
      default: 'WAITING' 
    },
    joinedAt: { type: Date, default: Date.now },
    calledAt: { type: Date },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

export const QueueEntry = mongoose.model<IQueueEntry>('QueueEntry', QueueEntrySchema);
