"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const schedule_controller_1 = require("./schedule.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Schedules
 *   description: Practitioner scheduling and availability
 */
/**
 * @swagger
 * /schedules/availability:
 *   get:
 *     summary: Get available appointment slots for a practitioner on a date
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: practitionerId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: date
 *         required: true
 *         schema: { type: string, format: date }
 *         description: "Date in YYYY-MM-DD format"
 *       - in: query
 *         name: slotDurationMin
 *         schema: { type: integer, default: 15 }
 *     responses:
 *       200:
 *         description: List of available { start, end } slots
 */
router.get('/availability', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('PLATFORM_ADMIN', 'ORG_ADMIN', 'RECEPTIONIST', 'STAFF', 'PRACTITIONER', 'PATIENT'), schedule_controller_1.getAvailability);
/**
 * @swagger
 * /schedules:
 *   get:
 *     summary: List recurring schedules
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Create a recurring schedule for a practitioner
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 */
router.route('/')
    .get(auth_middleware_1.protect, (0, auth_middleware_1.authorize)('PLATFORM_ADMIN', 'ORG_ADMIN', 'RECEPTIONIST', 'STAFF', 'PRACTITIONER'), schedule_controller_1.getSchedules)
    .post(auth_middleware_1.protect, (0, auth_middleware_1.authorize)('PLATFORM_ADMIN', 'ORG_ADMIN'), schedule_controller_1.createSchedule);
/**
 * @swagger
 * /schedules/practitioner/{practitionerId}:
 *   get:
 *     summary: Get full schedule + exceptions for a practitioner
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 */
router.get('/practitioner/:practitionerId', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('PLATFORM_ADMIN', 'ORG_ADMIN', 'RECEPTIONIST', 'STAFF', 'PRACTITIONER'), schedule_controller_1.getPractitionerSchedule);
/**
 * @swagger
 * /schedules/{id}:
 *   put:
 *     summary: Update a schedule
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *   delete:
 *     summary: Deactivate a schedule
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 */
router.route('/:id')
    .put(auth_middleware_1.protect, (0, auth_middleware_1.authorize)('PLATFORM_ADMIN', 'ORG_ADMIN'), schedule_controller_1.updateSchedule)
    .delete(auth_middleware_1.protect, (0, auth_middleware_1.authorize)('PLATFORM_ADMIN', 'ORG_ADMIN'), schedule_controller_1.deleteSchedule);
/**
 * @swagger
 * /schedules/exceptions:
 *   get:
 *     summary: List schedule exceptions (leave / special days)
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Create a schedule exception (e.g. doctor on leave)
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [practitionerId, date, reason, isAvailable]
 *             properties:
 *               practitionerId: { type: string }
 *               date:           { type: string, format: date }
 *               reason:         { type: string }
 *               isAvailable:    { type: boolean }
 *               startTime:      { type: string, example: "09:00" }
 *               endTime:        { type: string, example: "13:00" }
 */
router.route('/exceptions')
    .get(auth_middleware_1.protect, (0, auth_middleware_1.authorize)('PLATFORM_ADMIN', 'ORG_ADMIN', 'RECEPTIONIST', 'STAFF'), schedule_controller_1.getScheduleExceptions)
    .post(auth_middleware_1.protect, (0, auth_middleware_1.authorize)('PLATFORM_ADMIN', 'ORG_ADMIN'), schedule_controller_1.createScheduleException);
exports.default = router;
//# sourceMappingURL=schedule.routes.js.map