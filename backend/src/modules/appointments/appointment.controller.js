"use strict";
/**
 * Appointment Controller
 *
 * Architecture compliance:
 *  ✅ All queries scoped to organizationId (tenant isolation)
 *  ✅ State machine enforced (VALID_TRANSITIONS)
 *  ✅ Notification events emitted on every status change
 *  ✅ Cross-entity: patient validated when creating appointment
 *  ✅ No SUPER_ADMIN — standardized roles only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelAppointment = exports.updateAppointmentStatus = exports.getPractitionerAppointments = exports.getAppointmentById = exports.getAppointments = exports.getMyAppointments = exports.createAppointment = void 0;
const express_1 = require("express");
const appointment_model_1 = require("./appointment.model");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const patient_model_1 = require("../patients/patient.model");
const practitionerDepartment_model_1 = require("../practitioners/practitionerDepartment.model");
const notification_service_1 = require("../../shared/notifications/notification.service");
const audit_service_1 = require("../../shared/audit/audit.service");
// ── State machine ─────────────────────────────────────────────────────────────
const VALID_TRANSITIONS = {
    BOOKED: ['CONFIRMED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW'],
    CONFIRMED: ['CHECKED_IN', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW'],
    CHECKED_IN: ['IN_QUEUE', 'CANCELLED', 'NO_SHOW'],
    IN_QUEUE: ['IN_CONSULTATION', 'CANCELLED', 'NO_SHOW'],
    IN_CONSULTATION: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
    NO_SHOW: [],
    RESCHEDULED: ['BOOKED'], // Rescheduled can re-enter as BOOKED
};
// ── Controllers ───────────────────────────────────────────────────────────────
/**
 * POST /api/appointments
 */
const createAppointment = async (req, res) => {
    try {
        const { patientId, practitionerId, departmentId, serviceId, locationId, date, scheduledStartTime, scheduledEndTime, source, } = req.body;
        const organizationId = req.user.organizationId;
        if (!patientId || !date) {
            res.status(400).json({ message: 'patientId and date are required' });
            return;
        }
        // Cross-entity: confirm patient belongs to this org
        const patient = await patient_model_1.Patient.findOne({ _id: patientId, organizationId });
        if (!patient) {
            res.status(400).json({ message: 'Patient not found in this organization' });
            return;
        }
        // Cross-entity validation: confirm practitioner provides this service in this department
        if (practitionerId && departmentId && serviceId) {
            const practDept = await practitionerDepartment_model_1.PractitionerDepartment.findOne({
                organizationId,
                practitionerId,
                departmentId,
                isActive: true
            });
            if (!practDept) {
                res.status(400).json({ message: 'Practitioner does not operate in this department' });
                return;
            }
            if (!practDept.serviceIds.includes(serviceId)) {
                res.status(400).json({ message: 'Practitioner does not provide this service in this department' });
                return;
            }
        }
        const appointment = await appointment_model_1.Appointment.create({
            organizationId,
            patientId,
            practitionerId,
            departmentId,
            serviceId,
            locationId,
            date: new Date(date),
            scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime) : undefined,
            scheduledEndTime: scheduledEndTime ? new Date(scheduledEndTime) : undefined,
            source: source || 'ONLINE',
            status: 'BOOKED',
        });
        // Fire audit event
        audit_service_1.AuditService.log({
            organizationId: organizationId.toString(),
            actorUserId: req.user.id,
            actorRole: req.user.role,
            action: 'CREATE',
            entityType: 'Appointment',
            entityId: appointment._id.toString(),
            metadata: { source: appointment.source, status: 'BOOKED' },
            ipAddress: req.ip
        });
        notification_service_1.notificationService.notify({
            event: 'APPOINTMENT_BOOKED',
            organizationId: organizationId.toString(),
            patientId,
            context: { appointmentId: appointment._id, date, source },
        });
        res.status(201).json(appointment);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating appointment', error });
    }
};
exports.createAppointment = createAppointment;
/**
 * GET /api/appointments/mine
 * Patient: their own appointments (tenant-scoped).
 */
const getMyAppointments = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const appointments = await appointment_model_1.Appointment.find({
            patientId: req.user.id,
            organizationId,
        })
            .populate('practitionerId', 'firstName lastName type')
            .populate('departmentId', 'name')
            .populate('serviceId', 'name')
            .sort({ date: -1 });
        res.status(200).json(appointments);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching appointments', error });
    }
};
exports.getMyAppointments = getMyAppointments;
/**
 * GET /api/appointments
 * Staff/Admin: all appointments for the org, with optional filters.
 */
const getAppointments = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const filter = { organizationId };
        if (req.query.date) {
            const d = new Date(req.query.date);
            const start = new Date(d);
            start.setHours(0, 0, 0, 0);
            const end = new Date(d);
            end.setHours(23, 59, 59, 999);
            filter.date = { $gte: start, $lte: end };
        }
        if (req.query.status)
            filter.status = req.query.status;
        if (req.query.practitionerId)
            filter.practitionerId = req.query.practitionerId;
        if (req.query.departmentId)
            filter.departmentId = req.query.departmentId;
        if (req.query.patientId)
            filter.patientId = req.query.patientId;
        const appointments = await appointment_model_1.Appointment.find(filter)
            .populate('patientId', 'firstName lastName contactPhone')
            .populate('practitionerId', 'firstName lastName type')
            .populate('departmentId', 'name')
            .populate('serviceId', 'name')
            .sort({ date: 1, scheduledStartTime: 1 });
        res.status(200).json(appointments);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching appointments', error });
    }
};
exports.getAppointments = getAppointments;
/**
 * GET /api/appointments/:id
 */
const getAppointmentById = async (req, res) => {
    try {
        const appointment = await appointment_model_1.Appointment.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId,
        })
            .populate('patientId', 'firstName lastName contactPhone')
            .populate('practitionerId', 'firstName lastName type')
            .populate('departmentId', 'name')
            .populate('serviceId', 'name');
        if (!appointment) {
            res.status(404).json({ message: 'Appointment not found' });
            return;
        }
        res.status(200).json(appointment);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching appointment', error });
    }
};
exports.getAppointmentById = getAppointmentById;
/**
 * GET /api/appointments/practitioner/:practitionerId
 */
const getPractitionerAppointments = async (req, res) => {
    try {
        const { practitionerId } = req.params;
        const organizationId = req.user.organizationId;
        const filter = { practitionerId, organizationId };
        if (req.query.date) {
            const d = new Date(req.query.date);
            const start = new Date(d);
            start.setHours(0, 0, 0, 0);
            const end = new Date(d);
            end.setHours(23, 59, 59, 999);
            filter.date = { $gte: start, $lte: end };
        }
        const appointments = await appointment_model_1.Appointment.find(filter)
            .populate('patientId', 'firstName lastName contactPhone')
            .sort({ date: 1, scheduledStartTime: 1 });
        res.status(200).json(appointments);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching appointments', error });
    }
};
exports.getPractitionerAppointments = getPractitionerAppointments;
/**
 * PATCH /api/appointments/:id/status
 * State machine enforced. Fires notification events.
 */
const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const organizationId = req.user.organizationId;
        if (!status) {
            res.status(400).json({ message: 'status is required' });
            return;
        }
        const appointment = await appointment_model_1.Appointment.findOne({ _id: id, organizationId });
        if (!appointment) {
            res.status(404).json({ message: 'Appointment not found' });
            return;
        }
        const validNext = VALID_TRANSITIONS[appointment.status] ?? [];
        if (!validNext.includes(status)) {
            res.status(400).json({
                message: `Invalid transition: ${appointment.status} → ${status}`,
                allowedTransitions: validNext,
            });
            return;
        }
        const previousStatus = appointment.status;
        appointment.status = status;
        await appointment.save();
        // Fire audit log for state transition
        audit_service_1.AuditService.log({
            organizationId: organizationId.toString(),
            actorUserId: req.user.id,
            actorRole: req.user.role,
            action: 'STATUS_CHANGE',
            entityType: 'Appointment',
            entityId: appointment._id.toString(),
            metadata: { previousStatus, newStatus: status },
            ipAddress: req.ip
        });
        // Emit notification events for meaningful transitions
        const eventMap = {
            CONFIRMED: 'APPOINTMENT_CONFIRMED',
            CANCELLED: 'APPOINTMENT_CANCELLED',
            RESCHEDULED: 'APPOINTMENT_RESCHEDULED',
        };
        if (eventMap[status]) {
            notification_service_1.notificationService.notify({
                event: eventMap[status],
                organizationId: organizationId.toString(),
                patientId: appointment.patientId.toString(),
                context: { appointmentId: id, status },
            });
        }
        res.status(200).json(appointment);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating appointment', error });
    }
};
exports.updateAppointmentStatus = updateAppointmentStatus;
/**
 * DELETE /api/appointments/:id
 * Soft-cancel only — enforces state machine.
 */
const cancelAppointment = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const appointment = await appointment_model_1.Appointment.findOne({ _id: req.params.id, organizationId });
        if (!appointment) {
            res.status(404).json({ message: 'Appointment not found' });
            return;
        }
        const validNext = VALID_TRANSITIONS[appointment.status] ?? [];
        if (!validNext.includes('CANCELLED')) {
            res.status(400).json({ message: `Cannot cancel an appointment in status: ${appointment.status}` });
            return;
        }
        const previousStatus = appointment.status;
        appointment.status = 'CANCELLED';
        await appointment.save();
        audit_service_1.AuditService.log({
            organizationId: organizationId.toString(),
            actorUserId: req.user.id,
            actorRole: req.user.role,
            action: 'CANCEL',
            entityType: 'Appointment',
            entityId: appointment._id.toString(),
            metadata: { previousStatus, newStatus: 'CANCELLED' },
            ipAddress: req.ip
        });
        notification_service_1.notificationService.notify({
            event: 'APPOINTMENT_CANCELLED',
            organizationId: organizationId.toString(),
            patientId: appointment.patientId.toString(),
            context: { appointmentId: appointment._id },
        });
        res.status(200).json({ message: 'Appointment cancelled', appointment });
    }
    catch (error) {
        res.status(500).json({ message: 'Error cancelling appointment', error });
    }
};
exports.cancelAppointment = cancelAppointment;
//# sourceMappingURL=appointment.controller.js.map