import type { Request, Response } from 'express';
import { Queue, QueueEntry } from './queue.model';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';

export const createQueue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, department, location, currentTokenNumber } = req.body;
    const organizationId = req.user?.organizationId; // Needs tenant context

    const queue = await Queue.create({
      organization: organizationId,
      name,
      department,
      location,
      currentTokenNumber: currentTokenNumber || 0,
      isActive: true,
    });

    res.status(201).json(queue);
  } catch (error) {
    res.status(500).json({ message: 'Error creating queue', error });
  }
};

export const getQueues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Should filter by organizationId in a real app, mock for now
    const queues = await Queue.find({ isActive: true });
    res.status(200).json(queues);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching queues', error });
  }
};

export const joinQueue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { queueId, patientId, priority } = req.body;

    const queue = await Queue.findById(queueId);
    if (!queue) {
      res.status(404).json({ message: 'Queue not found' });
      return;
    }

    const tokenNumber = queue.currentTokenNumber + 1;
    
    const entry = await QueueEntry.create({
      queue: queueId,
      patient: patientId,
      tokenNumber,
      priority: priority || 'NORMAL',
      status: 'WAITING',
      joinedAt: new Date(),
    });

    // Update queue's current token
    queue.currentTokenNumber = tokenNumber;
    await queue.save();

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Error joining queue', error });
  }
};

export const updateQueueEntryStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { entryId } = req.params;
    const { status } = req.body;

    const entry = await QueueEntry.findByIdAndUpdate(entryId, { status }, { new: true });
    if (!entry) {
      res.status(404).json({ message: 'Queue entry not found' });
      return;
    }
    res.status(200).json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Error updating queue entry', error });
  }
};
