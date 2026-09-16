import { Request, Response } from 'express';
import { Patient } from './patient.model';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { orgIdOf } from '../../shared/tenant/orgScope';
import { failed } from '../../shared/http/respond';

export const registerPatient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, dateOfBirth, gender, mobileNumber, email, address, emergencyContact } = req.body;
    const organizationId = orgIdOf(req);

    const payload: Record<string, unknown> = {
      organizationId,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      mobileNumber,
      email,
      address,
      emergencyContact,
    };

    // A patient enrolling themselves is bound to their login, so later requests
    // can resolve "my" records. Staff-created records stay unlinked.
    if (req.user!.role === 'PATIENT') {
      const alreadyEnrolled = await Patient.findOne({ organizationId, userId: req.user!.id }).lean();
      if (alreadyEnrolled) {
        res.status(409).json({
          message: 'You already have a patient record in this organization',
          patient: alreadyEnrolled,
        });
        return;
      }
      payload.userId = req.user!.id;
    }

    const patient = await Patient.create(payload);

    res.status(201).json(patient);
  } catch (error) {
    failed(res, 'Error registering patient', error);
  }
};

export const getPatients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = orgIdOf(req);
    const patients = await Patient.find({ organizationId });
    res.status(200).json(patients);
  } catch (error) {
    failed(res, 'Error fetching patients', error);
  }
};

export const getPatientById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = orgIdOf(req);
    const filter: Record<string, unknown> = { _id: req.params.id, organizationId };

    // Org scoping alone let any PATIENT read every other patient in the same
    // clinic by id. Staff keep org-wide access; a patient sees only their own.
    if (req.user!.role === 'PATIENT') {
      filter.userId = req.user!.id;
    }

    const patient = await Patient.findOne(filter);
    if (!patient) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }
    res.status(200).json(patient);
  } catch (error) {
    failed(res, 'Error fetching patient', error);
  }
};
