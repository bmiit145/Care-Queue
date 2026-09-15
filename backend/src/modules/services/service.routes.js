"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const service_controller_1 = require("./service.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect, auth_middleware_1.requireOrg);
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
    .get(service_controller_1.getServices)
    .post((0, auth_middleware_1.authorize)('ORG_ADMIN', 'PLATFORM_ADMIN'), service_controller_1.createService);
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
    .get(service_controller_1.getServiceById)
    .put((0, auth_middleware_1.authorize)('ORG_ADMIN', 'PLATFORM_ADMIN'), service_controller_1.updateService)
    .delete((0, auth_middleware_1.authorize)('ORG_ADMIN', 'PLATFORM_ADMIN'), service_controller_1.deleteService);
exports.default = router;
//# sourceMappingURL=service.routes.js.map