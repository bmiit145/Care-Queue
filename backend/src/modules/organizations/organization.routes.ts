import { Router } from 'express';
import { createOrganization, getOrganizations } from './organization.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Organizations
 *   description: Organization (Tenant) management API
 */

/**
 * @swagger
 * /api/organizations:
 *   post:
 *     summary: Create a new organization
 *     tags: [Organizations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - contactEmail
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [HOSPITAL, CLINIC, PRIVATE_PRACTICE, DIAGNOSTIC_CENTER, HEALTHCARE_CENTER]
 *               contactEmail:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Organization created successfully
 *       500:
 *         description: Server error
 */
router.post('/', createOrganization);

/**
 * @swagger
 * /api/organizations:
 *   get:
 *     summary: Get all active organizations
 *     tags: [Organizations]
 *     responses:
 *       200:
 *         description: A list of organizations
 *       500:
 *         description: Server error
 */
router.get('/', getOrganizations);

export default router;
