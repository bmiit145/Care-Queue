/**
 * Analytics Controller — operational metrics.
 *
 * Architecture requirement: calculate from Appointments, CheckIns, QueueEntries, Visits.
 * Not just total counts — operational dashboard metrics for today.
 *
 * All queries are strictly scoped to organizationId.
 */
import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
export declare const getDashboardOverview: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getQueuePerformance: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=analytics.controller.d.ts.map