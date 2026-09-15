import { Router } from 'express';
import { getDashboardOverview, getQueuePerformance } from './analytics.controller';
import { protect, authorize } from '../../shared/middlewares/auth.middleware';

const router = Router();
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Operational metrics and performance data
 */

/**
 * @swagger
 * /analytics/overview:
 *   get:
 *     summary: Dashboard overview — today's appointments, queue, check-ins, visits
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operational dashboard metrics
 */
router.get('/overview', authorize('PLATFORM_ADMIN', 'ORG_ADMIN', 'RECEPTIONIST', 'STAFF', 'PRACTITIONER'), getDashboardOverview);

/**
 * @swagger
 * /analytics/queue-performance:
 *   get:
 *     summary: Queue performance metrics over the past N days
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, default: 7 }
 *         description: "Number of past days to include (default 7)"
 *     responses:
 *       200:
 *         description: Average wait time, consultation time, no-show rate
 */
router.get('/queue-performance', authorize('PLATFORM_ADMIN', 'ORG_ADMIN', 'RECEPTIONIST', 'STAFF', 'PRACTITIONER'), getQueuePerformance);

export default router;
