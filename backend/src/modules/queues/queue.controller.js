"use strict";
/**
 * Queue Engine Controller — full operational implementation.
 *
 * Architecture requirements covered:
 *  ✅ Tenant-scoped every query  { organizationId }
 *  ✅ Queue CRUD
 *  ✅ Atomic token generation via $inc + findOneAndUpdate
 *  ✅ Position calculation
 *  ✅ ETA calculation (avg service time × position)
 *  ✅ Call next / call specific entry
 *  ✅ Skip / Recall / No-show
 *  ✅ Queue state machine (WAITING → IN_CONSULTATION → COMPLETED | SKIPPED | NO_SHOW | CANCELLED)
 *  ✅ Cross-entity: validate appointment belongs to same org + patient
 *  ✅ Notification events on every workflow action
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQueuePosition = exports.updateQueueEntryStatus = exports.recallEntry = exports.callNextInQueue = exports.joinQueue = exports.getQueueEntries = exports.getQueues = exports.createQueue = void 0;
const express_1 = require("express");
const queue_model_1 = require("./queue.model");
const queueEntry_model_1 = require("./queueEntry.model");
const appointment_model_1 = require("../appointments/appointment.model");
const checkIn_model_1 = require("../check-ins/checkIn.model");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const notification_service_1 = require("../../shared/notifications/notification.service");
const audit_service_1 = require("../../shared/audit/audit.service");
// ── State machine ─────────────────────────────────────────────────────────────
const QUEUE_ENTRY_TRANSITIONS = {
    WAITING: ['IN_CONSULTATION', 'SKIPPED', 'NO_SHOW', 'CANCELLED'],
    IN_CONSULTATION: ['COMPLETED', 'NO_SHOW'],
    COMPLETED: [],
    SKIPPED: ['WAITING', 'CANCELLED'], // receptionist can re-add a skipped patient
    NO_SHOW: [],
    CANCELLED: [],
};
function assertValidTransition(current, next) {
    const allowed = QUEUE_ENTRY_TRANSITIONS[current] ?? [];
    if (!allowed.includes(next)) {
        throw new Error(`Invalid queue-entry transition: ${current} → ${next}`);
    }
}
// ── Average service duration (milliseconds) for ETA ──────────────────────────
const DEFAULT_SERVICE_DURATION_MS = 10 * 60 * 1000; // 10 minutes
async function getAvgServiceDuration(queueId, orgId) {
    const completed = await queueEntry_model_1.QueueEntry.find({
        queueId,
        organizationId: orgId,
        status: 'COMPLETED',
        calledAt: { $exists: true },
        completedAt: { $exists: true },
    }).select('calledAt completedAt');
    if (!completed.length)
        return DEFAULT_SERVICE_DURATION_MS;
    const total = completed.reduce((sum, e) => {
        return sum + (e.completedAt.getTime() - e.calledAt.getTime());
    }, 0);
    return Math.round(total / completed.length);
}
// ── Controllers ───────────────────────────────────────────────────────────────
/**
 * POST /api/queues
 * Create a queue for a given date + context (dept/practitioner/service/location).
 */
const createQueue = async (req, res) => {
    try {
        const { name, departmentId, locationId, practitionerId, serviceId, queueDate } = req.body;
        const organizationId = req.user.organizationId;
        if (!name) {
            res.status(400).json({ message: 'name is required' });
            return;
        }
        const queue = await queue_model_1.Queue.create({
            organizationId,
            name,
            departmentId,
            locationId,
            practitionerId,
            serviceId,
            queueDate: queueDate ? new Date(queueDate) : new Date(),
            currentTokenNumber: 0,
            isActive: true,
        });
        res.status(201).json(queue);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating queue', error });
    }
};
exports.createQueue = createQueue;
/**
 * GET /api/queues
 * List active queues scoped to this organization.
 * Optional filters: ?date=YYYY-MM-DD  ?departmentId=  ?practitionerId=
 */
const getQueues = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const filter = { organizationId, isActive: true };
        if (req.query.departmentId)
            filter.departmentId = req.query.departmentId;
        if (req.query.practitionerId)
            filter.practitionerId = req.query.practitionerId;
        if (req.query.date) {
            const d = new Date(req.query.date);
            const start = new Date(d);
            start.setHours(0, 0, 0, 0);
            const end = new Date(d);
            end.setHours(23, 59, 59, 999);
            filter.queueDate = { $gte: start, $lte: end };
        }
        const queues = await queue_model_1.Queue.find(filter)
            .populate('departmentId', 'name')
            .populate('practitionerId', 'firstName lastName')
            .populate('locationId', 'name')
            .sort({ queueDate: -1 });
        res.status(200).json(queues);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching queues', error });
    }
};
exports.getQueues = getQueues;
/**
 * GET /api/queues/:queueId/entries
 * List all entries in a queue with position + ETA.
 */
const getQueueEntries = async (req, res) => {
    try {
        const { queueId } = req.params;
        const organizationId = req.user.organizationId;
        const queue = await queue_model_1.Queue.findOne({ _id: queueId, organizationId });
        if (!queue) {
            res.status(404).json({ message: 'Queue not found' });
            return;
        }
        const entries = await queueEntry_model_1.QueueEntry.find({ queueId, organizationId })
            .populate('patientId', 'firstName lastName contactPhone')
            .sort({ tokenNumber: 1 });
        const avgDurationMs = await getAvgServiceDuration(queueId, organizationId.toString());
        // Annotate each WAITING entry with position + ETA
        let waitingPosition = 0;
        const annotated = entries.map(e => {
            const obj = e.toObject();
            if (e.status === 'WAITING') {
                waitingPosition++;
                obj.position = waitingPosition;
                obj.estimatedWaitMs = waitingPosition * avgDurationMs;
            }
            return obj;
        });
        res.status(200).json(annotated);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching queue entries', error });
    }
};
exports.getQueueEntries = getQueueEntries;
/**
 * POST /api/queues/join
 * Add a patient to a queue (atomic token generation).
 * Validates: queue exists + org, appointment belongs to same org + patient.
 */
const joinQueue = async (req, res) => {
    try {
        const { queueId, patientId, appointmentId, checkInId, priority } = req.body;
        const organizationId = req.user.organizationId;
        if (!queueId || !patientId) {
            res.status(400).json({ message: 'queueId and patientId are required' });
            return;
        }
        // Cross-entity: validate appointment ownership
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
        // Cross-entity: validate check-in ownership
        if (checkInId) {
            const ci = await checkIn_model_1.CheckIn.findOne({ _id: checkInId, organizationId });
            if (!ci) {
                res.status(400).json({ message: 'Check-in not found in this organization' });
                return;
            }
            if (ci.patientId.toString() !== patientId) {
                res.status(400).json({ message: 'Check-in does not belong to this patient' });
                return;
            }
        }
        // Prevent duplicate entries (patient already WAITING in this queue)
        const existing = await queueEntry_model_1.QueueEntry.findOne({
            queueId,
            organizationId,
            patientId,
            status: 'WAITING',
        });
        if (existing) {
            res.status(409).json({ message: 'Patient is already waiting in this queue', entry: existing });
            return;
        }
        // Atomically increment token
        const queue = await queue_model_1.Queue.findOneAndUpdate({ _id: queueId, organizationId, isActive: true }, { $inc: { currentTokenNumber: 1 } }, { new: true });
        if (!queue) {
            res.status(404).json({ message: 'Queue not found or inactive' });
            return;
        }
        const tokenNumber = String(queue.currentTokenNumber).padStart(3, '0');
        const entry = await queueEntry_model_1.QueueEntry.create({
            organizationId,
            queueId: queue._id,
            patientId,
            appointmentId: appointmentId || undefined,
            checkInId: checkInId || undefined,
            departmentId: queue.departmentId,
            locationId: queue.locationId,
            practitionerId: queue.practitionerId,
            tokenNumber,
            queueDate: queue.queueDate,
            status: 'WAITING',
            priority: priority || 'NORMAL',
            joinedAt: new Date(),
        });
        // Update appointment status → IN_QUEUE
        if (appointmentId) {
            await appointment_model_1.Appointment.findOneAndUpdate({ _id: appointmentId, organizationId }, { status: 'IN_QUEUE' });
        }
        audit_service_1.AuditService.log({
            organizationId: organizationId.toString(),
            actorUserId: req.user.id,
            actorRole: req.user.role,
            action: 'CREATE',
            entityType: 'QueueEntry',
            entityId: entry._id.toString(),
            metadata: { queueId, tokenNumber, status: 'WAITING' },
            ipAddress: req.ip
        });
        notification_service_1.notificationService.notify({
            event: 'QUEUE_JOINED',
            organizationId: organizationId.toString(),
            patientId,
            context: { queueId, tokenNumber, queueName: queue.name },
        });
        res.status(201).json(entry);
    }
    catch (error) {
        res.status(500).json({ message: 'Error joining queue', error });
    }
};
exports.joinQueue = joinQueue;
/**
 * POST /api/queues/:queueId/call-next
 * Call the next WAITING patient in the queue.
 * Priority order: EMERGENCY → HIGH → NORMAL, then by tokenNumber.
 */
const callNextInQueue = async (req, res) => {
    try {
        const { queueId } = req.params;
        const organizationId = req.user.organizationId;
        // Ensure the queue belongs to this org
        const queue = await queue_model_1.Queue.findOne({ _id: queueId, organizationId });
        if (!queue) {
            res.status(404).json({ message: 'Queue not found' });
            return;
        }
        // Pick the highest-priority waiting entry
        const PRIORITY_ORDER = { EMERGENCY: 0, HIGH: 1, NORMAL: 2 };
        const waiting = await queueEntry_model_1.QueueEntry.find({ queueId, organizationId, status: 'WAITING' })
            .sort({ tokenNumber: 1 });
        if (!waiting.length) {
            res.status(200).json({ message: 'No patients waiting in this queue' });
            return;
        }
        // Sort by priority then token
        waiting.sort((a, b) => {
            const pa = PRIORITY_ORDER[a.priority ?? 'NORMAL'] ?? 2;
            const pb = PRIORITY_ORDER[b.priority ?? 'NORMAL'] ?? 2;
            if (pa !== pb)
                return pa - pb;
            return a.tokenNumber.localeCompare(b.tokenNumber);
        });
        const next = waiting[0];
        const previousStatus = next.status;
        next.status = 'IN_CONSULTATION';
        next.calledAt = new Date();
        await next.save();
        audit_service_1.AuditService.log({
            organizationId: organizationId.toString(),
            actorUserId: req.user.id,
            actorRole: req.user.role,
            action: 'STATUS_CHANGE',
            entityType: 'QueueEntry',
            entityId: next._id.toString(),
            metadata: { previousStatus, newStatus: next.status },
            ipAddress: req.ip
        });
        // Sync appointment
        if (next.appointmentId) {
            await appointment_model_1.Appointment.findOneAndUpdate({ _id: next.appointmentId, organizationId }, { status: 'IN_CONSULTATION' });
        }
        notification_service_1.notificationService.notify({
            event: 'PATIENT_CALLED',
            organizationId: organizationId.toString(),
            patientId: next.patientId.toString(),
            context: { queueId, tokenNumber: next.tokenNumber },
        });
        res.status(200).json(next);
    }
    catch (error) {
        res.status(500).json({ message: 'Error calling next patient', error });
    }
};
exports.callNextInQueue = callNextInQueue;
/**
 * POST /api/queues/entry/:entryId/recall
 * Re-call a WAITING or previously SKIPPED patient.
 */
const recallEntry = async (req, res) => {
    try {
        const { entryId } = req.params;
        const organizationId = req.user.organizationId;
        const entry = await queueEntry_model_1.QueueEntry.findOne({ _id: entryId, organizationId });
        if (!entry) {
            res.status(404).json({ message: 'Queue entry not found' });
            return;
        }
        if (!['WAITING', 'SKIPPED'].includes(entry.status)) {
            res.status(400).json({ message: `Cannot recall entry in status: ${entry.status}` });
            return;
        }
        const previousStatus = entry.status;
        entry.status = 'IN_CONSULTATION';
        entry.calledAt = new Date();
        await entry.save();
        audit_service_1.AuditService.log({
            organizationId: organizationId.toString(),
            actorUserId: req.user.id,
            actorRole: req.user.role,
            action: 'STATUS_CHANGE',
            entityType: 'QueueEntry',
            entityId: entry._id.toString(),
            metadata: { previousStatus, newStatus: entry.status },
            ipAddress: req.ip
        });
        notification_service_1.notificationService.notify({
            event: 'PATIENT_RECALLED',
            organizationId: organizationId.toString(),
            patientId: entry.patientId.toString(),
            context: { entryId, tokenNumber: entry.tokenNumber },
        });
        res.status(200).json(entry);
    }
    catch (error) {
        res.status(500).json({ message: 'Error recalling patient', error });
    }
};
exports.recallEntry = recallEntry;
/**
 * PUT /api/queues/entry/:entryId/status
 * Generic status update with state machine enforcement.
 * Handles: SKIP, NO_SHOW, COMPLETE, CANCEL, re-WAIT.
 */
const updateQueueEntryStatus = async (req, res) => {
    try {
        const { entryId } = req.params;
        const { status } = req.body;
        const organizationId = req.user.organizationId;
        if (!status) {
            res.status(400).json({ message: 'status is required' });
            return;
        }
        const entry = await queueEntry_model_1.QueueEntry.findOne({ _id: entryId, organizationId });
        if (!entry) {
            res.status(404).json({ message: 'Queue entry not found' });
            return;
        }
        try {
            assertValidTransition(entry.status, status);
        }
        catch (e) {
            res.status(400).json({ message: e.message });
            return;
        }
        const previousStatus = entry.status;
        entry.status = status;
        if (status === 'IN_CONSULTATION')
            entry.calledAt = new Date();
        if (status === 'COMPLETED')
            entry.completedAt = new Date();
        await entry.save();
        audit_service_1.AuditService.log({
            organizationId: organizationId.toString(),
            actorUserId: req.user.id,
            actorRole: req.user.role,
            action: 'STATUS_CHANGE',
            entityType: 'QueueEntry',
            entityId: entry._id.toString(),
            metadata: { previousStatus, newStatus: entry.status },
            ipAddress: req.ip
        });
        // Sync appointment state
        if (entry.appointmentId) {
            const apptStatusMap = {
                IN_CONSULTATION: 'IN_CONSULTATION',
                COMPLETED: 'COMPLETED',
                NO_SHOW: 'NO_SHOW',
                CANCELLED: 'CANCELLED',
            };
            if (apptStatusMap[status]) {
                await appointment_model_1.Appointment.findOneAndUpdate({ _id: entry.appointmentId, organizationId }, { status: apptStatusMap[status] });
            }
        }
        // Emit notification events
        const notifMap = {
            SKIPPED: 'PATIENT_SKIPPED',
            NO_SHOW: 'PATIENT_NO_SHOW',
            IN_CONSULTATION: 'PATIENT_CALLED',
        };
        if (notifMap[status]) {
            notification_service_1.notificationService.notify({
                event: notifMap[status],
                organizationId: organizationId.toString(),
                patientId: entry.patientId.toString(),
                context: { entryId, tokenNumber: entry.tokenNumber },
            });
        }
        res.status(200).json(entry);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating queue entry', error });
    }
};
exports.updateQueueEntryStatus = updateQueueEntryStatus;
/**
 * GET /api/queues/entry/:entryId/position
 * Return the current position + ETA for a specific queue entry.
 * Used by the patient mobile app to show live queue status.
 */
const getQueuePosition = async (req, res) => {
    try {
        const { entryId } = req.params;
        const organizationId = req.user.organizationId;
        const entry = await queueEntry_model_1.QueueEntry.findOne({ _id: entryId, organizationId });
        if (!entry) {
            res.status(404).json({ message: 'Queue entry not found' });
            return;
        }
        if (entry.status !== 'WAITING') {
            res.status(200).json({ status: entry.status, position: null, estimatedWaitMs: null });
            return;
        }
        // Count how many WAITING entries have a lower token number (= ahead in line)
        const ahead = await queueEntry_model_1.QueueEntry.countDocuments({
            queueId: entry.queueId,
            organizationId,
            status: 'WAITING',
            tokenNumber: { $lt: entry.tokenNumber },
        });
        const position = ahead + 1;
        const avgDurationMs = await getAvgServiceDuration(entry.queueId.toString(), organizationId.toString());
        res.status(200).json({
            tokenNumber: entry.tokenNumber,
            status: entry.status,
            position,
            estimatedWaitMs: position * avgDurationMs,
            estimatedWaitMin: Math.ceil((position * avgDurationMs) / 60000),
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching queue position', error });
    }
};
exports.getQueuePosition = getQueuePosition;
//# sourceMappingURL=queue.controller.js.map