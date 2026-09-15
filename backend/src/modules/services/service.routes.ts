import { Router } from 'express';
import { getServices, createService, getServiceById, updateService, deleteService } from './service.controller';
import { protect, authorize, requireOrg } from '../../shared/middlewares/auth.middleware';

const router = Router();
router.use(protect, requireOrg);

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: |
 *     Clinical services that patients book (docs §9).
 *     Examples: "New Patient Consultation", "Follow-up", "ECG", "Physiotherapy Session".
 *     Services are linked to a department and have a duration and optional price.
 */

/**
 * @swagger
 * /services:
 *   get:
 *     summary: List active services for this organization
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: departmentId, schema: { type: string }, description: "Filter by department" }
 *     responses:
 *       200: { description: List of services }
 *   post:
 *     summary: Create a service (ORG_ADMIN only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, departmentId]
 *             properties:
 *               name:               { type: string, example: "New Patient Consultation" }
 *               departmentId:       { type: string }
 *               description:        { type: string }
 *               durationInMinutes:  { type: integer, default: 15 }
 *               price:              { type: number }
 *     responses:
 *       201: { description: Service created }
 *       403: { description: Forbidden }
 */
router.route('/')
  .get(getServices)
  .post(authorize('ORG_ADMIN', 'PLATFORM_ADMIN'), createService);

/**
 * @swagger
 * /services/{id}:
 *   get:
 *     summary: Get service by ID
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Service data }
 *       404: { description: Not found }
 *   put:
 *     summary: Update service (ORG_ADMIN only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     summary: Deactivate service (ORG_ADMIN only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Deactivated }
 */
router.route('/:id')
  .get(getServiceById)
  .put(authorize('ORG_ADMIN', 'PLATFORM_ADMIN'), updateService)
  .delete(authorize('ORG_ADMIN', 'PLATFORM_ADMIN'), deleteService);

export default router;
