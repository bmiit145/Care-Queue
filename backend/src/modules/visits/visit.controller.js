"use strict";
/**
 * Visit / Encounter Controller — operational boundary for consultations.
 *
 * Architecture compliance:
 *  ✅ All queries scoped to organizationId (tenant isolation)
 *  ✅ State machine (CREATED → ARRIVED → IN_PROGRESS → COMPLETED | CANCELLED)
 *  ✅ Cross-entity: validate patient, appointment, queue entry belong to same org
 *  ✅ Notification events on start/complete
 *  ✅ Keep Visit lean — no clinical fields (notes, diagnosis stay in future bounded domains)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVisitStatus = exports.getVisitById = exports.getVisits = exports.createVisit = void 0;
const express_1 = require("express");
const visit_model_1 = require("./visit.model");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const patient_model_1 = require("../patients/patient.model");
const appointment_model_1 = require("../appointments/appointment.model");
const queueEntry_model_1 = require("../queues/queueEntry.model");
const notification_service_1 = require("../../shared/notifications/notification.service");
const audit_service_1 = require("../../shared/audit/audit.service");
// ── State machine ─────────────────────────────────────────────────────────────
const VISIT_TRANSITIONS = {
    CREATED: ['ARRIVED', 'CANCELLED'],
    ARRIVED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
};
function assertValidVisitTransition(current, next) {
    const allowed = VISIT_TRANSITIONS[current] ?? [];
    if (!allowed.includes(next)) {
        throw new Error(`Invalid visit transition: ${current} → ${next}`);
    }
}
// ── Controllers ───────────────────────────────────────────────────────────────
/**
 * POST /api/visits
 * Create a Visit/Encounter.
 * Cross-entity validates: patient, appointment, queue entry.
 */
const createVisit = async (req, res) => {
    try {
        const { appointmentId, patientId, practitionerId, departmentId, serviceId, locationId, checkInId, queueEntryId, } = req.body;
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
        }
        // Cross-entity: validate queue entry ownership + patient match
        if (queueEntryId) {
            const entry = await queueEntry_model_1.QueueEntry.findOne({ _id: queueEntryId, organizationId });
            if (!entry) {
                res.status(400).json({ message: 'Queue entry not found in this organization' });
                return;
            }
            if (entry.patientId.toString() !== patientId) {
                res.status(400).json({ message: 'Queue entry does not belong to this patient' });
                return;
            }
        }
        const visit = await visit_model_1.Visit.create({
            organizationId,
            appointmentId,
            patientId,
            practitionerId,
            departmentId,
            serviceId,
            locationId,
            checkInId,
            queueEntryId,
            status: 'CREATED',
        });
        audit_service_1.AuditService.log({
            organizationId: organizationId.toString(),
            actorUserId: req.user.id,
            actorRole: req.user.role,
            action: 'CREATE',
            entityType: 'Visit',
            entityId: visit._id.toString(),
            metadata: { appointmentId, queueEntryId, status: 'CREATED' },
            ipAddress: req.ip
        });
        res.status(201).json(visit);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating visit', error });
    }
};
exports.createVisit = createVisit;
/**
 * GET /api/visits
 * List visits for this organization. Optional filters: ?date=&patientId=&practitionerId=&status=
 */
const getVisits = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const filter = { organizationId };
        if (req.query.patientId)
            filter.patientId = req.query.patientId;
        if (req.query.practitionerId)
            filter.practitionerId = req.query.practitionerId;
        if (req.query.status)
            filter.status = req.query.status;
        if (req.query.date) {
            const d = new Date(req.query.date);
            const start = new Date(d);
            start.setHours(0, 0, 0, 0);
            const end = new Date(d);
            end.setHours(23, 59, 59, 999);
            filter.createdAt = { $gte: start, $lte: end };
        }
        const visits = await visit_model_1.Visit.find(filter)
            .populate('patientId', 'firstName lastName contactPhone')
            .populate('practitionerId', 'firstName lastName type')
            .populate('departmentId', 'name')
            .populate('serviceId', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json(visits);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching visits', error });
    }
};
exports.getVisits = getVisits;
/**
 * GET /api/visits/:id
 */
const getVisitById = async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user.organizationId;
        const visit = await visit_model_1.Visit.findOne({ _id: id, organizationId })
            .populate('patientId', 'firstName lastName contactPhone')
            .populate('practitionerId', 'firstName lastName type')
            .populate('departmentId', 'name')
            .populate('serviceId', 'name')
            .populate('appointmentId', 'date scheduledStartTime status')
            .populate('queueEntryId', 'tokenNumber status');
        if (!visit) {
            res.status(404).json({ message: 'Visit not found' });
            return;
        }
        res.status(200).json(visit);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching visit', error });
    }
};
exports.getVisitById = getVisitById;
/**
 * PATCH /api/visits/:id/status
 * State machine enforced. Fires notification events.
 */
const updateVisitStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const organizationId = req.user.organizationId;
        if (!status) {
            res.status(400).json({ message: 'status is required' });
            return;
        }
        const visit = await visit_model_1.Visit.findOne({ _id: id, organizationId });
        if (!visit) {
            res.status(404).json({ message: 'Visit not found' });
            return;
        }
        try {
            assertValidVisitTransition(visit.status, status);
        }
        catch (e) {
            res.status(400).json({ message: e.message, allowedTransitions: VISIT_TRANSITIONS[visit.status] });
            return;
        }
        const previousStatus = visit.status;
        visit.status = status;
        if (status === 'IN_PROGRESS')
            visit.startedAt = new Date();
        if (status === 'COMPLETED')
            visit.endedAt = new Date();
        await visit.save();
        audit_service_1.AuditService.log({
            organizationId: organizationId.toString(),
            actorUserId: req.user.id,
            actorRole: req.user.role,
            action: 'STATUS_CHANGE',
            entityType: 'Visit',
            entityId: visit._id.toString(),
            metadata: { previousStatus, newStatus: visit.status },
            ipAddress: req.ip
        });
        // Sync related entities when visit completes
        if (status === 'COMPLETED') {
            if (visit.appointmentId) {
                await appointment_model_1.Appointment.findOneAndUpdate({ _id: visit.appointmentId, organizationId }, { status: 'COMPLETED' });
            }
            if (visit.queueEntryId) {
                await queueEntry_model_1.QueueEntry.findOneAndUpdate({ _id: visit.queueEntryId, organizationId }, { status: 'COMPLETED', completedAt: new Date() });
            }
        }
        // Notification events
        const eventMap = {
            IN_PROGRESS: 'VISIT_STARTED',
            COMPLETED: 'VISIT_COMPLETED',
        };
        if (eventMap[status]) {
            notification_service_1.notificationService.notify({
                event: eventMap[status],
                organizationId: organizationId.toString(),
                patientId: visit.patientId.toString(),
                practitionerId: visit.practitionerId?.toString(),
                context: { visitId: id, status },
            });
        }
        res.status(200).json(visit);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating visit', error });
    }
};
exports.updateVisitStatus = updateVisitStatus;
//# sourceMappingURL=visit.controller.js.map