"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const audit_model_1 = require("./audit.model");
class AuditService {
    /**
     * Fire-and-forget audit logger.
     * Does not throw or block the main thread to ensure high availability.
     */
    static async log(payload) {
        try {
            // In a high-throughput enterprise system, this might push to a pub/sub queue (e.g., Kafka)
            // For Phase 1, we write directly to the capped Mongo collection.
            await audit_model_1.AuditLog.create(payload);
        }
        catch (error) {
            // Log to stderr but do not crash the request
            console.error('[AUDIT_ERROR] Failed to write audit log:', error, payload);
        }
    }
}
exports.AuditService = AuditService;
//# sourceMappingURL=audit.service.js.map