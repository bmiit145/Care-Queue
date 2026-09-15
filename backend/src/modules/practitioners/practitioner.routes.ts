import { Router } from 'express';
import { getPractitioners, createPractitioner, getPractitionerById, updatePractitioner, deletePractitioner } from './practitioner.controller';
import { assignDepartment, getPractitionerDepartments, removeDepartmentAssignment, getPractitionersInDepartment } from './practitionerDepartment.controller';
import { protect, authorize, requireOrg } from '../../shared/middlewares/auth.middleware';

const router = Router();
router.use(protect, requireOrg);

/**
 * @swagger
 * tags:
 *   name: Practitioners
 *   description: |
 *     Practitioner management (docs §10).
 *     Types per docs: DOCTOR | DENTIST | PHYSIOTHERAPIST | PSYCHOLOGIST | OTHER.
 *     A practitioner profile is separate from the User identity per docs rule §13 / §23.
 */

/**
 * @swagger
 * /practitioners:
 *   get:
 *     summary: List all practitioners for this organization
 *     tags: [Practitioners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: type, schema: { type: string, enum: [DOCTOR, DENTIST, PHYSIOTHERAPIST, PSYCHOLOGIST, OTHER] }, description: "Filter by practitioner type" }
 *     responses:
 *       200: { description: List of practitioners }
 *   post:
 *     summary: Create a practitioner profile (ORG_ADMIN only)
 *     tags: [Practitioners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, type]
 *             properties:
 *               firstName:       { type: string }
 *               lastName:        { type: string }
 *               type:            { type: string, enum: [DOCTOR, DENTIST, PHYSIOTHERAPIST, PSYCHOLOGIST, OTHER] }
 *               specializations: { type: array, items: { type: string } }
 *               contactEmail:    { type: string }
 *               contactPhone:    { type: string }
 *               userId:          { type: string, description: "Optional — link to a PRACTITIONER user account" }
 *     responses:
 *       201: { description: Practitioner created }
 *       403: { description: Forbidden }
 */
router.route('/')
  .get(getPractitioners)
  .post(authorize('ORG_ADMIN', 'PLATFORM_ADMIN'), createPractitioner);

/**
 * @swagger
 * /practitioners/{id}:
 *   get:
 *     summary: Get practitioner by ID
 *     tags: [Practitioners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Practitioner data }
 *       404: { description: Not found }
 *   put:
 *     summary: Update practitioner profile (ORG_ADMIN only)
 *     tags: [Practitioners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     summary: Deactivate practitioner (ORG_ADMIN only)
 *     tags: [Practitioners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Deactivated }
 */
router.route('/:id')
  .get(getPractitionerById)
  .put(authorize('ORG_ADMIN', 'PLATFORM_ADMIN'), updatePractitioner)
  .delete(authorize('ORG_ADMIN', 'PLATFORM_ADMIN'), deletePractitioner);

/**
 * @swagger
 * /practitioners/{id}/departments:
 *   get:
 *     summary: List departments this practitioner belongs to
 *     tags: [Practitioners]
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Assign practitioner to a department (with optional services)
 *     tags: [Practitioners]
 *     security:
 *       - bearerAuth: []
 */
router.route('/:id/departments')
  .get(getPractitionerDepartments)
  .post(authorize('ORG_ADMIN', 'PLATFORM_ADMIN'), assignDepartment);

/**
 * @swagger
 * /practitioners/{id}/departments/{deptId}:
 *   delete:
 *     summary: Remove practitioner from a department
 *     tags: [Practitioners]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id/departments/:deptId', authorize('ORG_ADMIN', 'PLATFORM_ADMIN'), removeDepartmentAssignment);

/**
 * @swagger
 * /practitioners/by-department/{deptId}:
 *   get:
 *     summary: List all practitioners in a department
 *     tags: [Practitioners]
 *     security:
 *       - bearerAuth: []
 */
router.get('/by-department/:deptId', getPractitionersInDepartment);

export default router;
