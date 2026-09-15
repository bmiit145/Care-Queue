import mongoose, { Document } from 'mongoose';
export interface IOrganization extends Document {
    name: string;
    type: string;
    contactEmail: string;
    contactPhone?: string;
    address?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Organization: mongoose.Model<IOrganization, {}, {}, {}, mongoose.Document<unknown, {}, IOrganization, {}, mongoose.DefaultSchemaOptions> & IOrganization & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IOrganization>;
//# sourceMappingURL=organization.model.d.ts.map
