"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const department_controller_1 = require("./department.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect, auth_middleware_1.requireOrg);
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
    .get(department_controller_1.getDepartments)
    .post((0, auth_middleware_1.authorize)('ORG_ADMIN', 'PLATFORM_ADMIN'), department_controller_1.createDepartment);
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
    .get(department_controller_1.getDepartmentById)
    .put((0, auth_middleware_1.authorize)('ORG_ADMIN', 'PLATFORM_ADMIN'), department_controller_1.updateDepartment)
    .delete((0, auth_middleware_1.authorize)('ORG_ADMIN', 'PLATFORM_ADMIN'), department_controller_1.deleteDepartment);
exports.default = router;
//# sourceMappingURL=department.routes.js.map