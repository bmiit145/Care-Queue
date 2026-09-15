import { Request, Response } from 'express';
import { Queue } from './queue.model';
import { QueueEntry } from './queueEntry.model';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';

export const createQueue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, departmentId, locationId, practitionerId, serviceId, queueDate } = req.body;
    const organizationId = req.user!.organizationId;

    const queue = await Queue.create({
      organizationId,
      name,
      departmentId,
      locationId,
      practitionerId,
      serviceId,
      queueDate: queueDate || new Date(),
      currentTokenNumber: 0,
      isActive: true,
    });

    res.status(201).json(queue);
  } catch (error) {
    res.status(500).json({ message: 'Error creating queue', error });
  }
};

export const getQueues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const queues = await Queue.find({ organizationId, isActive: true });
    res.status(200).json(queues);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching queues', error });
  }
};

export const joinQueue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { queueId, patientId, appointmentId, checkInId } = req.body;
    const organizationId = req.user!.organizationId;

    // Use findOneAndUpdate with $inc to atomically increment the token number
    const queue = await Queue.findOneAndUpdate(
      { _id: queueId, organizationId, isActive: true },
      { $inc: { currentTokenNumber: 1 } },
      { new: true }
    );

    if (!queue) {
      res.status(404).json({ message: 'Queue not found or inactive' });
      return;
    }

    const tokenNumber = queue.currentTokenNumber.toString();
    
    const entry = await QueueEntry.create({
      organizationId,
      queueId: queue._id,
      patientId,
      appointmentId,
      checkInId,
      departmentId: queue.departmentId,
      locationId: queue.locationId,
      practitionerId: queue.practitionerId,
      tokenNumber,
      queueDate: queue.queueDate,
      status: 'WAITING',
      joinedAt: new Date(),
    });

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Error joining queue', error });
  }
};

export const updateQueueEntryStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { entryId } = req.params;
    const { status } = req.body;
    const organizationId = req.user!.organizationId;

    const updateData: any = { status };
    if (status === 'IN_CONSULTATION') updateData.calledAt = new Date();
    if (status === 'COMPLETED') updateData.completedAt = new Date();

    const entry = await QueueEntry.findOneAndUpdate({ _id: entryId, organizationId }, updateData, { new: true });
    if (!entry) {
      res.status(404).json({ message: 'Queue entry not found' });
      return;
    }
    res.status(200).json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Error updating queue entry', error });
  }
};
