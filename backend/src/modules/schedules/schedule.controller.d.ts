/**
 * Schedule Controller — full implementation.
 *
 * Covers:
 *  ✅ Create / list recurring schedules (tenant-scoped)
 *  ✅ Create / list schedule exceptions (leave, special days)
 *  ✅ GET /availability — calls the availability engine
 *  ✅ All queries scoped to organizationId
 */
import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
export declare const createSchedule: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getSchedules: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPractitionerSchedule: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateSchedule: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteSchedule: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createScheduleException: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getScheduleExceptions: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * GET /api/schedules/availability
 * Query params: practitionerId (required), date (required), slotDurationMin (optional)
 *
 * Returns an array of { start, end } slots that are still open for booking.
 * The mobile app calls this to show the booking calendar.
 */
export declare const getAvailability: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=schedule.controller.d.ts.map