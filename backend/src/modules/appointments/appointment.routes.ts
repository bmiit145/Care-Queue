import { Router } from 'express';
import { createAppointment, getMyAppointments, getPractitionerAppointments, updateAppointmentStatus } from './appointment.controller';
import { protect, authorize } from '../../shared/middlewares/auth.middleware';

const router = Router();

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
 *             required:
 *               - patient
 *               - practitioner
 *               - scheduledStartTime
 *               - appointmentType
 *             properties:
 *               patient:
 *                 type: string
 *               practitioner:
 *                 type: string
 *               department:
 *                 type: string
 *               location:
 *                 type: string
 *               scheduledStartTime:
 *                 type: string
 *                 format: date-time
 *               scheduledEndTime:
 *                 type: string
 *                 format: date-time
 *               appointmentType:
 *                 type: string
 *                 enum: [IN_PERSON, TELEHEALTH]
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment booked
 *   get:
 *     summary: Get appointments for the authenticated patient
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of appointments
 */
router.route('/')
  .post(protect, authorize('PATIENT', 'RECEPTIONIST', 'ORG_ADMIN'), createAppointment)
  .get(protect, authorize('PATIENT'), getMyAppointments);

/**
 * @swagger
 * /appointments/practitioner/{practitionerId}:
 *   get:
 *     summary: Get appointments for a specific practitioner
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: practitionerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of practitioner appointments
 */
router.get('/practitioner/:practitionerId', protect, authorize('PRACTITIONER', 'RECEPTIONIST', 'ORG_ADMIN'), getPractitionerAppointments);

/**
 * @swagger
 * /appointments/{id}/status:
 *   patch:
 *     summary: Update appointment status
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [BOOKED, CONFIRMED, CHECKED_IN, IN_QUEUE, CANCELLED, NO_SHOW, COMPLETED]
 *     responses:
 *       200:
 *         description: Appointment status updated
 */
router.patch('/:id/status', protect, authorize('RECEPTIONIST', 'PRACTITIONER', 'ORG_ADMIN', 'PATIENT'), updateAppointmentStatus);

export default router;
