"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: |
 *     Staff user management (docs §13).
 *     PLATFORM_ADMIN manages all users across all tenants.
 *     ORG_ADMIN manages only users within their own organization.
 *
 *     Roles: PLATFORM_ADMIN | ORG_ADMIN | RECEPTIONIST | PRACTITIONER | STAFF | PATIENT
 */
/**
 * @swagger
 * /users:
 *   get:
 *     summary: List users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       RBAC: PLATFORM_ADMIN (all users), ORG_ADMIN (own org users only)
 *     responses:
 *       200: { description: List of users }
 *       403: { description: Forbidden }
 *   post:
 *     summary: Create / invite a new staff user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       RBAC: PLATFORM_ADMIN, ORG_ADMIN
 *       Role escalation is prevented — ORG_ADMIN cannot assign PLATFORM_ADMIN role.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password, role]
 *             properties:
 *               firstName:      { type: string }
 *               lastName:       { type: string }
 *               email:          { type: string, format: email }
 *               password:       { type: string, minLength: 8 }
 *               phone:          { type: string }
 *               role:
 *                 type: string
 *                 enum: [ORG_ADMIN, RECEPTIONIST, PRACTITIONER, STAFF, PATIENT]
 *               organizationId: { type: string, description: "PLATFORM_ADMIN only — defaults to caller's org" }
 *     responses:
 *       201: { description: User created }
 *       400: { description: Validation error }
 *       403: { description: Forbidden }
 */
router.route('/')
    .get((0, auth_middleware_1.authorize)('PLATFORM_ADMIN', 'ORG_ADMIN'), user_controller_1.getUsers)
    .post((0, auth_middleware_1.authorize)('PLATFORM_ADMIN', 'ORG_ADMIN'), user_controller_1.createUser);
/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: User data }
 *       404: { description: Not found }
 *   put:
 *     summary: Update user profile or role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Updated user }
 *       403: { description: Forbidden or role escalation attempted }
 *   delete:
 *     summary: Deactivate user (soft-delete)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: User deactivated }
 */
router.route('/:id')
    .get((0, auth_middleware_1.authorize)('PLATFORM_ADMIN', 'ORG_ADMIN'), user_controller_1.getUserById)
    .put((0, auth_middleware_1.authorize)('PLATFORM_ADMIN', 'ORG_ADMIN'), user_controller_1.updateUser)
    .delete((0, auth_middleware_1.authorize)('PLATFORM_ADMIN', 'ORG_ADMIN'), user_controller_1.deleteUser);
exports.default = router;
//# sourceMappingURL=user.routes.js.map