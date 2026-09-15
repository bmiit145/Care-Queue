import mongoose, { Document } from 'mongoose';
export interface ILocation extends Document {
    organizationId: mongoose.Types.ObjectId;
    name: string;
    type: string;
    address?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Location: mongoose.Model<ILocation, {}, {}, {}, mongoose.Document<unknown, {}, ILocation, {}, mongoose.DefaultSchemaOptions> & ILocation & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ILocation>;
//# sourceMappingURL=location.model.d.ts.map