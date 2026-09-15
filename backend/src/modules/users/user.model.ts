import mongoose, { Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export const USER_ROLES = [
  'PLATFORM_ADMIN',
  'ORG_ADMIN',
  'RECEPTIONIST',
  'PRACTITIONER',
  'STAFF',
  'PATIENT',
] as const;

export type UserRole = typeof USER_ROLES[number];

export interface IUser {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  organizationId?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

type UserModel = Model<IUser, {}, IUserMethods>;

const UserSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true, trim: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    role: { type: String, enum: USER_ROLES, required: true, default: 'PATIENT' },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    methods: {
      comparePassword(candidatePassword: string): Promise<boolean> {
        return bcrypt.compare(candidatePassword, this.passwordHash);
      },
    },
  }
);

export const User = mongoose.model<IUser, UserModel>('User', UserSchema);
