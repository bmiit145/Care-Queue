import { Router } from 'express';
import {
  createAppointment,
  getAppointments,
  getMyAppointments,
  getAppointmentById,
  getPractitionerAppointments,
  updateAppointmentStatus,
  cancelAppointment,
} from './appointment.controller';
import { protect, authorize } from '../../shared/middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Appointment booking and management
 */

/**
 * @swagger
 * /appointments:
 *   post:
 *     summary: Book a new appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId, date]
 *             properties:
 *               patientId:          { type: string }
 *               practitionerId:     { type: string }
 *               departmentId:       { type: string }
 *               serviceId:          { type: string }
 *               locationId:         { type: string }
 *               date:               { type: string, format: date }
 *               scheduledStartTime: { type: string, format: date-time }
 *               scheduledEndTime:   { type: string, format: date-time }
 *               source:             { type: string, enum: [ONLINE, WALK_IN, PHONE, RECEPTION, REFERRAL] }
 *     responses:
 *       201:
 *         description: Appointment booked
 *   get:
 *     summary: List all appointments (staff/admin view with filters)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: date,           schema: { type: string, format: date } }
 *       - { in: query, name: status,         schema: { type: string } }
 *       - { in: query, name: practitionerId, schema: { type: string } }
 *       - { in: query, name: departmentId,   schema: { type: string } }
 *       - { in: query, name: patientId,      schema: { type: string } }
 *     responses:
 *       200:
 *         description: List of appointments
 */
router.route('/')
  .post(protect, authorize('PATIENT', 'RECEPTIONIST', 'ORG_ADMIN', 'PLATFORM_ADMIN'), createAppointment)
  .get(protect, authorize('RECEPTIONIST', 'PRACTITIONER', 'ORG_ADMIN', 'PLATFORM_ADMIN', 'STAFF'), getAppointments);

/**
 * @swagger
 * /appointments/mine:
 *   get:
 *     summary: Get the authenticated patient's own appointments
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of appointments
 */
router.get('/mine', protect, authorize('PATIENT'), getMyAppointments);

/**
 * @swagger
 * /appointments/practitioner/{practitionerId}:
 *   get:
 *     summary: Get appointments for a specific practitioner
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: practitionerId, required: true, schema: { type: string } }
 *       - { in: query, name: date, schema: { type: string, format: date } }
 *     responses:
 *       200:
 *         description: List of practitioner appointments
 */
router.get('/practitioner/:practitionerId', protect, authorize('PRACTITIONER', 'RECEPTIONIST', 'ORG_ADMIN', 'PLATFORM_ADMIN', 'STAFF'), getPractitionerAppointments);

/**
 * @swagger
 * /appointments/{id}:
 *   get:
 *     summary: Get a single appointment by ID
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Appointment data
 *       404:
 *         description: Not found
 */
router.get('/:id', protect, authorize('PATIENT', 'RECEPTIONIST', 'PRACTITIONER', 'ORG_ADMIN', 'PLATFORM_ADMIN', 'STAFF'), getAppointmentById);

/**
 * @swagger
 * /appointments/{id}/status:
 *   patch:
 *     summary: Update appointment status (state machine enforced)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [CONFIRMED, CHECKED_IN, IN_QUEUE, IN_CONSULTATION, COMPLETED, CANCELLED, NO_SHOW, RESCHEDULED]
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid state transition
 */
router.patch('/:id/status', protect, authorize('RECEPTIONIST', 'PRACTITIONER', 'ORG_ADMIN', 'PLATFORM_ADMIN', 'STAFF'), updateAppointmentStatus);

/**
 * @swagger
 * /appointments/{id}:
 *   delete:
 *     summary: Cancel an appointment (soft cancel via state machine)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Appointment cancelled
 *       400:
 *         description: Cannot cancel in current state
 */
router.delete('/:id', protect, authorize('PATIENT', 'RECEPTIONIST', 'ORG_ADMIN', 'PLATFORM_ADMIN'), cancelAppointment);

export default router;
