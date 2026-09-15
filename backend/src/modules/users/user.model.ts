import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Roles as defined in docs/phase-1-architecture.md § 13
 * PLATFORM_ADMIN  — Care-Queue platform owner, manages all tenants
 * ORG_ADMIN       — Hospital / clinic administrator for one tenant
 * RECEPTIONIST    — Front-desk staff: check-in, queue, appointments
 * PRACTITIONER    — Doctor / dentist / physiotherapist etc. (generic per § 10)
 * STAFF           — General support staff
 * PATIENT         — Mobile-app patient user
 */
export const USER_ROLES = [
  'PLATFORM_ADMIN',
  'ORG_ADMIN',
  'RECEPTIONIST',
  'PRACTITIONER',
  'STAFF',
  'PATIENT',
] as const;

export type UserRole = typeof USER_ROLES[number];

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  organizationId?: mongoose.Types.ObjectId; // primary org for org-scoped roles
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email:        { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    firstName:    { type: String, required: true, trim: true },
    lastName:     { type: String, required: true, trim: true },
    phone:        { type: String },
    role:         { type: String, enum: USER_ROLES, required: true, default: 'PATIENT' },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Instance method — compare plain password against stored hash
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', UserSchema);
