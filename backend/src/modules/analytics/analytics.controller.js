"use strict";
/**
 * Analytics Controller — operational metrics.
 *
 * Architecture requirement: calculate from Appointments, CheckIns, QueueEntries, Visits.
 * Not just total counts — operational dashboard metrics for today.
 *
 * All queries are strictly scoped to organizationId.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQueuePerformance = exports.getDashboardOverview = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const organization_model_1 = require("../organizations/organization.model");
const patient_model_1 = require("../patients/patient.model");
const appointment_model_1 = require("../appointments/appointment.model");
const checkIn_model_1 = require("../check-ins/checkIn.model");
const queueEntry_model_1 = require("../queues/queueEntry.model");
const visit_model_1 = require("../visits/visit.model");
/** Midnight → 23:59:59 for today */
function todayRange() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
}
/** Average milliseconds between two date fields across a set of documents */
function avgMs(docs, fieldA, fieldB) {
    const valid = docs.filter(d => d[fieldA] && d[fieldB]);
    if (!valid.length)
        return 0;
    const total = valid.reduce((sum, d) => sum + (d[fieldB].getTime() - d[fieldA].getTime()), 0);
    return Math.round(total / valid.length);
}
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/analytics/dashboard
// ─────────────────────────────────────────────────────────────────────────────
const getDashboardOverview = async (req, res) => {
    try {
        // PLATFORM_ADMIN sees global cross-tenant totals
        if (req.user?.role === 'PLATFORM_ADMIN') {
            const [totalOrganizations, totalPatients, totalAppointments, totalVisits] = await Promise.all([
                organization_model_1.Organization.countDocuments(),
                patient_model_1.Patient.countDocuments(),
                appointment_model_1.Appointment.countDocuments(),
                visit_model_1.Visit.countDocuments(),
            ]);
            res.json({ totalOrganizations, totalPatients, totalAppointments, totalVisits });
            return;
        }
        const organizationId = req.user.organizationId;
        const { start, end } = todayRange();
        // ── Today's appointment breakdown ────────────────────────────────────────
        const [todayTotal, todayCompleted, todayCancelled, todayNoShow, todayWalkIn, todayInProgress,] = await Promise.all([
            appointment_model_1.Appointment.countDocuments({ organizationId, date: { $gte: start, $lte: end } }),
            appointment_model_1.Appointment.countDocuments({ organizationId, date: { $gte: start, $lte: end }, status: 'COMPLETED' }),
            appointment_model_1.Appointment.countDocuments({ organizationId, date: { $gte: start, $lte: end }, status: 'CANCELLED' }),
            appointment_model_1.Appointment.countDocuments({ organizationId, date: { $gte: start, $lte: end }, status: 'NO_SHOW' }),
            appointment_model_1.Appointment.countDocuments({ organizationId, date: { $gte: start, $lte: end }, source: 'WALK_IN' }),
            appointment_model_1.Appointment.countDocuments({ organizationId, date: { $gte: start, $lte: end }, status: 'IN_CONSULTATION' }),
        ]);
        // ── Queue metrics ────────────────────────────────────────────────────────
        const [currentlyWaiting, todayServed,] = await Promise.all([
            queueEntry_model_1.QueueEntry.countDocuments({ organizationId, queueDate: { $gte: start, $lte: end }, status: 'WAITING' }),
            queueEntry_model_1.QueueEntry.countDocuments({ organizationId, queueDate: { $gte: start, $lte: end }, status: 'COMPLETED' }),
        ]);
        // ── Wait time: time from joinedAt to calledAt (COMPLETED today) ──────────
        const completedEntries = await queueEntry_model_1.QueueEntry.find({
            organizationId,
            queueDate: { $gte: start, $lte: end },
            status: 'COMPLETED',
            joinedAt: { $exists: true },
            calledAt: { $exists: true },
            completedAt: { $exists: true },
        }).select('joinedAt calledAt completedAt').lean();
        const avgWaitMs = avgMs(completedEntries, 'joinedAt', 'calledAt');
        const avgConsultMs = avgMs(completedEntries, 'calledAt', 'completedAt');
        // ── Visit metrics ────────────────────────────────────────────────────────
        const [totalVisitsToday, completedVisitsToday] = await Promise.all([
            visit_model_1.Visit.countDocuments({ organizationId, createdAt: { $gte: start, $lte: end } }),
            visit_model_1.Visit.countDocuments({ organizationId, createdAt: { $gte: start, $lte: end }, status: 'COMPLETED' }),
        ]);
        // ── Check-in metrics ─────────────────────────────────────────────────────
        const todayCheckIns = await checkIn_model_1.CheckIn.countDocuments({
            organizationId,
            checkInTime: { $gte: start, $lte: end },
        });
        // ── Lifetime totals ──────────────────────────────────────────────────────
        const [totalPatients, totalAppointmentsAll] = await Promise.all([
            patient_model_1.Patient.countDocuments({ organizationId }),
            appointment_model_1.Appointment.countDocuments({ organizationId }),
        ]);
        res.json({
            today: {
                appointments: {
                    total: todayTotal,
                    completed: todayCompleted,
                    cancelled: todayCancelled,
                    noShow: todayNoShow,
                    walkIn: todayWalkIn,
                    inProgress: todayInProgress,
                },
                checkIns: todayCheckIns,
                queue: {
                    currentlyWaiting,
                    served: todayServed,
                    avgWaitMin: Math.round(avgWaitMs / 60000),
                    avgConsultMin: Math.round(avgConsultMs / 60000),
                },
                visits: {
                    total: totalVisitsToday,
                    completed: completedVisitsToday,
                },
            },
            lifetime: {
                totalPatients,
                totalAppointments: totalAppointmentsAll,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching analytics overview', error });
    }
};
exports.getDashboardOverview = getDashboardOverview;
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/analytics/queue-performance
// ─────────────────────────────────────────────────────────────────────────────
const getQueuePerformance = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const days = parseInt(req.query.days || '7', 10);
        const since = new Date();
        since.setDate(since.getDate() - days);
        since.setHours(0, 0, 0, 0);
        const entries = await queueEntry_model_1.QueueEntry.find({
            organizationId,
            queueDate: { $gte: since },
            status: 'COMPLETED',
            joinedAt: { $exists: true },
            calledAt: { $exists: true },
            completedAt: { $exists: true },
        }).select('joinedAt calledAt completedAt queueDate').lean();
        const avgWaitMs = avgMs(entries, 'joinedAt', 'calledAt');
        const avgConsultMs = avgMs(entries, 'calledAt', 'completedAt');
        const totalServed = entries.length;
        const noShows = await queueEntry_model_1.QueueEntry.countDocuments({
            organizationId,
            queueDate: { $gte: since },
            status: 'NO_SHOW',
        });
        res.json({
            periodDays: days,
            totalServed,
            noShows,
            avgWaitMin: Math.round(avgWaitMs / 60000),
            avgConsultMin: Math.round(avgConsultMs / 60000),
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching queue performance', error });
    }
};
exports.getQueuePerformance = getQueuePerformance;
//# sourceMappingURL=analytics.controller.js.map