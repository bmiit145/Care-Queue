/**
 * Queue Engine Controller — full operational implementation.
 *
 * Architecture requirements covered:
 *  ✅ Tenant-scoped every query  { organizationId }
 *  ✅ Queue CRUD
 *  ✅ Atomic token generation via $inc + findOneAndUpdate
 *  ✅ Position calculation
 *  ✅ ETA calculation (avg service time × position)
 *  ✅ Call next / call specific entry
 *  ✅ Skip / Recall / No-show
 *  ✅ Queue state machine (WAITING → IN_CONSULTATION → COMPLETED | SKIPPED | NO_SHOW | CANCELLED)
 *  ✅ Cross-entity: validate appointment belongs to same org + patient
 *  ✅ Notification events on every workflow action
 */
import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
/**
 * POST /api/queues
 * Create a queue for a given date + context (dept/practitioner/service/location).
 */
export declare const createQueue: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * GET /api/queues
 * List active queues scoped to this organization.
 * Optional filters: ?date=YYYY-MM-DD  ?departmentId=  ?practitionerId=
 */
export declare const getQueues: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * GET /api/queues/:queueId/entries
 * List all entries in a queue with position + ETA.
 */
export declare const getQueueEntries: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * POST /api/queues/join
 * Add a patient to a queue (atomic token generation).
 * Validates: queue exists + org, appointment belongs to same org + patient.
 */
export declare const joinQueue: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * POST /api/queues/:queueId/call-next
 * Call the next WAITING patient in the queue.
 * Priority order: EMERGENCY → HIGH → NORMAL, then by tokenNumber.
 */
export declare const callNextInQueue: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * POST /api/queues/entry/:entryId/recall
 * Re-call a WAITING or previously SKIPPED patient.
 */
export declare const recallEntry: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * PUT /api/queues/entry/:entryId/status
 * Generic status update with state machine enforcement.
 * Handles: SKIP, NO_SHOW, COMPLETE, CANCEL, re-WAIT.
 */
export declare const updateQueueEntryStatus: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * GET /api/queues/entry/:entryId/position
 * Return the current position + ETA for a specific queue entry.
 * Used by the patient mobile app to show live queue status.
 */
export declare const getQueuePosition: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=queue.controller.d.ts.map