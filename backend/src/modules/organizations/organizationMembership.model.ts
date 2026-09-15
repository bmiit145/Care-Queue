import mongoose, { Schema } from 'mongoose';

export interface IOrganizationMembership {
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  roles: string[];
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

OrganizationMembershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

export const OrganizationMembership = mongoose.model<IOrganizationMembership>(
  'OrganizationMembership',
  OrganizationMembershipSchema
);
