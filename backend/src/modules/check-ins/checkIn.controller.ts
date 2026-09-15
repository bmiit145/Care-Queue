/**
 * Check-In Controller — patient arrival processing.
 *
 * Architecture compliance:
 *  ✅ All queries scoped to organizationId (tenant isolation)
 *  ✅ Cross-entity: validates appointment belongs to same org + same patient
 *  ✅ Cross-entity: validates patient belongs to org
 *  ✅ Appointment status sync → CHECKED_IN (state machine safe)
 *  ✅ Notification events
 *  ✅ Duplicate check-in prevention
 */

import { Response } from 'express';
import { CheckIn } from './checkIn.model';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { Appointment } from '../appointments/appointment.model';
import { Patient } from '../patients/patient.model';
import { notificationService } from '../../shared/notifications/notification.service';

/**
 * POST /api/check-ins
 * Creates a check-in record. Walk-in if no appointmentId.
 */
export const createCheckIn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId, appointmentId, locationId, source } = req.body;
    const organizationId = req.user!.organizationId;

    if (!patientId) {
      res.status(400).json({ message: 'patientId is required' });
      return;
    }

    // Cross-entity: validate patient belongs to this org
    const patient = await Patient.findOne({ _id: patientId, organizationId });
    if (!patient) {
      res.status(400).json({ message: 'Patient not found in this organization' });
      return;
    }

    // Cross-entity: validate appointment ownership + patient match
    if (appointmentId) {
      const appt = await Appointment.findOne({ _id: appointmentId, organizationId });
      if (!appt) {
        res.status(400).json({ message: 'Appointment not found in this organization' });
        return;
      }
      if (appt.patientId.toString() !== patientId) {
        res.status(400).json({ message: 'Appointment does not belong to this patient' });
        return;
      }

      // Prevent duplicate check-in for the same appointment
      const existing = await CheckIn.findOne({ appointmentId, organizationId, status: 'COMPLETED' });
      if (existing) {
        res.status(409).json({ message: 'Patient already checked in for this appointment', checkIn: existing });
        return;
      }

      // Only allow check-in if appointment is BOOKED or CONFIRMED
      if (!['BOOKED', 'CONFIRMED'].includes(appt.status)) {
        res.status(400).json({ message: `Cannot check in for an appointment in status: ${appt.status}` });
        return;
      }
    }

    const checkIn = await CheckIn.create({
      organizationId,
      patientId,
      appointmentId: appointmentId || undefined,
      locationId:    locationId    || undefined,
      source:        source        || 'RECEPTION',
      checkInTime:   new Date(),
      status:        'COMPLETED',
    });

    // Sync appointment → CHECKED_IN
    if (appointmentId) {
      await Appointment.findOneAndUpdate(
        { _id: appointmentId, organizationId },
        { status: 'CHECKED_IN' }
      );
    }

    notificationService.notify({
      event:          'CHECKIN_COMPLETED',
      organizationId: organizationId!.toString(),
      patientId,
      context:        { checkInId: checkIn._id, appointmentId, source: checkIn.source },
    });

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
    const organizationId = req.user!.organizationId;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const filter: Record<string, unknown> = {
      organizationId,
      checkInTime: { $gte: startOfDay },
    };

    if (req.query.locationId) filter.locationId = req.query.locationId;

    const checkIns = await CheckIn.find(filter)
      .populate('patientId', 'firstName lastName contactPhone')
      .populate('appointmentId', 'scheduledStartTime status practitionerId')
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
      .populate('appointmentId', 'scheduledStartTime practitionerId departmentId status');

    if (!checkIn) {
      res.status(404).json({ message: 'Check-in not found' });
      return;
    }
    res.status(200).json(checkIn);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch check-in', error });
  }
};
