import { Schema, model } from 'mongoose';
import { SELF_SERVICE_ROLES, UserRole } from '../users/user.model';

export interface IOtpChallenge {
  phone: string;
  role: UserRole;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

const OtpChallengeSchema = new Schema<IOtpChallenge>(
  {
    phone: { type: String, required: true, index: true },
    role: { type: String, enum: SELF_SERVICE_ROLES, required: true, default: 'PATIENT' },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true, expires: 0 },
    attempts: { type: Number, required: true, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const OtpChallenge = model<IOtpChallenge>('OtpChallenge', OtpChallengeSchema);