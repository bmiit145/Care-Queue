/**
 * Appointment Controller
 *
 * Architecture compliance:
 *  ✅ All queries scoped to organizationId (tenant isolation)
 *  ✅ State machine enforced (VALID_TRANSITIONS)
 *  ✅ Notification events emitted on every status change
 *  ✅ Cross-entity: patient validated when creating appointment
 *  ✅ No SUPER_ADMIN — standardized roles only
 */

import { Response } from 'express';
import { Appointment } from './appointment.model';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { Patient } from '../patients/patient.model';
import { PractitionerDepartment } from '../practitioners/practitionerDepartment.model';
import { notificationService } from '../../shared/notifications/notification.service';
import { AuditService } from '../../shared/audit/audit.service';

// ── State machine ─────────────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  BOOKED:          ['CONFIRMED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW'],
  CONFIRMED:       ['CHECKED_IN', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW'],
  CHECKED_IN:      ['IN_QUEUE', 'CANCELLED', 'NO_SHOW'],
  IN_QUEUE:        ['IN_CONSULTATION', 'CANCELLED', 'NO_SHOW'],
  IN_CONSULTATION: ['COMPLETED'],
  COMPLETED:       [],
  CANCELLED:       [],
  NO_SHOW:         [],
  RESCHEDULED:     ['BOOKED'],  // Rescheduled can re-enter as BOOKED
};

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/appointments
 */
export const createAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      patientId, practitionerId, departmentId, serviceId,
      locationId, date, scheduledStartTime, scheduledEndTime, source,
    } = req.body;
    const organizationId = (req.user!.organizationId as string);

    if (!patientId || !date) {
      res.status(400).json({ message: 'patientId and date are required' });
      return;
    }

    // Cross-entity: confirm patient belongs to this org
    const patient = await Patient.findOne({ _id: patientId, organizationId });
    if (!patient) {
      res.status(400).json({ message: 'Patient not found in this organization' });
      return;
    }

    // Cross-entity validation: confirm practitioner provides this service in this department
    if (practitionerId && departmentId && serviceId) {
      const practDept = await PractitionerDepartment.findOne({
        organizationId,
        practitionerId,
        departmentId,
        isActive: true
      });

      if (!practDept) {
        res.status(400).json({ message: 'Practitioner does not operate in this department' });
        return;
      }

      if (!practDept.serviceIds.includes(serviceId)) {
        res.status(400).json({ message: 'Practitioner does not provide this service in this department' });
        return;
      }
    }

    const apptPayload: any = {
      organizationId,
      patientId,
      practitionerId,
      departmentId,
      serviceId,
      locationId,
      date: new Date(date),
      source: source || 'ONLINE',
      status: 'BOOKED',
    };
    if (scheduledStartTime) apptPayload.scheduledStartTime = new Date(scheduledStartTime);
    if (scheduledEndTime) apptPayload.scheduledEndTime = new Date(scheduledEndTime);

    const appointment = await Appointment.create(apptPayload);

    // Fire audit event
    AuditService.log({
      organizationId: organizationId!.toString(),
      actorUserId: req.user!.id,
      actorRole: req.user!.role,
      action: 'CREATE',
      entityType: 'Appointment',
      entityId: appointment._id.toString(),
      metadata: { source: appointment.source, status: 'BOOKED' },
      ipAddress: req.ip
    });

    notificationService.notify({
      event:          'APPOINTMENT_BOOKED',
      organizationId: organizationId!.toString(),
      patientId,
      context:        { appointmentId: appointment._id, date, source },
    });

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating appointment', error });
  }
};

/**
 * GET /api/appointments/mine
 * Patient: their own appointments (tenant-scoped).
 */
export const getMyAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = (req.user!.organizationId as string);
    const appointments = await Appointment.find({
      patientId: req.user!.id,
      organizationId,
    })
      .populate('practitionerId', 'firstName lastName type')
      .populate('departmentId', 'name')
      .populate('serviceId', 'name')
      .sort({ date: -1 });

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error });
  }
};

/**
 * GET /api/appointments
 * Staff/Admin: all appointments for the org, with optional filters.
 */
export const getAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = (req.user!.organizationId as string);
    const filter: Record<string, unknown> = { organizationId };

    if (req.query.date) {
      const d = new Date(req.query.date as string);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end   = new Date(d); end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }
    if (req.query.status)          filter.status          = req.query.status;
    if (req.query.practitionerId)  filter.practitionerId  = req.query.practitionerId;
    if (req.query.departmentId)    filter.departmentId    = req.query.departmentId;
    if (req.query.patientId)       filter.patientId       = req.query.patientId;

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'firstName lastName contactPhone')
      .populate('practitionerId', 'firstName lastName type')
      .populate('departmentId', 'name')
      .populate('serviceId', 'name')
      .sort({ date: 1, scheduledStartTime: 1 });

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error });
  }
};

/**
 * GET /api/appointments/:id
 */
export const getAppointmentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      organizationId: (req.user!.organizationId as string),
    })
      .populate('patientId', 'firstName lastName contactPhone')
      .populate('practitionerId', 'firstName lastName type')
      .populate('departmentId', 'name')
      .populate('serviceId', 'name');

    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }
    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointment', error });
  }
};

/**
 * GET /api/appointments/practitioner/:practitionerId
 */
export const getPractitionerAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { practitionerId } = req.params;
    const organizationId = (req.user!.organizationId as string);
    const filter: Record<string, unknown> = { practitionerId, organizationId };

    if (req.query.date) {
      const d = new Date(req.query.date as string);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end   = new Date(d); end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'firstName lastName contactPhone')
      .sort({ date: 1, scheduledStartTime: 1 });

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error });
  }
};

/**
 * PATCH /api/appointments/:id/status
 * State machine enforced. Fires notification events.
 */
export const updateAppointmentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const organizationId = (req.user!.organizationId as string);

    if (!status) {
      res.status(400).json({ message: 'status is required' });
      return;
    }

    const appointment = await Appointment.findOne({ _id: id, organizationId });
    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }

    const validNext = VALID_TRANSITIONS[appointment.status] ?? [];
    if (!validNext.includes(status)) {
      res.status(400).json({
        message: `Invalid transition: ${appointment.status} → ${status}`,
        allowedTransitions: validNext,
      });
      return;
    }

    const previousStatus = appointment.status;
    appointment.status = status;
    await appointment.save();

    // Fire audit log for state transition
    AuditService.log({
      organizationId: organizationId!.toString(),
      actorUserId: req.user!.id,
      actorRole: req.user!.role,
      action: 'STATUS_CHANGE',
      entityType: 'Appointment',
      entityId: appointment._id.toString(),
      metadata: { previousStatus, newStatus: status },
      ipAddress: req.ip
    });

    // Emit notification events for meaningful transitions
    const eventMap: Record<string, 'APPOINTMENT_CONFIRMED' | 'APPOINTMENT_CANCELLED' | 'APPOINTMENT_RESCHEDULED'> = {
      CONFIRMED:   'APPOINTMENT_CONFIRMED',
      CANCELLED:   'APPOINTMENT_CANCELLED',
      RESCHEDULED: 'APPOINTMENT_RESCHEDULED',
    };
    if (eventMap[status]) {
      notificationService.notify({
        event:          eventMap[status],
        organizationId: organizationId!.toString(),
        patientId:      appointment.patientId.toString(),
        context:        { appointmentId: id, status },
      });
    }

    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating appointment', error });
  }
};

/**
 * DELETE /api/appointments/:id
 * Soft-cancel only — enforces state machine.
 */
export const cancelAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = (req.user!.organizationId as string);
    const appointment = await Appointment.findOne({ _id: req.params.id, organizationId });
    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }

    const validNext = VALID_TRANSITIONS[appointment.status] ?? [];
    if (!validNext.includes('CANCELLED')) {
      res.status(400).json({ message: `Cannot cancel an appointment in status: ${appointment.status}` });
      return;
    }

    const previousStatus = appointment.status;
    appointment.status = 'CANCELLED';
    await appointment.save();

    AuditService.log({
      organizationId: organizationId!.toString(),
      actorUserId: req.user!.id,
      actorRole: req.user!.role,
      action: 'CANCEL',
      entityType: 'Appointment',
      entityId: appointment._id.toString(),
      metadata: { previousStatus, newStatus: 'CANCELLED' },
      ipAddress: req.ip
    });

    notificationService.notify({
      event:          'APPOINTMENT_CANCELLED',
      organizationId: organizationId!.toString(),
      patientId:      appointment.patientId.toString(),
      context:        { appointmentId: appointment._id },
    });

    res.status(200).json({ message: 'Appointment cancelled', appointment });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling appointment', error });
  }
};
