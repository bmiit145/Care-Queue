import { Request, Response } from 'express';
import { Visit } from './visit.model';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';

export const createVisit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { appointment, patient, practitioner, department, location, type, chiefComplaint } = req.body;
    const organizationId = req.user?.organizationId;

    const visit = await Visit.create({
      organization: organizationId,
      appointment,
      patient,
      practitioner,
      department,
      location,
      type,
      chiefComplaint,
      status: 'ARRIVED', // Assuming they arrived when the visit is created (via check-in or receptionist)
      arrivalTime: new Date(),
    });

    res.status(201).json(visit);
  } catch (error) {
    res.status(500).json({ message: 'Error creating visit', error });
  }
};

export const getVisitById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const visit = await Visit.findById(id).populate('patient practitioner department');
    if (!visit) {
      res.status(404).json({ message: 'Visit not found' });
      return;
    }
    res.status(200).json(visit);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching visit', error });
  }
};

export const updateVisitStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes, diagnosis, treatmentPlan } = req.body;

    const updateData: any = { status };
    if (notes) updateData.notes = notes;
    if (diagnosis) updateData.diagnosis = diagnosis;
    if (treatmentPlan) updateData.treatmentPlan = treatmentPlan;

    if (status === 'IN_PROGRESS') {
      updateData.startTime = new Date();
    } else if (status === 'COMPLETED') {
      updateData.endTime = new Date();
    }

    const visit = await Visit.findByIdAndUpdate(id, updateData, { new: true });
    if (!visit) {
      res.status(404).json({ message: 'Visit not found' });
      return;
    }
    res.status(200).json(visit);
  } catch (error) {
    res.status(500).json({ message: 'Error updating visit', error });
  }
};
