import { Request, Response } from 'express';
import { Visit } from './visit.model';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';

export const createVisit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { appointmentId, patientId, practitionerId, departmentId, serviceId, locationId, checkInId, queueEntryId } = req.body;
    const organizationId = req.user!.organizationId;

    const visit = await Visit.create({
      organizationId,
      appointmentId,
      patientId,
      practitionerId,
      departmentId,
      serviceId,
      locationId,
      checkInId,
      queueEntryId,
      status: 'CREATED',
    });

    res.status(201).json(visit);
  } catch (error) {
    res.status(500).json({ message: 'Error creating visit', error });
  }
};

export const getVisitById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const visit = await Visit.findOne({ _id: id, organizationId }).populate('patientId practitionerId departmentId');
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
    const { status } = req.body;
    const organizationId = req.user!.organizationId;

    const updateData: any = { status };

    if (status === 'IN_PROGRESS') {
      updateData.startedAt = new Date();
    } else if (status === 'COMPLETED') {
      updateData.endedAt = new Date();
    }

    const visit = await Visit.findOneAndUpdate({ _id: id, organizationId }, updateData, { new: true });
    if (!visit) {
      res.status(404).json({ message: 'Visit not found' });
      return;
    }
    res.status(200).json(visit);
  } catch (error) {
    res.status(500).json({ message: 'Error updating visit', error });
  }
};
