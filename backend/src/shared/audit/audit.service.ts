import { AuditLog } from './audit.model';

interface AuditLogPayload {
  organizationId?: string;
  actorUserId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export class AuditService {
  /**
   * Fire-and-forget audit logger.
   * Does not throw or block the main thread to ensure high availability.
   */
  static async log(payload: AuditLogPayload): Promise<void> {
    try {
      // In a high-throughput enterprise system, this might push to a pub/sub queue (e.g., Kafka)
      // For Phase 1, we write directly to the capped Mongo collection.
      await AuditLog.create(payload);
    } catch (error) {
      // Log to stderr but do not crash the request
      console.error('[AUDIT_ERROR] Failed to write audit log:', error, payload);
    }
  }
}
