import mongoose, { Document } from 'mongoose';
/**
 * Roles as defined in docs/phase-1-architecture.md § 13
 * PLATFORM_ADMIN  — Care-Queue platform owner, manages all tenants
 * ORG_ADMIN       — Hospital / clinic administrator for one tenant
 * RECEPTIONIST    — Front-desk staff: check-in, queue, appointments
 * PRACTITIONER    — Doctor / dentist / physiotherapist etc. (generic per § 10)
 * STAFF           — General support staff
 * PATIENT         — Mobile-app patient user
 */
export declare const USER_ROLES: readonly ["PLATFORM_ADMIN", "ORG_ADMIN", "RECEPTIONIST", "PRACTITIONER", "STAFF", "PATIENT"];
export type UserRole = typeof USER_ROLES[number];
export interface IUser extends Document {
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
    comparePassword(candidatePassword: string): Promise<boolean>;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, mongoose.DefaultSchemaOptions> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IUser>;
//# sourceMappingURL=user.model.d.ts.map