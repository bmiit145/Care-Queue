import { Request, Response } from 'express';
import { Appointment } from './appointment.model';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';

export const createAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patient, practitioner, department, location, scheduledStartTime, scheduledEndTime, appointmentType, reason } = req.body;
    const organizationId = req.user?.organizationId; 

    const appointment = await Appointment.create({
      organization: organizationId,
      patient,
      practitioner,
      department,
      location,
      scheduledStartTime,
      scheduledEndTime,
      appointmentType,
      reason,
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
    const appointments = await Appointment.find({ patient: req.user?.id }).populate('practitioner').populate('department');
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error });
  }
};

export const getPractitionerAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { practitionerId } = req.params;
    const appointments = await Appointment.find({ practitioner: practitionerId }).populate('patient');
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error });
  }
};

export const updateAppointmentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(id, { status }, { new: true });
    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }
    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating appointment', error });
  }
};
