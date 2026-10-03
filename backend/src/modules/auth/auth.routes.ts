import { Router } from 'express';
import { login, register, getMe, requestOtp, verifyOtp, refresh, checkMobileProfile } from './auth.controller';
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
 *     summary: Self-service patient sign-up
 *     description: |
 *       Public endpoint. Always creates a PATIENT with no organization.
 *
 *       `role` and `organizationId` are ignored if sent. Because this endpoint
 *       is unauthenticated, honouring them would let any caller mint a
 *       PLATFORM_ADMIN token or attach themselves to an arbitrary tenant.
 *
 *       Staff and administrator accounts are created by an existing admin via
 *       `POST /api/users`. The first PLATFORM_ADMIN is created out-of-band with
 *       `pnpm admin:create`.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password]
 *             properties:
 *               firstName: { type: string, example: "Rahul" }
 *               lastName:  { type: string, example: "Patel" }
 *               email:     { type: string, format: email }
 *               password:  { type: string, minLength: 8 }
 *               phone:     { type: string }
 *     responses:
 *       201:
 *         description: Patient registered — returns user object and JWT token
 *       400:
 *         description: Validation error, weak password, or email already exists
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

router.post('/mobile/request-otp', requestOtp);
router.post('/mobile/verify-otp', verifyOtp);
router.post('/refresh', refresh);

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
router.get('/mobile/profile', protect, checkMobileProfile);
router.get('/profile/check', protect, checkMobileProfile);

export default router;
