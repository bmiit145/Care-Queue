/**
 * Appointment Controller
 *
 * Architecture compliance:
 *  ✅ All queries scoped to organizationId (tenant isolation)
 *  ✅ State machine enforced (VALID_TRANSITIONS)
 *  ✅ Notification events emitted on every status change
 *  ✅ Cross-entity: patient validated when creating appointment
 *  ✅ No SUPER_ADMIN — standardized roles only
 */
import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
/**
 * POST /api/appointments
 */
export declare const createAppointment: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * GET /api/appointments/mine
 * Patient: their own appointments (tenant-scoped).
 */
export declare const getMyAppointments: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * GET /api/appointments
 * Staff/Admin: all appointments for the org, with optional filters.
 */
export declare const getAppointments: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * GET /api/appointments/:id
 */
export declare const getAppointmentById: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * GET /api/appointments/practitioner/:practitionerId
 */
export declare const getPractitionerAppointments: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * PATCH /api/appointments/:id/status
 * State machine enforced. Fires notification events.
 */
export declare const updateAppointmentStatus: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * DELETE /api/appointments/:id
 * Soft-cancel only — enforces state machine.
 */
export declare const cancelAppointment: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=appointment.controller.d.ts.map