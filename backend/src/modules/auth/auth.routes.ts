import { Router } from 'express';
import { login, register, getMe } from './auth.controller';
import { protect } from '../../shared/middlewares/auth.middleware';

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and session management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: |
 *       Creates a user with a role. Role must be one of:
 *       PLATFORM_ADMIN | ORG_ADMIN | RECEPTIONIST | PRACTITIONER | STAFF | PATIENT
 *
 *       When organizationId is provided the user is scoped to that tenant.
 *       All subsequent requests by this user will be automatically filtered
 *       to that organization (tenant isolation).
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password]
 *             properties:
 *               firstName:      { type: string, example: "Rahul" }
 *               lastName:       { type: string, example: "Patel" }
 *               email:          { type: string, format: email }
 *               password:       { type: string, minLength: 8 }
 *               phone:          { type: string }
 *               role:
 *                 type: string
 *                 enum: [PLATFORM_ADMIN, ORG_ADMIN, RECEPTIONIST, PRACTITIONER, STAFF, PATIENT]
 *                 default: PATIENT
 *               organizationId: { type: string, description: "Required for org-scoped roles" }
 *     responses:
 *       201:
 *         description: User registered — returns user object and JWT token
 *       400:
 *         description: Validation error or email already exists
 */
router.post('/register', register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login
 *     description: |
 *       Returns a JWT token containing id, role, and organizationId.
 *       Use this token as `Authorization: Bearer <token>` on all protected routes.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful — returns JWT token
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user profile
 *       401:
 *         description: Unauthorized
 */
router.get('/me', protect, getMe);

export default router;
