import { Router } from 'express';
import { createOrganization, getOrganizations } from './organization.controller';
import { protect, authorize } from '../../shared/middlewares/auth.middleware';

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Organizations
 *   description: |
 *     Multi-tenant organization (tenant) management (docs §3).
 *     Each organization represents one healthcare customer —
 *     a hospital, clinic, private practice, or diagnostic center.
 *
 *     Organization types:
 *       HOSPITAL | CLINIC | PRIVATE_PRACTICE | DIAGNOSTIC_CENTER | HEALTHCARE_CENTER
 */

/**
 * @swagger
 * /organizations:
 *   post:
 *     summary: Create a new organization (PLATFORM_ADMIN only)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       RBAC: PLATFORM_ADMIN only.
 *       Creates a new tenant. The created organization is then assigned
 *       an ORG_ADMIN via the Users API.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type, contactEmail]
 *             properties:
 *               name:         { type: string, example: "ABC Multispeciality Hospital" }
 *               type:
 *                 type: string
 *                 enum: [HOSPITAL, CLINIC, PRIVATE_PRACTICE, DIAGNOSTIC_CENTER, HEALTHCARE_CENTER]
 *               contactEmail: { type: string }
 *               contactPhone: { type: string }
 *               address:      { type: string }
 *     responses:
 *       201: { description: Organization created }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden — PLATFORM_ADMIN only }
 *   get:
 *     summary: List all organizations (PLATFORM_ADMIN only)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: List of all organizations }
 *       403: { description: Forbidden }
 */
router.route('/')
  .post(protect, authorize('PLATFORM_ADMIN'), createOrganization)
  .get(protect, authorize('PLATFORM_ADMIN'), getOrganizations);

export default router;
