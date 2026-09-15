import type { Response } from 'express';
import { Practitioner } from './practitioner.model';
import type { AuthRequest } from '../../shared/middlewares/auth.middleware';

export const getPractitioners = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: any = {
      organizationId: req.user!.organizationId,
      isActive: true,
    };
    if (req.query.type) filter.type = req.query.type;

    const practitioners = await Practitioner.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ lastName: 1 });
    res.status(200).json(practitioners);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch practitioners', error });
  }
};

export const createPractitioner = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, type, specializations, contactEmail, contactPhone, userId } = req.body;
    if (!firstName || !lastName || !type) {
      res.status(400).json({ message: 'firstName, lastName, and type are required' });
      return;
    }
    const practitioner = await Practitioner.create({
      organizationId: req.user!.organizationId,
      firstName,
      lastName,
      type,
      specializations: specializations || [],
      contactEmail,
      contactPhone,
      userId,
    });
    res.status(201).json(practitioner);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create practitioner', error });
  }
};

export const getPractitionerById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const practitioner = await Practitioner.findOne({
      _id: req.params.id,
      organizationId: req.user!.organizationId,
    }).populate('userId', 'firstName lastName email');
    if (!practitioner) {
      res.status(404).json({ message: 'Practitioner not found' });
      return;
    }
    res.status(200).json(practitioner);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch practitioner', error });
  }
};

export const updatePractitioner = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const practitioner = await Practitioner.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user!.organizationId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!practitioner) {
      res.status(404).json({ message: 'Practitioner not found' });
      return;
    }
    res.status(200).json(practitioner);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update practitioner', error });
  }
};

export const deletePractitioner = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const practitioner = await Practitioner.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user!.organizationId },
      { isActive: false },
      { new: true }
    );
    if (!practitioner) {
      res.status(404).json({ message: 'Practitioner not found' });
      return;
    }
    res.status(200).json({ message: 'Practitioner deactivated', practitioner });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete practitioner', error });
  }
};
