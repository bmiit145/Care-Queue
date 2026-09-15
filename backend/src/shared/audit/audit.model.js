"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AuditLogSchema = new mongoose_1.Schema({
    organizationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Organization', index: true },
    actorUserId: { type: String, required: true, index: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
}, {
    timestamps: false, // We use our own `timestamp` field
    capped: { size: 104857600, max: 500000 }, // 100MB cap — prevents unbounded growth in dev
});
// TTL index: auto-delete logs older than 365 days (configurable via env)
const AUDIT_RETENTION_DAYS = parseInt(process.env.AUDIT_RETENTION_DAYS || '365', 10);
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: AUDIT_RETENTION_DAYS * 86400 });
exports.AuditLog = mongoose_1.default.model('AuditLog', AuditLogSchema);
//# sourceMappingURL=audit.model.js.map