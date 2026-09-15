import { Request, Response } from 'express';
import { Appointment } from './appointment.model';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';

export const createAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId, practitionerId, departmentId, serviceId, locationId, date, scheduledStartTime, scheduledEndTime, source } = req.body;
    const organizationId = req.user!.organizationId; 

    const appointment = await Appointment.create({
      organizationId,
      patientId,
      practitionerId,
      departmentId,
      serviceId,
      locationId,
      date,
      scheduledStartTime,
      scheduledEndTime,
      source: source || 'ONLINE',
      status: 'BOOKED'
    });

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating appointment', error });
  }
};

export const getMyAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Assuming the user is a patient
    const appointments = await Appointment.find({ patientId: req.user?.id, organizationId: req.user!.organizationId }).populate('practitionerId').populate('departmentId');
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error });
  }
};

export const getPractitionerAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { practitionerId } = req.params;
    const appointments = await Appointment.find({ practitionerId, organizationId: req.user!.organizationId }).populate('patientId');
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error });
  }
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  BOOKED: ['CONFIRMED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW'],
  CONFIRMED: ['CHECKED_IN', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW'],
  CHECKED_IN: ['IN_QUEUE', 'CANCELLED', 'NO_SHOW'],
  IN_QUEUE: ['IN_CONSULTATION', 'CANCELLED', 'NO_SHOW'],
  IN_CONSULTATION: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
  RESCHEDULED: [],
};

export const updateAppointmentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const organizationId = req.user!.organizationId;

    const appointment = await Appointment.findOne({ _id: id, organizationId });
    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }

    const validNextStates = VALID_TRANSITIONS[appointment.status] || [];
    if (!validNextStates.includes(status)) {
      res.status(400).json({ message: `Invalid state transition from ${appointment.status} to ${status}` });
      return;
    }

    appointment.status = status;
    await appointment.save();

    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating appointment', error });
  }
};
