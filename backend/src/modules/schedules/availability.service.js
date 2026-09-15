"use strict";
/**
 * Availability Engine — computes open appointment slots.
 *
 * Architecture requirement:
 *   Recurring schedule
 *     + Schedule exception (leave / special working day)
 *     + Break times (future: add breaks to schedule model)
 *     + Existing appointments
 *     + Service duration
 *     → AVAILABLE SLOTS
 *
 * Used by:
 *   GET /api/schedules/availability?practitionerId=&date=&serviceId=
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableSlots = getAvailableSlots;
const mongoose_1 = __importDefault(require("mongoose"));
const schedule_model_1 = __importDefault(require("./schedule.model"));
const schedule_exception_model_1 = __importDefault(require("./schedule-exception.model"));
const appointment_model_1 = require("../appointments/appointment.model");
/**
 * Parse "HH:mm" string into [hours, minutes].
 */
function parseTime(t) {
    const [h, m] = t.split(':').map(Number);
    return [h, m];
}
/**
 * Build a Date for a given day with a parsed time.
 */
function toDate(day, [h, m]) {
    const d = new Date(day);
    d.setHours(h, m, 0, 0);
    return d;
}
/**
 * Split a working window into equal-length slots, removing those
 * that overlap with existing bookings.
 */
function buildSlots(start, end, slotMinutes, bookedSlots) {
    const slots = [];
    let cursor = new Date(start);
    while (cursor < end) {
        const slotEnd = new Date(cursor.getTime() + slotMinutes * 60 * 1000);
        if (slotEnd > end)
            break;
        // Check for overlap with any existing appointment
        const overlaps = bookedSlots.some(b => {
            const bStart = new Date(b.scheduledStartTime);
            const bEnd = new Date(b.scheduledEndTime);
            return cursor < bEnd && slotEnd > bStart;
        });
        if (!overlaps) {
            slots.push({ start: new Date(cursor), end: slotEnd });
        }
        cursor = slotEnd;
    }
    return slots;
}
/**
 * Compute available slots for a practitioner on a given date.
 * Returns an empty array if the practitioner is on leave that day.
 */
async function getAvailableSlots(opts) {
    const { organizationId, practitionerId, date, slotDurationMin = 15 } = opts;
    // ── 1. Check for a schedule exception on this date ───────────────────────
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    const exception = await schedule_exception_model_1.default.findOne({
        organizationId: new mongoose_1.default.Types.ObjectId(organizationId),
        practitionerId: new mongoose_1.default.Types.ObjectId(practitionerId),
        date: { $gte: dayStart, $lte: dayEnd },
    });
    if (exception && !exception.isAvailable) {
        // Practitioner is on leave — no slots
        return [];
    }
    // ── 2. Use exception override times if available, else recurring schedule ─
    let workStart;
    let workEnd;
    if (exception && exception.isAvailable && exception.startTime && exception.endTime) {
        workStart = toDate(date, parseTime(exception.startTime));
        workEnd = toDate(date, parseTime(exception.endTime));
    }
    else {
        const dayOfWeek = date.getDay(); // 0 = Sunday
        const schedule = await schedule_model_1.default.findOne({
            organizationId: new mongoose_1.default.Types.ObjectId(organizationId),
            practitionerId: new mongoose_1.default.Types.ObjectId(practitionerId),
            dayOfWeek,
            isActive: true,
        });
        if (!schedule) {
            // No schedule for this day
            return [];
        }
        workStart = toDate(date, parseTime(schedule.startTime));
        workEnd = toDate(date, parseTime(schedule.endTime));
    }
    // ── 3. Fetch existing appointments that occupy slots ──────────────────────
    const booked = await appointment_model_1.Appointment.find({
        organizationId: new mongoose_1.default.Types.ObjectId(organizationId),
        practitionerId: new mongoose_1.default.Types.ObjectId(practitionerId),
        date: { $gte: dayStart, $lte: dayEnd },
        status: { $nin: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] },
        scheduledStartTime: { $exists: true },
        scheduledEndTime: { $exists: true },
    }).select('scheduledStartTime scheduledEndTime');
    // ── 4. Generate slots ─────────────────────────────────────────────────────
    return buildSlots(workStart, workEnd, slotDurationMin, booked);
}
//# sourceMappingURL=availability.service.js.map