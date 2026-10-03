import { Schema, model } from 'mongoose';

export interface IOtpChallenge {
  phone: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

const OtpChallengeSchema = new Schema<IOtpChallenge>(
  {
    phone: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true, expires: 0 },
    attempts: { type: Number, required: true, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const OtpChallenge = model<IOtpChallenge>('OtpChallenge', OtpChallengeSchema);