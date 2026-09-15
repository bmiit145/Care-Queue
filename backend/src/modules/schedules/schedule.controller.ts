import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import Schedule from './schedule.model';
import ScheduleException from './schedule-exception.model';

export const createSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { practitionerId, dayOfWeek, startTime, endTime, departmentId, locationId } = req.body;
    
    // ORG_ADMIN or SUPER_ADMIN
    const schedule = await Schedule.create({
      organizationId: req.user?.organizationId,
      practitionerId,
      dayOfWeek,
      startTime,
      endTime,
      departmentId,
      locationId
    });

    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Error creating schedule', error });
  }
};

export const getPractitionerSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { practitionerId } = req.params;
    
    const schedules = await Schedule.find({
      organizationId: req.user?.organizationId,
      practitionerId
    });

    const exceptions = await ScheduleException.find({
      organizationId: req.user?.organizationId,
      practitionerId,
      date: { $gte: new Date() } // only future exceptions
    });

    res.json({ schedules, exceptions });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching schedule', error });
  }
};
