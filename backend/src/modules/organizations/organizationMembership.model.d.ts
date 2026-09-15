import mongoose, { Document } from 'mongoose';
export interface IOrganizationMembership extends Document {
    organizationId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    roles: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const OrganizationMembership: mongoose.Model<IOrganizationMembership, {}, {}, {}, mongoose.Document<unknown, {}, IOrganizationMembership, {}, mongoose.DefaultSchemaOptions> & IOrganizationMembership & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IOrganizationMembership>;
//# sourceMappingURL=organizationMembership.model.d.ts.map