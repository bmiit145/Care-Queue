import mongoose from 'mongoose';

export interface TenantUserContext {
  id: string;
  role: string;
  organizationId: string;
}

export function toObjectId(value: string, fieldName = 'id'): mongoose.Types.ObjectId {
  if (!mongoose.isValidObjectId(value)) {
    throw new Error(`Invalid ${fieldName}`);
  }
  return new mongoose.Types.ObjectId(value);
}
