"use strict";
/**
 * Schedule Controller — full implementation.
 *
 * Covers:
 *  ✅ Create / list recurring schedules (tenant-scoped)
 *  ✅ Create / list schedule exceptions (leave, special days)
 *  ✅ GET /availability — calls the availability engine
 *  ✅ All queries scoped to organizationId
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailability = exports.getScheduleExceptions = exports.createScheduleException = exports.deleteSchedule = exports.updateSchedule = exports.getPractitionerSchedule = exports.getSchedules = exports.createSchedule = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const schedule_model_1 = __importDefault(require("./schedule.model"));
const schedule_exception_model_1 = __importDefault(require("./schedule-exception.model"));
const availability_service_1 = require("./availability.service");
// ── Recurring schedule CRUD ───────────────────────────────────────────────────
const createSchedule = async (req, res) => {
    try {
        const { practitionerId, dayOfWeek, startTime, endTime, departmentId, locationId } = req.body;
        const organizationId = req.user.organizationId;
        if (!practitionerId || dayOfWeek === undefined || !startTime || !endTime) {
            res.status(400).json({ message: 'practitionerId, dayOfWeek, startTime, and endTime are required' });
            return;
        }
        const schedule = await schedule_model_1.default.create({
            organizationId,
            practitionerId,
            dayOfWeek,
            startTime,
            endTime,
            departmentId,
            locationId,
        });
        res.status(201).json(schedule);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating schedule', error });
    }
};
exports.createSchedule = createSchedule;
const getSchedules = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const filter = { organizationId, isActive: true };
        if (req.query.practitionerId)
            filter.practitionerId = req.query.practitionerId;
        if (req.query.departmentId)
            filter.departmentId = req.query.departmentId;
        if (req.query.dayOfWeek !== undefined)
            filter.dayOfWeek = Number(req.query.dayOfWeek);
        const schedules = await schedule_model_1.default.find(filter)
            .populate('practitionerId', 'firstName lastName')
            .populate('departmentId', 'name')
            .sort({ dayOfWeek: 1, startTime: 1 });
        res.status(200).json(schedules);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching schedules', error });
    }
};
exports.getSchedules = getSchedules;
const getPractitionerSchedule = async (req, res) => {
    try {
        const { practitionerId } = req.params;
        const organizationId = req.user.organizationId;
        const schedules = await schedule_model_1.default.find({ organizationId, practitionerId, isActive: true })
            .sort({ dayOfWeek: 1, startTime: 1 });
        const exceptions = await schedule_exception_model_1.default.find({
            organizationId,
            practitionerId,
            date: { $gte: new Date() },
        }).sort({ date: 1 });
        res.status(200).json({ schedules, exceptions });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching schedule', error });
    }
};
exports.getPractitionerSchedule = getPractitionerSchedule;
const updateSchedule = async (req, res) => {
    try {
        const schedule = await schedule_model_1.default.findOneAndUpdate({ _id: req.params.id, organizationId: req.user.organizationId }, req.body, { new: true, runValidators: true });
        if (!schedule) {
            res.status(404).json({ message: 'Schedule not found' });
            return;
        }
        res.status(200).json(schedule);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating schedule', error });
    }
};
exports.updateSchedule = updateSchedule;
const deleteSchedule = async (req, res) => {
    try {
        const schedule = await schedule_model_1.default.findOneAndUpdate({ _id: req.params.id, organizationId: req.user.organizationId }, { isActive: false }, { new: true });
        if (!schedule) {
            res.status(404).json({ message: 'Schedule not found' });
            return;
        }
        res.status(200).json({ message: 'Schedule deactivated', schedule });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting schedule', error });
    }
};
exports.deleteSchedule = deleteSchedule;
// ── Schedule exceptions ───────────────────────────────────────────────────────
const createScheduleException = async (req, res) => {
    try {
        const { practitionerId, date, reason, isAvailable, startTime, endTime } = req.body;
        const organizationId = req.user.organizationId;
        if (!practitionerId || !date || !reason || isAvailable === undefined) {
            res.status(400).json({ message: 'practitionerId, date, reason, and isAvailable are required' });
            return;
        }
        const exception = await schedule_exception_model_1.default.create({
            organizationId,
            practitionerId,
            date: new Date(date),
            reason,
            isAvailable,
            startTime,
            endTime,
        });
        res.status(201).json(exception);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating schedule exception', error });
    }
};
exports.createScheduleException = createScheduleException;
const getScheduleExceptions = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const filter = { organizationId };
        if (req.query.practitionerId)
            filter.practitionerId = req.query.practitionerId;
        const exceptions = await schedule_exception_model_1.default.find(filter)
            .populate('practitionerId', 'firstName lastName')
            .sort({ date: 1 });
        res.status(200).json(exceptions);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching schedule exceptions', error });
    }
};
exports.getScheduleExceptions = getScheduleExceptions;
// ── Availability Engine ───────────────────────────────────────────────────────
/**
 * GET /api/schedules/availability
 * Query params: practitionerId (required), date (required), slotDurationMin (optional)
 *
 * Returns an array of { start, end } slots that are still open for booking.
 * The mobile app calls this to show the booking calendar.
 */
const getAvailability = async (req, res) => {
    try {
        const { practitionerId, date, slotDurationMin } = req.query;
        const organizationId = req.user.organizationId;
        if (!practitionerId || !date) {
            res.status(400).json({ message: 'practitionerId and date are required query params' });
            return;
        }
        const targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
            res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
            return;
        }
        const slots = await (0, availability_service_1.getAvailableSlots)({
            organizationId: organizationId.toString(),
            practitionerId,
            date: targetDate,
            slotDurationMin: slotDurationMin ? parseInt(slotDurationMin, 10) : 15,
        });
        res.status(200).json({ date, practitionerId, slots });
    }
    catch (error) {
        res.status(500).json({ message: 'Error computing availability', error });
    }
};
exports.getAvailability = getAvailability;
//# sourceMappingURL=schedule.controller.js.map