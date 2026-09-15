/**
 * Schedule Controller — full implementation.
 *
 * Covers:
 *  ✅ Create / list recurring schedules (tenant-scoped)
 *  ✅ Create / list schedule exceptions (leave, special days)
 *  ✅ GET /availability — calls the availability engine
 *  ✅ All queries scoped to organizationId
 */

import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import Schedule from './schedule.model';
import ScheduleException from './schedule-exception.model';
import { getAvailableSlots } from './availability.service';

// ── Recurring schedule CRUD ───────────────────────────────────────────────────

export const createSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { practitionerId, dayOfWeek, startTime, endTime, departmentId, locationId } = req.body;
    const organizationId = (req.user!.organizationId as string);

    if (!practitionerId || dayOfWeek === undefined || !startTime || !endTime) {
      res.status(400).json({ message: 'practitionerId, dayOfWeek, startTime, and endTime are required' });
      return;
    }

    const schedule = await Schedule.create({
      organizationId,
      practitionerId,
      dayOfWeek,
      startTime,
      endTime,
      departmentId,
      locationId,
    });

    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Error creating schedule', error });
  }
};

export const getSchedules = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = (req.user!.organizationId as string);
    const filter: Record<string, unknown> = { organizationId, isActive: true };

    if (req.query.practitionerId) filter.practitionerId = req.query.practitionerId;
    if (req.query.departmentId)   filter.departmentId   = req.query.departmentId;
    if (req.query.dayOfWeek !== undefined) filter.dayOfWeek = Number(req.query.dayOfWeek);

    const schedules = await Schedule.find(filter)
      .populate('practitionerId', 'firstName lastName')
      .populate('departmentId', 'name')
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching schedules', error });
  }
};

export const getPractitionerSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { practitionerId } = req.params;
    const organizationId = (req.user!.organizationId as string);

    const schedules = await Schedule.find({ organizationId, practitionerId: practitionerId as string, isActive: true })
      .sort({ dayOfWeek: 1, startTime: 1 });

    const exceptions = await ScheduleException.find({
      organizationId,
      practitionerId: practitionerId as string,
      date: { $gte: new Date() },
    }).sort({ date: 1 });

    res.status(200).json({ schedules, exceptions });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching schedule', error });
  }
};

export const updateSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schedule = await Schedule.findOneAndUpdate(
      { _id: req.params.id, organizationId: (req.user!.organizationId as string) },
      req.body,
      { new: true, runValidators: true }
    );
    if (!schedule) {
      res.status(404).json({ message: 'Schedule not found' });
      return;
    }
    res.status(200).json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Error updating schedule', error });
  }
};

export const deleteSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schedule = await Schedule.findOneAndUpdate(
      { _id: req.params.id, organizationId: (req.user!.organizationId as string) },
      { isActive: false },
      { new: true }
    );
    if (!schedule) {
      res.status(404).json({ message: 'Schedule not found' });
      return;
    }
    res.status(200).json({ message: 'Schedule deactivated', schedule });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting schedule', error });
  }
};

// ── Schedule exceptions ───────────────────────────────────────────────────────

export const createScheduleException = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { practitionerId, date, reason, isAvailable, startTime, endTime } = req.body;
    const organizationId = (req.user!.organizationId as string);

    if (!practitionerId || !date || !reason || isAvailable === undefined) {
      res.status(400).json({ message: 'practitionerId, date, reason, and isAvailable are required' });
      return;
    }

    const exception = await ScheduleException.create({
      organizationId,
      practitionerId,
      date: new Date(date),
      reason,
      isAvailable,
      startTime,
      endTime,
    });

    res.status(201).json(exception);
  } catch (error) {
    res.status(500).json({ message: 'Error creating schedule exception', error });
  }
};

export const getScheduleExceptions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = (req.user!.organizationId as string);
    const filter: Record<string, unknown> = { organizationId };

    if (req.query.practitionerId) filter.practitionerId = req.query.practitionerId;

    const exceptions = await ScheduleException.find(filter)
      .populate('practitionerId', 'firstName lastName')
      .sort({ date: 1 });

    res.status(200).json(exceptions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching schedule exceptions', error });
  }
};

// ── Availability Engine ───────────────────────────────────────────────────────

/**
 * GET /api/schedules/availability
 * Query params: practitionerId (required), date (required), slotDurationMin (optional)
 *
 * Returns an array of { start, end } slots that are still open for booking.
 * The mobile app calls this to show the booking calendar.
 */
export const getAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { practitionerId, date, slotDurationMin } = req.query as Record<string, string>;
    const organizationId = (req.user!.organizationId as string);

    if (!practitionerId || !date) {
      res.status(400).json({ message: 'practitionerId and date are required query params' });
      return;
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
      return;
    }

    const slots = await getAvailableSlots({
      organizationId: organizationId!.toString(),
      practitionerId,
      date: targetDate,
      slotDurationMin: slotDurationMin ? parseInt(slotDurationMin, 10) : 15,
    });

    res.status(200).json({ date, practitionerId, slots });
  } catch (error) {
    res.status(500).json({ message: 'Error computing availability', error });
  }
};
