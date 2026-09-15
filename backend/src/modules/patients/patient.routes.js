"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const patient_controller_1 = require("./patient.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /patients:
 *   post:
 *     summary: Register a patient profile
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - mobileNumber
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               mobileNumber:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY]
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *               emergencyContact:
 *                 type: string
 *     responses:
 *       201:
 *         description: Patient registered successfully
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Get all patients for the organization
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of patients
 *       401:
 *         description: Unauthorized
 */
router.route('/')
    .post(auth_middleware_1.protect, (0, auth_middleware_1.authorize)('ORG_ADMIN', 'RECEPTIONIST', 'PATIENT'), patient_controller_1.registerPatient)
    .get(auth_middleware_1.protect, (0, auth_middleware_1.authorize)('ORG_ADMIN', 'RECEPTIONIST', 'PRACTITIONER', 'STAFF'), patient_controller_1.getPatients);
/**
 * @swagger
 * /patients/{id}:
 *   get:
 *     summary: Get patient by ID
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patient data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Patient not found
 */
router.get('/:id', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('ORG_ADMIN', 'RECEPTIONIST', 'PRACTITIONER', 'STAFF', 'PATIENT'), patient_controller_1.getPatientById);
exports.default = router;
//# sourceMappingURL=patient.routes.js.map