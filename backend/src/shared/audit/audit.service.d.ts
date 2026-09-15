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
export declare class AuditService {
    /**
     * Fire-and-forget audit logger.
     * Does not throw or block the main thread to ensure high availability.
     */
    static log(payload: AuditLogPayload): Promise<void>;
}
export {};
//# sourceMappingURL=audit.service.d.ts.map