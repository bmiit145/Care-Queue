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
import mongoose from 'mongoose';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import Schedule from './schedule.model';
import ScheduleException from './schedule-exception.model';
import { getAvailableSlots } from './availability.service';

export const createSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { practitionerId, dayOfWeek, startTime, endTime, departmentId, locationId } = req.body;
    const organizationId = req.user!.organizationId!;

    if (!practitionerId || dayOfWeek === undefined || !startTime || !endTime) {
      res.status(400).json({ message: 'practitionerId, dayOfWeek, startTime, and endTime are required' });
      return;
    }

    const schedule = await Schedule.create({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      practitionerId: new mongoose.Types.ObjectId(String(practitionerId)),
      dayOfWeek,
      startTime,
      endTime,
      ...(departmentId ? { departmentId: new mongoose.Types.ObjectId(String(departmentId)) } : {}),
      ...(locationId ? { locationId: new mongoose.Types.ObjectId(String(locationId)) } : {}),
    });

    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Error creating schedule', error });
  }
};

export const getSchedules = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId!;
    const filter: Record<string, unknown> = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
      isActive: true,
    };

    if (req.query.practitionerId) filter.practitionerId = new mongoose.Types.ObjectId(String(req.query.practitionerId));
    if (req.query.departmentId) filter.departmentId = new mongoose.Types.ObjectId(String(req.query.departmentId));
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
    const organizationId = req.user!.organizationId!;
    const orgObjectId = new mongoose.Types.ObjectId(organizationId);
    const practitionerObjectId = new mongoose.Types.ObjectId(String(practitionerId));

    const schedules = await Schedule.find({ organizationId: orgObjectId, practitionerId: practitionerObjectId, isActive: true })
      .sort({ dayOfWeek: 1, startTime: 1 });

    const exceptions = await ScheduleException.find({
      organizationId: orgObjectId,
      practitionerId: practitionerObjectId,
      date: { $gte: new Date() },
    }).sort({ date: 1 });

    res.status(200).json({ schedules, exceptions });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching schedule', error });
  }
};

export const updateSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId!;
    const schedule = await Schedule.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(String(req.params.id)), organizationId: new mongoose.Types.ObjectId(organizationId) },
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
    const organizationId = req.user!.organizationId!;
    const schedule = await Schedule.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(String(req.params.id)), organizationId: new mongoose.Types.ObjectId(organizationId) },
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

export const createScheduleException = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { practitionerId, date, reason, isAvailable, startTime, endTime } = req.body;
    const organizationId = req.user!.organizationId!;

    if (!practitionerId || !date || !reason || isAvailable === undefined) {
      res.status(400).json({ message: 'practitionerId, date, reason, and isAvailable are required' });
      return;
    }

    const exception = await ScheduleException.create({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      practitionerId: new mongoose.Types.ObjectId(String(practitionerId)),
      date: new Date(date),
      reason,
      isAvailable,
      ...(startTime ? { startTime } : {}),
      ...(endTime ? { endTime } : {}),
    });

    res.status(201).json(exception);
  } catch (error) {
    res.status(500).json({ message: 'Error creating schedule exception', error });
  }
};

export const getScheduleExceptions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId!;
    const filter: Record<string, unknown> = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
    };

    if (req.query.practitionerId) filter.practitionerId = new mongoose.Types.ObjectId(String(req.query.practitionerId));

    const exceptions = await ScheduleException.find(filter)
      .populate('practitionerId', 'firstName lastName')
      .sort({ date: 1 });

    res.status(200).json(exceptions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching schedule exceptions', error });
  }
};

export const getAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId!;
    const { practitionerId, date, serviceDurationMin } = req.query;

    if (!practitionerId || !date) {
      res.status(400).json({ message: 'practitionerId and date are required' });
      return;
    }

    const slots = await getAvailableSlots({
      organizationId,
      practitionerId: String(practitionerId),
      date: new Date(String(date)),
      ...(serviceDurationMin ? { slotDurationMin: Number(serviceDurationMin) } : {}),
    });

    res.status(200).json(slots);
  } catch (error) {
    res.status(500).json({ message: 'Error calculating availability', error });
  }
};
