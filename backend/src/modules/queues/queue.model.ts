import mongoose, { Schema } from 'mongoose';

export interface IQueue {
  organizationId: mongoose.Types.ObjectId;
  locationId?: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  practitionerId?: mongoose.Types.ObjectId;
  serviceId?: mongoose.Types.ObjectId;
  name: string;
  currentTokenNumber: number;
  queueDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QueueSchema = new Schema<IQueue>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location' },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    practitionerId: { type: Schema.Types.ObjectId, ref: 'Practitioner' },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
    name: { type: String, required: true },
    currentTokenNumber: { type: Number, default: 0 },
    queueDate: { type: Date, required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Queue = mongoose.model<IQueue>('Queue', QueueSchema);
