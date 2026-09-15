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

import mongoose from 'mongoose';
import Schedule from './schedule.model';
import ScheduleException from './schedule-exception.model';
import { Appointment } from '../appointments/appointment.model';

export interface TimeSlot {
  start: Date;
  end:   Date;
}

interface AvailabilityOptions {
  organizationId: string;
  practitionerId: string;
  date:           Date;
  /** Duration of each slot in minutes (from service or default) */
  slotDurationMin?: number;
}

/**
 * Parse "HH:mm" string into [hours, minutes].
 */
function parseTime(t: string): [number, number] {
  const [h, m] = t.split(':').map(Number);
  return [h, m];
}

/**
 * Build a Date for a given day with a parsed time.
 */
function toDate(day: Date, [h, m]: [number, number]): Date {
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * Split a working window into equal-length slots, removing those
 * that overlap with existing bookings.
 */
function buildSlots(
  start: Date,
  end: Date,
  slotMinutes: number,
  bookedSlots: Array<{ scheduledStartTime: Date; scheduledEndTime: Date }>
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  let cursor = new Date(start);

  while (cursor < end) {
    const slotEnd = new Date(cursor.getTime() + slotMinutes * 60 * 1000);
    if (slotEnd > end) break;

    // Check for overlap with any existing appointment
    const overlaps = bookedSlots.some(b => {
      const bStart = new Date(b.scheduledStartTime);
      const bEnd   = new Date(b.scheduledEndTime);
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
export async function getAvailableSlots(opts: AvailabilityOptions): Promise<TimeSlot[]> {
  const { organizationId, practitionerId, date, slotDurationMin = 15 } = opts;

  // ── 1. Check for a schedule exception on this date ───────────────────────
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999);

  const exception = await ScheduleException.findOne({
    organizationId: new mongoose.Types.ObjectId(organizationId),
    practitionerId: new mongoose.Types.ObjectId(practitionerId),
    date: { $gte: dayStart, $lte: dayEnd },
  });

  if (exception && !exception.isAvailable) {
    // Practitioner is on leave — no slots
    return [];
  }

  // ── 2. Use exception override times if available, else recurring schedule ─
  let workStart: Date;
  let workEnd:   Date;

  if (exception && exception.isAvailable && exception.startTime && exception.endTime) {
    workStart = toDate(date, parseTime(exception.startTime));
    workEnd   = toDate(date, parseTime(exception.endTime));
  } else {
    const dayOfWeek = date.getDay(); // 0 = Sunday
    const schedule = await Schedule.findOne({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      practitionerId: new mongoose.Types.ObjectId(practitionerId),
      dayOfWeek,
      isActive: true,
    });

    if (!schedule) {
      // No schedule for this day
      return [];
    }

    workStart = toDate(date, parseTime(schedule.startTime));
    workEnd   = toDate(date, parseTime(schedule.endTime));
  }

  // ── 3. Fetch existing appointments that occupy slots ──────────────────────
  const booked = await Appointment.find({
    organizationId: new mongoose.Types.ObjectId(organizationId),
    practitionerId: new mongoose.Types.ObjectId(practitionerId),
    date: { $gte: dayStart, $lte: dayEnd },
    status: { $nin: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] },
    scheduledStartTime: { $exists: true },
    scheduledEndTime:   { $exists: true },
  }).select('scheduledStartTime scheduledEndTime');

  // ── 4. Generate slots ─────────────────────────────────────────────────────
  return buildSlots(workStart, workEnd, slotDurationMin, booked as any);
}
