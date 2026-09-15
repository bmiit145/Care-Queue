import { Router } from 'express';
import { registerPatient, getMyPatientProfile, getPatientById } from './patient.controller';
import { protect, authorize } from '../../shared/middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /patients:
 *   post:
 *     summary: Register a patient profile for the authenticated user
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - dateOfBirth
 *               - gender
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *               contactPhone:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *     responses:
 *       201:
 *         description: Patient registered successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/', protect, authorize('PATIENT'), registerPatient);

/**
 * @swagger
 * /patients/me:
 *   get:
 *     summary: Get the authenticated user's patient profile
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patient profile
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.get('/me', protect, authorize('PATIENT'), getMyPatientProfile);

/**
 * @swagger
 * /patients/{id}:
 *   get:
 *     summary: Get patient by ID (Admin/Practitioner)
 *     tags: [Patients]
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
 *         description: Patient data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Patient not found
 */
router.get('/:id', protect, authorize('SUPER_ADMIN', 'ORG_ADMIN', 'PRACTITIONER', 'RECEPTIONIST'), getPatientById);

export default router;
