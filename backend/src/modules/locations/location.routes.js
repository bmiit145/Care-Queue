"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const location_controller_1 = require("./location.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication and an org context
router.use(auth_middleware_1.protect, auth_middleware_1.requireOrg);
/**
 * @swagger
 * tags:
 *   name: Locations
 *   description: |
 *     Hospital/clinic branch management (docs §7).
 *     All results are automatically scoped to the authenticated user's organization.
 */
/**
 * @swagger
 * /locations:
 *   get:
 *     summary: List all active locations for this organization
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: List of locations }
 *       401: { description: Unauthorized }
 *   post:
 *     summary: Create a new location / branch
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       RBAC: ORG_ADMIN, PLATFORM_ADMIN only.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type]
 *             properties:
 *               name:         { type: string, example: "Main Campus" }
 *               type:         { type: string, enum: [MAIN_CAMPUS, BRANCH, EMERGENCY_CENTER, SATELLITE], example: "MAIN_CAMPUS" }
 *               address:      { type: string }
 *               phone:        { type: string }
 *               contactEmail: { type: string }
 *     responses:
 *       201: { description: Location created }
 *       400: { description: Validation error }
 *       403: { description: Forbidden — insufficient role }
 */
router.route('/')
    .get(location_controller_1.getLocations)
    .post((0, auth_middleware_1.authorize)('ORG_ADMIN', 'PLATFORM_ADMIN'), location_controller_1.createLocation);
/**
 * @swagger
 * /locations/{id}:
 *   get:
 *     summary: Get location by ID
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Location data }
 *       404: { description: Not found }
 *   put:
 *     summary: Update location
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Updated location }
 *       403: { description: Forbidden }
 *   delete:
 *     summary: Deactivate (soft-delete) a location
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Location deactivated }
 *       403: { description: Forbidden }
 */
router.route('/:id')
    .get(location_controller_1.getLocationById)
    .put((0, auth_middleware_1.authorize)('ORG_ADMIN', 'PLATFORM_ADMIN'), location_controller_1.updateLocation)
    .delete((0, auth_middleware_1.authorize)('ORG_ADMIN', 'PLATFORM_ADMIN'), location_controller_1.deleteLocation);
exports.default = router;
//# sourceMappingURL=location.routes.js.map