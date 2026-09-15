import { Router } from 'express';
import { createVisit, getVisits, getVisitById, updateVisitStatus } from './visit.controller';
import { protect, authorize } from '../../shared/middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Visits
 *   description: Visit/Encounter lifecycle — the central operational record
 */

/**
 * @swagger
 * /visits:
 *   post:
 *     summary: Create a new visit (links appointment, check-in, queue entry)
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId]
 *             properties:
 *               patientId:       { type: string }
 *               practitionerId:  { type: string }
 *               departmentId:    { type: string }
 *               serviceId:       { type: string }
 *               locationId:      { type: string }
 *               appointmentId:   { type: string }
 *               checkInId:       { type: string }
 *               queueEntryId:    { type: string }
 *     responses:
 *       201:
 *         description: Visit created
 *   get:
 *     summary: List visits for this organization (with filters)
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: date,            schema: { type: string, format: date } }
 *       - { in: query, name: patientId,       schema: { type: string } }
 *       - { in: query, name: practitionerId,  schema: { type: string } }
 *       - { in: query, name: status,          schema: { type: string } }
 *     responses:
 *       200:
 *         description: List of visits
 */
router.route('/')
  .post(protect, authorize('RECEPTIONIST', 'ORG_ADMIN', 'PLATFORM_ADMIN', 'PRACTITIONER'), createVisit)
  .get(protect, authorize('RECEPTIONIST', 'ORG_ADMIN', 'PLATFORM_ADMIN', 'PRACTITIONER', 'STAFF'), getVisits);

/**
 * @swagger
 * /visits/{id}:
 *   get:
 *     summary: Get visit details by ID
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Visit data
 *       404:
 *         description: Not found
 */
router.get('/:id', protect, authorize('PRACTITIONER', 'RECEPTIONIST', 'ORG_ADMIN', 'PLATFORM_ADMIN', 'PATIENT', 'STAFF'), getVisitById);

/**
 * @swagger
 * /visits/{id}/status:
 *   patch:
 *     summary: Update visit status (state machine enforced)
 *     tags: [Visits]
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
 *                 enum: [ARRIVED, IN_PROGRESS, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Visit updated
 *       400:
 *         description: Invalid state transition
 */
router.patch('/:id/status', protect, authorize('PRACTITIONER', 'ORG_ADMIN', 'PLATFORM_ADMIN'), updateVisitStatus);

export default router;
