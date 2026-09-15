import mongoose, { Document, Schema } from 'mongoose';

export interface IOrganizationMembership extends Document {
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  roles: string[]; // e.g., 'ORG_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'STAFF'
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationMembershipSchema = new Schema<IOrganizationMembership>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    roles: [{ type: String, enum: ['ORG_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'STAFF'] }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// A user should only have one membership document per organization
OrganizationMembershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

export const OrganizationMembership = mongoose.model<IOrganizationMembership>('OrganizationMembership', OrganizationMembershipSchema);
