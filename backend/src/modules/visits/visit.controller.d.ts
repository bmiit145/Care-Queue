/**
 * Visit / Encounter Controller — operational boundary for consultations.
 *
 * Architecture compliance:
 *  ✅ All queries scoped to organizationId (tenant isolation)
 *  ✅ State machine (CREATED → ARRIVED → IN_PROGRESS → COMPLETED | CANCELLED)
 *  ✅ Cross-entity: validate patient, appointment, queue entry belong to same org
 *  ✅ Notification events on start/complete
 *  ✅ Keep Visit lean — no clinical fields (notes, diagnosis stay in future bounded domains)
 */
import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
/**
 * POST /api/visits
 * Create a Visit/Encounter.
 * Cross-entity validates: patient, appointment, queue entry.
 */
export declare const createVisit: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * GET /api/visits
 * List visits for this organization. Optional filters: ?date=&patientId=&practitionerId=&status=
 */
export declare const getVisits: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * GET /api/visits/:id
 */
export declare const getVisitById: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * PATCH /api/visits/:id/status
 * State machine enforced. Fires notification events.
 */
export declare const updateVisitStatus: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=visit.controller.d.ts.map