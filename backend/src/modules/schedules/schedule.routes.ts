import { Router } from 'express';
import {
  createSchedule,
  getSchedules,
  getPractitionerSchedule,
  updateSchedule,
  deleteSchedule,
  createScheduleException,
  getScheduleExceptions,
  getAvailability,
} from './schedule.controller';
import { protect, authorize } from '../../shared/middlewares/auth.middleware';

const router: Router = Router();

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
router.get('/availability', protect, authorize('PLATFORM_ADMIN', 'ORG_ADMIN', 'RECEPTIONIST', 'STAFF', 'PRACTITIONER', 'PATIENT'), getAvailability);

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
  .get(protect, authorize('PLATFORM_ADMIN', 'ORG_ADMIN', 'RECEPTIONIST', 'STAFF', 'PRACTITIONER'), getSchedules)
  .post(protect, authorize('PLATFORM_ADMIN', 'ORG_ADMIN'), createSchedule);

/**
 * @swagger
 * /schedules/practitioner/{practitionerId}:
 *   get:
 *     summary: Get full schedule + exceptions for a practitioner
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 */
router.get('/practitioner/:practitionerId', protect, authorize('PLATFORM_ADMIN', 'ORG_ADMIN', 'RECEPTIONIST', 'STAFF', 'PRACTITIONER'), getPractitionerSchedule);

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
  .put(protect, authorize('PLATFORM_ADMIN', 'ORG_ADMIN'), updateSchedule)
  .delete(protect, authorize('PLATFORM_ADMIN', 'ORG_ADMIN'), deleteSchedule);

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
  .get(protect, authorize('PLATFORM_ADMIN', 'ORG_ADMIN', 'RECEPTIONIST', 'STAFF'), getScheduleExceptions)
  .post(protect, authorize('PLATFORM_ADMIN', 'ORG_ADMIN'), createScheduleException);

export default router;
