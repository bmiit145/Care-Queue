import mongoose, { Schema } from 'mongoose';

export interface ICheckIn {
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

const CheckInSchema = new Schema<ICheckIn>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location' },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    checkInTime: { type: Date, required: true, default: Date.now },
    source: { type: String, enum: ['KIOSK', 'RECEPTION', 'MOBILE'], default: 'RECEPTION' },
    status: { type: String, enum: ['COMPLETED', 'CANCELLED'], default: 'COMPLETED' },
  },
  { timestamps: true }
);

export const CheckIn = mongoose.model<ICheckIn>('CheckIn', CheckInSchema);
