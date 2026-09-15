import { Router } from 'express';
import { getDepartments, createDepartment, getDepartmentById, updateDepartment, deleteDepartment } from './department.controller';
import { protect, authorize, requireOrg } from '../../shared/middlewares/auth.middleware';

const router: Router = Router();
router.use(protect, requireOrg);

/**
 * @swagger
 * tags:
 *   name: Departments
 *   description: |
 *     Clinical department management (docs §8).
 *     Departments can span multiple locations and contain multiple services.
 */

/**
 * @swagger
 * /departments:
 *   get:
 *     summary: List all departments for this organization
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: List of departments }
 *   post:
 *     summary: Create a department (ORG_ADMIN only)
 *     tags: [Departments]
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
 *               name:        { type: string, example: "Cardiology" }
 *               description: { type: string }
 *               locationId:  { type: string, description: "Optional — leave blank if cross-location" }
 *     responses:
 *       201: { description: Department created }
 *       403: { description: Forbidden }
 */
router.route('/')
  .get(getDepartments)
  .post(authorize('ORG_ADMIN', 'PLATFORM_ADMIN'), createDepartment);

/**
 * @swagger
 * /departments/{id}:
 *   get:
 *     summary: Get department by ID
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Department data }
 *       404: { description: Not found }
 *   put:
 *     summary: Update department (ORG_ADMIN only)
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     summary: Deactivate department (ORG_ADMIN only)
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Deactivated }
 */
router.route('/:id')
  .get(getDepartmentById)
  .put(authorize('ORG_ADMIN', 'PLATFORM_ADMIN'), updateDepartment)
  .delete(authorize('ORG_ADMIN', 'PLATFORM_ADMIN'), deleteDepartment);

export default router;
