import { Request, Response } from 'express';
import { Patient } from './patient.model';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';

export const registerPatient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, dateOfBirth, gender, mobileNumber, email, address, emergencyContact } = req.body;
    const organizationId = req.user!.organizationId;
    
    const patient = await Patient.create({
      organizationId,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      mobileNumber,
      email,
      address,
      emergencyContact,
    });

    res.status(201).json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Error registering patient', error });
  }
};

export const getPatients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const patients = await Patient.find({ organizationId });
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching patients', error });
  }
};

export const getPatientById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const patient = await Patient.findOne({ _id: req.params.id, organizationId });
    if (!patient) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching patient', error });
  }
};
