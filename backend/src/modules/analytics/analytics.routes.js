"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("./analytics.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
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
router.get('/overview', (0, auth_middleware_1.authorize)('PLATFORM_ADMIN', 'ORG_ADMIN', 'RECEPTIONIST', 'STAFF', 'PRACTITIONER'), analytics_controller_1.getDashboardOverview);
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
router.get('/queue-performance', (0, auth_middleware_1.authorize)('PLATFORM_ADMIN', 'ORG_ADMIN', 'RECEPTIONIST', 'STAFF', 'PRACTITIONER'), analytics_controller_1.getQueuePerformance);
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map