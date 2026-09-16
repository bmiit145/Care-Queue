import type { Response } from 'express';
import { Practitioner } from './practitioner.model';
import type { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { orgIdOf } from '../../shared/tenant/orgScope';
import { failed } from '../../shared/http/respond';

export const getPractitioners = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: any = {
      organizationId: orgIdOf(req),
      isActive: true,
    };
    if (req.query.type) filter.type = req.query.type;

    const practitioners = await Practitioner.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ lastName: 1 });
    res.status(200).json(practitioners);
  } catch (error) {
    failed(res, 'Failed to fetch practitioners', error);
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
      organizationId: orgIdOf(req),
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
    failed(res, 'Failed to create practitioner', error);
  }
};

export const getPractitionerById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const practitioner = await Practitioner.findOne({
      _id: req.params.id,
      organizationId: orgIdOf(req),
    }).populate('userId', 'firstName lastName email');
    if (!practitioner) {
      res.status(404).json({ message: 'Practitioner not found' });
      return;
    }
    res.status(200).json(practitioner);
  } catch (error) {
    failed(res, 'Failed to fetch practitioner', error);
  }
};

export const updatePractitioner = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const practitioner = await Practitioner.findOneAndUpdate(
      { _id: req.params.id, organizationId: orgIdOf(req) },
      req.body,
      { new: true, runValidators: true }
    );
    if (!practitioner) {
      res.status(404).json({ message: 'Practitioner not found' });
      return;
    }
    res.status(200).json(practitioner);
  } catch (error) {
    failed(res, 'Failed to update practitioner', error);
  }
};

export const deletePractitioner = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const practitioner = await Practitioner.findOneAndUpdate(
      { _id: req.params.id, organizationId: orgIdOf(req) },
      { isActive: false },
      { new: true }
    );
    if (!practitioner) {
      res.status(404).json({ message: 'Practitioner not found' });
      return;
    }
    res.status(200).json({ message: 'Practitioner deactivated', practitioner });
  } catch (error) {
    failed(res, 'Failed to delete practitioner', error);
  }
};
