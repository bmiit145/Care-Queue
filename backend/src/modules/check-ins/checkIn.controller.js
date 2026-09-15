"use strict";
/**
 * Check-In Controller — patient arrival processing.
 *
 * Architecture compliance:
 *  ✅ All queries scoped to organizationId (tenant isolation)
 *  ✅ Cross-entity: validates appointment belongs to same org + same patient
 *  ✅ Cross-entity: validates patient belongs to org
 *  ✅ Appointment status sync → CHECKED_IN (state machine safe)
 *  ✅ Notification events
 *  ✅ Duplicate check-in prevention
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCheckInById = exports.getCheckIns = exports.createCheckIn = void 0;
const express_1 = require("express");
const checkIn_model_1 = require("./checkIn.model");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const appointment_model_1 = require("../appointments/appointment.model");
const patient_model_1 = require("../patients/patient.model");
const notification_service_1 = require("../../shared/notifications/notification.service");
const audit_service_1 = require("../../shared/audit/audit.service");
/**
 * POST /api/check-ins
 * Creates a check-in record. Walk-in if no appointmentId.
 */
const createCheckIn = async (req, res) => {
    try {
        const { patientId, appointmentId, locationId, source } = req.body;
        const organizationId = req.user.organizationId;
        if (!patientId) {
            res.status(400).json({ message: 'patientId is required' });
            return;
        }
        // Cross-entity: validate patient belongs to this org
        const patient = await patient_model_1.Patient.findOne({ _id: patientId, organizationId });
        if (!patient) {
            res.status(400).json({ message: 'Patient not found in this organization' });
            return;
        }
        // Cross-entity: validate appointment ownership + patient match
        if (appointmentId) {
            const appt = await appointment_model_1.Appointment.findOne({ _id: appointmentId, organizationId });
            if (!appt) {
                res.status(400).json({ message: 'Appointment not found in this organization' });
                return;
            }
            if (appt.patientId.toString() !== patientId) {
                res.status(400).json({ message: 'Appointment does not belong to this patient' });
                return;
            }
            // Prevent duplicate check-in for the same appointment
            const existing = await checkIn_model_1.CheckIn.findOne({ appointmentId, organizationId, status: 'COMPLETED' });
            if (existing) {
                res.status(409).json({ message: 'Patient already checked in for this appointment', checkIn: existing });
                return;
            }
            // Only allow check-in if appointment is BOOKED or CONFIRMED
            if (!['BOOKED', 'CONFIRMED'].includes(appt.status)) {
                res.status(400).json({ message: `Cannot check in for an appointment in status: ${appt.status}` });
                return;
            }
        }
        const checkIn = await checkIn_model_1.CheckIn.create({
            organizationId,
            patientId,
            appointmentId: appointmentId || undefined,
            locationId: locationId || undefined,
            source: source || 'RECEPTION',
            checkInTime: new Date(),
            status: 'COMPLETED',
        });
        // Sync appointment → CHECKED_IN
        if (appointmentId) {
            await appointment_model_1.Appointment.findOneAndUpdate({ _id: appointmentId, organizationId }, { status: 'CHECKED_IN' });
        }
        audit_service_1.AuditService.log({
            organizationId: organizationId.toString(),
            actorUserId: req.user.id,
            actorRole: req.user.role,
            action: 'CREATE',
            entityType: 'CheckIn',
            entityId: checkIn._id.toString(),
            metadata: { source: checkIn.source, status: 'COMPLETED' },
            ipAddress: req.ip
        });
        notification_service_1.notificationService.notify({
            event: 'CHECKIN_COMPLETED',
            organizationId: organizationId.toString(),
            patientId,
            context: { checkInId: checkIn._id, appointmentId, source: checkIn.source },
        });
        res.status(201).json(checkIn);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to create check-in', error });
    }
};
exports.createCheckIn = createCheckIn;
/**
 * GET /api/check-ins
 * Lists today's check-ins for the organization.
 */
const getCheckIns = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const filter = {
            organizationId,
            checkInTime: { $gte: startOfDay },
        };
        if (req.query.locationId)
            filter.locationId = req.query.locationId;
        const checkIns = await checkIn_model_1.CheckIn.find(filter)
            .populate('patientId', 'firstName lastName contactPhone')
            .populate('appointmentId', 'scheduledStartTime status practitionerId')
            .sort({ checkInTime: -1 });
        res.status(200).json(checkIns);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch check-ins', error });
    }
};
exports.getCheckIns = getCheckIns;
/**
 * GET /api/check-ins/:id
 */
const getCheckInById = async (req, res) => {
    try {
        const checkIn = await checkIn_model_1.CheckIn.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId,
        })
            .populate('patientId', 'firstName lastName contactPhone')
            .populate('appointmentId', 'scheduledStartTime practitionerId departmentId status');
        if (!checkIn) {
            res.status(404).json({ message: 'Check-in not found' });
            return;
        }
        res.status(200).json(checkIn);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch check-in', error });
    }
};
exports.getCheckInById = getCheckInById;
//# sourceMappingURL=checkIn.controller.js.map