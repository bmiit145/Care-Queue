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
  email?: string;
  passwordHash?: string;
  firstName?: string | null;
  lastName?: string | null;
  age?: number | null;
  gender?: string | null;
  phone?: string;
  profileCompleted: boolean;
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
    email: { type: String, unique: true, sparse: true, lowercase: true, index: true, trim: true },
    passwordHash: { type: String },
    firstName: { type: String, trim: true, default: null },
    lastName: { type: String, trim: true, default: null },
    age: { type: Number, default: null },
    gender: { type: String, default: null },
    phone: { type: String, unique: true, sparse: true, trim: true },
    profileCompleted: { type: Boolean, default: false },
    role: { type: String, enum: USER_ROLES, required: true, default: 'PATIENT' },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    methods: {
      comparePassword(candidatePassword: string): Promise<boolean> {
        return this.passwordHash ? bcrypt.compare(candidatePassword, this.passwordHash) : Promise.resolve(false);
      },
    },
  }
);

export const User = mongoose.model<IUser, UserModel>('User', UserSchema);
