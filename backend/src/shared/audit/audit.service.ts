import { AuditLog } from './audit.model';

interface AuditLogPayload {
  organizationId?: string | undefined;
  actorUserId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown> | undefined;
  ipAddress?: string | undefined;
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
      const cleanPayload = Object.fromEntries(Object.entries(payload).filter(([_, v]) => v !== undefined));
      await AuditLog.create(cleanPayload);
    } catch (error) {
      // Log to stderr but do not crash the request
      console.error('[AUDIT_ERROR] Failed to write audit log:', error, payload);
    }
  }
}
