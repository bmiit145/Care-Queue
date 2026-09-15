import { Router } from 'express';
import { createVisit, getVisitById, updateVisitStatus } from './visit.controller';
import { protect, authorize } from '../../shared/middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /visits:
 *   post:
 *     summary: Create a new visit (Check-in/Walk-in)
 *     tags: [Visits]
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
 *               - department
 *               - type
 *             properties:
 *               appointment:
 *                 type: string
 *               patient:
 *                 type: string
 *               practitioner:
 *                 type: string
 *               department:
 *                 type: string
 *               location:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [WALK_IN, APPOINTMENT, EMERGENCY]
 *               chiefComplaint:
 *                 type: string
 *     responses:
 *       201:
 *         description: Visit created
 */
router.post('/', protect, authorize('RECEPTIONIST', 'ORG_ADMIN', 'PLATFORM_ADMIN'), createVisit);

/**
 * @swagger
 * /visits/{id}:
 *   get:
 *     summary: Get visit details by ID
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Visit data
 */
router.get('/:id', protect, authorize('PRACTITIONER', 'RECEPTIONIST', 'ORG_ADMIN', 'PATIENT'), getVisitById);

/**
 * @swagger
 * /visits/{id}/status:
 *   patch:
 *     summary: Update visit status and medical notes
 *     tags: [Visits]
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
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ARRIVED, IN_PROGRESS, COMPLETED, CANCELLED]
 *               notes:
 *                 type: string
 *               diagnosis:
 *                 type: string
 *               treatmentPlan:
 *                 type: string
 *     responses:
 *       200:
 *         description: Visit updated
 */
router.patch('/:id/status', protect, authorize('PRACTITIONER', 'ORG_ADMIN'), updateVisitStatus);

export default router;
