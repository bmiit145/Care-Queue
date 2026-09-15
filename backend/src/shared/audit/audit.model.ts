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

import mongoose, { Document, Schema } from 'mongoose';

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

const AuditLogSchema = new Schema<IAuditLog>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    actorUserId:    { type: String, required: true, index: true },
    actorRole:      { type: String, required: true },
    action:         { type: String, required: true, index: true },
    entityType:     { type: String, required: true, index: true },
    entityId:       { type: String, required: true },
    metadata:       { type: Schema.Types.Mixed },
    ipAddress:      { type: String },
    timestamp:      { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,         // We use our own `timestamp` field
    capped: { size: 104857600, max: 500000 },  // 100MB cap — prevents unbounded growth in dev
  }
);

// TTL index: auto-delete logs older than 365 days (configurable via env)
const AUDIT_RETENTION_DAYS = parseInt(process.env.AUDIT_RETENTION_DAYS || '365', 10);
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: AUDIT_RETENTION_DAYS * 86400 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
