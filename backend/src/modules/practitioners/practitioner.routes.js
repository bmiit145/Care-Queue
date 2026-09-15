"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const practitioner_controller_1 = require("./practitioner.controller");
const practitionerDepartment_controller_1 = require("./practitionerDepartment.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect, auth_middleware_1.requireOrg);
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
    .get(practitioner_controller_1.getPractitioners)
    .post((0, auth_middleware_1.authorize)('ORG_ADMIN', 'PLATFORM_ADMIN'), practitioner_controller_1.createPractitioner);
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
    .get(practitioner_controller_1.getPractitionerById)
    .put((0, auth_middleware_1.authorize)('ORG_ADMIN', 'PLATFORM_ADMIN'), practitioner_controller_1.updatePractitioner)
    .delete((0, auth_middleware_1.authorize)('ORG_ADMIN', 'PLATFORM_ADMIN'), practitioner_controller_1.deletePractitioner);
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
    .get(practitionerDepartment_controller_1.getPractitionerDepartments)
    .post((0, auth_middleware_1.authorize)('ORG_ADMIN', 'PLATFORM_ADMIN'), practitionerDepartment_controller_1.assignDepartment);
/**
 * @swagger
 * /practitioners/{id}/departments/{deptId}:
 *   delete:
 *     summary: Remove practitioner from a department
 *     tags: [Practitioners]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id/departments/:deptId', (0, auth_middleware_1.authorize)('ORG_ADMIN', 'PLATFORM_ADMIN'), practitionerDepartment_controller_1.removeDepartmentAssignment);
/**
 * @swagger
 * /practitioners/by-department/{deptId}:
 *   get:
 *     summary: List all practitioners in a department
 *     tags: [Practitioners]
 *     security:
 *       - bearerAuth: []
 */
router.get('/by-department/:deptId', practitionerDepartment_controller_1.getPractitionersInDepartment);
exports.default = router;
//# sourceMappingURL=practitioner.routes.js.map