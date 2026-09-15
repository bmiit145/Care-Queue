import { Request, Response } from 'express';
import { Patient } from './patient.model';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';

export const registerPatient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, dateOfBirth, gender, contactPhone, contactEmail, address, emergencyContact } = req.body;
    
    // Create patient linked to the authenticated user
    const patient = await Patient.create({
      user: req.user?.id,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      contactPhone,
      contactEmail,
      address,
      emergencyContact,
    });

    res.status(201).json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Error registering patient', error });
  }
};

export const getMyPatientProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patient = await Patient.findOne({ user: req.user?.id });
    if (!patient) {
      res.status(404).json({ message: 'Patient profile not found' });
      return;
    }
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching patient profile', error });
  }
};

export const getPatientById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching patient', error });
  }
};
