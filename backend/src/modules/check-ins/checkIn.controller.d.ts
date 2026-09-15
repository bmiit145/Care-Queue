/**
 * Check-In Controller — patient arrival processing.
 *
 * Architecture compliance:
 *  ✅ All queries scoped to organizationId (tenant isolation)
 *  ✅ Cross-entity: validates appointment belongs to same org + same patient
 *  ✅ Cross-entity: validates patient belongs to org
 *  ✅ Appointment status sync → CHECKED_IN (state machine safe)
 *  ✅ Notification events
 *  ✅ Duplicate check-in prevention
 */
import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
/**
 * POST /api/check-ins
 * Creates a check-in record. Walk-in if no appointmentId.
 */
export declare const createCheckIn: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * GET /api/check-ins
 * Lists today's check-ins for the organization.
 */
export declare const getCheckIns: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * GET /api/check-ins/:id
 */
export declare const getCheckInById: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=checkIn.controller.d.ts.map