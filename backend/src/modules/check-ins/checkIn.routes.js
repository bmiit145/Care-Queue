"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const checkIn_controller_1 = require("./checkIn.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect, auth_middleware_1.requireOrg);
/**
 * @swagger
 * tags:
 *   name: Check-Ins
 *   description: |
 *     Patient arrival/check-in management (docs §16).
 *
 *     A check-in is a DISTINCT OPERATIONAL EVENT from the appointment.
 *     It captures the actual patient arrival time, which enables:
 *     - Waiting-time calculation
 *     - Late-arrival analysis
 *     - No-show analysis
 *     - Queue performance measurement
 *
 *     Walk-ins are supported: simply omit appointmentId.
 */
/**
 * @swagger
 * /check-ins:
 *   get:
 *     summary: List today's check-ins for this organization
 *     tags: [Check-Ins]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       RBAC: RECEPTIONIST, ORG_ADMIN, PRACTITIONER, PLATFORM_ADMIN
 *     responses:
 *       200: { description: List of today's check-ins }
 *       403: { description: Forbidden }
 *   post:
 *     summary: Create a patient check-in (or walk-in)
 *     tags: [Check-Ins]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       RBAC: RECEPTIONIST, ORG_ADMIN, PLATFORM_ADMIN, PATIENT (self check-in via mobile)
 *
 *       Walk-in flow (docs §18): omit appointmentId. The system will create the
 *       check-in without an associated appointment.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId]
 *             properties:
 *               patientId:     { type: string }
 *               appointmentId: { type: string, description: "Optional — omit for walk-in" }
 *               locationId:    { type: string }
 *               source:
 *                 type: string
 *                 enum: [RECEPTION, KIOSK, MOBILE]
 *                 default: RECEPTION
 *     responses:
 *       201: { description: Check-in created }
 *       400: { description: Validation error }
 *       403: { description: Forbidden }
 */
router.route('/')
    .get((0, auth_middleware_1.authorize)('RECEPTIONIST', 'ORG_ADMIN', 'PRACTITIONER', 'PLATFORM_ADMIN'), checkIn_controller_1.getCheckIns)
    .post((0, auth_middleware_1.authorize)('RECEPTIONIST', 'ORG_ADMIN', 'PLATFORM_ADMIN', 'PATIENT'), checkIn_controller_1.createCheckIn);
/**
 * @swagger
 * /check-ins/{id}:
 *   get:
 *     summary: Get check-in by ID
 *     tags: [Check-Ins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Check-in data }
 *       404: { description: Not found }
 */
router.get('/:id', (0, auth_middleware_1.authorize)('RECEPTIONIST', 'ORG_ADMIN', 'PRACTITIONER', 'PLATFORM_ADMIN', 'PATIENT'), checkIn_controller_1.getCheckInById);
exports.default = router;
//# sourceMappingURL=checkIn.routes.js.map