import { Router } from 'express';
import { createQueue, getQueues, joinQueue, updateQueueEntryStatus } from './queue.controller';
import { protect, authorize } from '../../shared/middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /queues:
 *   get:
 *     summary: List all active queues
 *     tags: [Queues]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of queues
 *   post:
 *     summary: Create a new queue (Admin/Receptionist)
 *     tags: [Queues]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - department
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *               department:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Queue created
 */
router.route('/')
  .get(protect, authorize('SUPER_ADMIN', 'ORG_ADMIN', 'PRACTITIONER', 'RECEPTIONIST', 'PATIENT'), getQueues)
  .post(protect, authorize('SUPER_ADMIN', 'ORG_ADMIN', 'RECEPTIONIST'), createQueue);

/**
 * @swagger
 * /queues/join:
 *   post:
 *     summary: Join a queue
 *     tags: [Queues]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - queueId
 *               - patientId
 *             properties:
 *               queueId:
 *                 type: string
 *               patientId:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [NORMAL, HIGH, EMERGENCY]
 *     responses:
 *       201:
 *         description: Successfully joined the queue
 */
router.post('/join', protect, authorize('SUPER_ADMIN', 'ORG_ADMIN', 'RECEPTIONIST', 'PATIENT'), joinQueue);

/**
 * @swagger
 * /queues/entry/{entryId}:
 *   put:
 *     summary: Update a queue entry status
 *     tags: [Queues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entryId
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
 *                 enum: [WAITING, CALLED, SERVED, CANCELLED]
 *     responses:
 *       200:
 *         description: Queue entry updated
 */
router.put('/entry/:entryId', protect, authorize('SUPER_ADMIN', 'ORG_ADMIN', 'PRACTITIONER', 'RECEPTIONIST'), updateQueueEntryStatus);

export default router;
