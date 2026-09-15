import { Response } from 'express';
import { CheckIn } from './checkIn.model';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { Appointment } from '../appointments/appointment.model';

/**
 * POST /api/check-ins
 * Receptionist or Patient checks in.
 * Creates a check-in record. Walk-in source if no appointmentId.
 * Per docs § 16 — check-in is a distinct operational event.
 */
export const createCheckIn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId, appointmentId, locationId, source } = req.body;

    if (!patientId) {
      res.status(400).json({ message: 'patientId is required' });
      return;
    }

    const checkIn = await CheckIn.create({
      organizationId: req.user!.organizationId,
      patientId,
      appointmentId: appointmentId || undefined,
      locationId:    locationId    || undefined,
      source:        source        || 'RECEPTION',
      checkInTime:   new Date(),
      status:        'COMPLETED',
    });

    if (appointmentId) {
      await Appointment.findOneAndUpdate(
        { _id: appointmentId, organizationId: req.user!.organizationId },
        { status: 'CHECKED_IN' }
      );
    }

    res.status(201).json(checkIn);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create check-in', error });
  }
};

/**
 * GET /api/check-ins
 * Lists today's check-ins for the organization.
 */
export const getCheckIns = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const checkIns = await CheckIn.find({
      organizationId: req.user!.organizationId,
      checkInTime: { $gte: startOfDay },
    })
      .populate('patientId', 'firstName lastName contactPhone')
      .populate('appointmentId', 'scheduledStartTime status')
      .sort({ checkInTime: -1 });

    res.status(200).json(checkIns);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch check-ins', error });
  }
};

/**
 * GET /api/check-ins/:id
 */
export const getCheckInById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const checkIn = await CheckIn.findOne({
      _id: req.params.id,
      organizationId: req.user!.organizationId,
    })
      .populate('patientId', 'firstName lastName contactPhone')
      .populate('appointmentId', 'scheduledStartTime practitioner department');

    if (!checkIn) {
      res.status(404).json({ message: 'Check-in not found' });
      return;
    }
    res.status(200).json(checkIn);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch check-in', error });
  }
};
