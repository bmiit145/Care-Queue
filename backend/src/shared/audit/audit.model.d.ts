/**
 * Audit Log — enterprise healthcare audit trail.
 *
 * Records WHO changed WHAT, WHEN, and the before/after state.
 *
 * Architecture:
 *   organizationId — tenant scoping
 *   actorUserId    — the user who performed the action
 *   actorRole      — their role at time of action
 *   action         — verb (CREATE, UPDATE, STATUS_CHANGE, DELETE, LOGIN, etc.)
 *   entityType     — Appointment, QueueEntry, Visit, Patient, etc.
 *   entityId       — the specific document _id
 *   metadata       — freeform context (previous status, new status, etc.)
 *   ipAddress      — request origin
 *   timestamp      — server time
 */
import mongoose, { Document } from 'mongoose';
export interface IAuditLog extends Document {
    organizationId?: mongoose.Types.ObjectId;
    actorUserId: string;
    actorRole: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    timestamp: Date;
}
export declare const AuditLog: mongoose.Model<IAuditLog, {}, {}, {}, mongoose.Document<unknown, {}, IAuditLog, {}, mongoose.DefaultSchemaOptions> & IAuditLog & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IAuditLog>;
//# sourceMappingURL=audit.model.d.ts.map