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
 *
 *       Mobile OTP users: send the `accessToken` from verify-otp as
 *       `Authorization: Bearer <token>` to complete that same user's profile
 *       (sets `profileCompleted: true`). No token is returned.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: |
 *               `email` is optional. Without a Bearer token, at least one of
 *               `phone` or `email` is required to create the patient.
 *             required: [firstName, lastName]
 *             properties:
 *               firstName: { type: string, example: "Rahul" }
 *               lastName:  { type: string, example: "Patel" }
 *               age:       { type: number, example: 30 }
 *               gender:    { type: string, example: "MALE" }
 *               email:     { type: string, format: email, description: "Optional" }
 *               phone:     { type: string, description: "Also accepted as phoneNumber" }
 *     responses:
 *       200:
 *         description: Existing (OTP) user's profile completed — returns user object
 *       201:
 *         description: Patient registered — returns user object
 *       400:
 *         description: Validation error, missing phone/email for a new user, or email/phone already exists
 *       401:
 *         description: Authorization header sent but the access token is invalid or expired
 *       403:
 *         description: User account is inactive
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
 * /auth/mobile/request-otp:
 *   post:
 *     summary: Send a mobile login OTP through WhatsApp
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phoneNumber]
 *             properties:
 *               phoneNumber: { type: string, example: "+14155552671" }
 *               role:
 *                 type: string
 *                 example: "PATIENT"
 *                 description: "Role to sign in as. Defaults to PATIENT. Any role except PLATFORM_ADMIN and ORG_ADMIN."
 *     responses:
 *       200: { description: OTP sent successfully }
 *       400: { description: Invalid phone number or role }
 *       500: { description: WhatsApp delivery failed }
 */
router.post('/mobile/request-otp', requestOtp);

/**
 * @swagger
 * /auth/mobile/verify-otp:
 *   post:
 *     summary: Verify a mobile OTP and create or authenticate the user
 *     description: |
 *       Signs in as the role sent to request-otp. `role` here is optional; if
 *       sent it must match. New users are created with that role, and existing
 *       self-service users are switched to it. Admin accounts and users attached
 *       to an organization keep their admin-assigned role (403 on mismatch).
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phoneNumber, otp]
 *             properties:
 *               phoneNumber: { type: string, example: "+14155552671" }
 *               otp: { type: string, example: "123456" }
 *               role: { type: string, example: "PATIENT", description: "Optional; must match the role sent to request-otp" }
 *     responses:
 *       200: { description: OTP verified with access and refresh tokens }
 *       400: { description: Invalid request, invalid role, or role differs from request-otp }
 *       401: { description: Invalid or expired OTP }
 *       403: { description: Account inactive, or its admin-assigned role cannot be changed }
 */
router.post('/mobile/verify-otp', verifyOtp);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Issue a new access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: New access token }
 *       401: { description: Invalid or expired refresh token }
 */
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

/**
 * @swagger
 * /auth/mobile/profile:
 *   get:
 *     summary: Check whether the mobile patient's profile is complete
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Profile completion status and user data }
 *       401: { description: Unauthorized }
 */
router.get('/mobile/profile', protect, checkMobileProfile);

/**
 * @swagger
 * /auth/profile/check:
 *   get:
 *     summary: Check whether the authenticated patient's profile is complete
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Profile completion status and user data }
 *       401: { description: Unauthorized }
 */
router.get('/profile/check', protect, checkMobileProfile);

export default router;
