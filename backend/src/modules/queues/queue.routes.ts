import { Router } from 'express';
import {
  createQueue,
  getQueues,
  getQueueEntries,
  joinQueue,
  callNextInQueue,
  recallEntry,
  updateQueueEntryStatus,
  getQueuePosition,
} from './queue.controller';
import { protect, authorize } from '../../shared/middlewares/auth.middleware';

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Queues
 *   description: Queue management and patient flow
 */

/**
 * @swagger
 * /queues:
 *   get:
 *     summary: List active queues for this organization
 *     tags: [Queues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: departmentId
 *         schema: { type: string }
 *       - in: query
 *         name: practitionerId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of queues
 *   post:
 *     summary: Create a new queue
 *     tags: [Queues]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:          { type: string }
 *               departmentId:  { type: string }
 *               locationId:    { type: string }
 *               practitionerId:{ type: string }
 *               serviceId:     { type: string }
 *               queueDate:     { type: string, format: date }
 *     responses:
 *       201:
 *         description: Queue created
 */
router.route('/')
  .get(protect, authorize('PLATFORM_ADMIN', 'ORG_ADMIN', 'PRACTITIONER', 'RECEPTIONIST', 'STAFF', 'PATIENT'), getQueues)
  .post(protect, authorize('PLATFORM_ADMIN', 'ORG_ADMIN', 'RECEPTIONIST'), createQueue);

/**
 * @swagger
 * /queues/{queueId}/entries:
 *   get:
 *     summary: List all entries in a queue (with position + ETA)
 *     tags: [Queues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Queue entries with position and ETA
 */
router.get('/:queueId/entries', protect, authorize('PLATFORM_ADMIN', 'ORG_ADMIN', 'PRACTITIONER', 'RECEPTIONIST', 'STAFF'), getQueueEntries);

/**
 * @swagger
 * /queues/{queueId}/call-next:
 *   post:
 *     summary: Call the next highest-priority waiting patient
 *     tags: [Queues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Queue entry moved to IN_CONSULTATION
 */
router.post('/:queueId/call-next', protect, authorize('PLATFORM_ADMIN', 'ORG_ADMIN', 'PRACTITIONER', 'RECEPTIONIST'), callNextInQueue);

/**
 * @swagger
 * /queues/join:
 *   post:
 *     summary: Add a patient to a queue
 *     tags: [Queues]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [queueId, patientId]
 *             properties:
 *               queueId:       { type: string }
 *               patientId:     { type: string }
 *               appointmentId: { type: string }
 *               checkInId:     { type: string }
 *               priority:      { type: string, enum: [NORMAL, HIGH, EMERGENCY] }
 *     responses:
 *       201:
 *         description: Successfully joined the queue
 *       409:
 *         description: Patient already waiting in this queue
 */
router.post('/join', protect, authorize('PLATFORM_ADMIN', 'ORG_ADMIN', 'RECEPTIONIST', 'STAFF', 'PATIENT'), joinQueue);

/**
 * @swagger
 * /queues/entry/{entryId}/recall:
 *   post:
 *     summary: Recall a waiting or skipped patient
 *     tags: [Queues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Patient recalled
 */
router.post('/entry/:entryId/recall', protect, authorize('PLATFORM_ADMIN', 'ORG_ADMIN', 'PRACTITIONER', 'RECEPTIONIST'), recallEntry);

/**
 * @swagger
 * /queues/entry/{entryId}/status:
 *   put:
 *     summary: Update queue entry status (state machine enforced)
 *     tags: [Queues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema: { type: string }
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
 *                 enum: [IN_CONSULTATION, COMPLETED, SKIPPED, NO_SHOW, CANCELLED, WAITING]
 *     responses:
 *       200:
 *         description: Queue entry updated
 *       400:
 *         description: Invalid state transition
 */
router.put('/entry/:entryId/status', protect, authorize('PLATFORM_ADMIN', 'ORG_ADMIN', 'PRACTITIONER', 'RECEPTIONIST'), updateQueueEntryStatus);

/**
 * @swagger
 * /queues/entry/{entryId}/position:
 *   get:
 *     summary: Get live position and ETA for a patient (mobile polling endpoint)
 *     tags: [Queues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Position and estimated wait
 */
router.get('/entry/:entryId/position', protect, authorize('PLATFORM_ADMIN', 'ORG_ADMIN', 'PRACTITIONER', 'RECEPTIONIST', 'STAFF', 'PATIENT'), getQueuePosition);

export default router;
