import { Response } from 'express';
import mongoose from 'mongoose';
import { Service } from './service.model';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';

export const getServices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId!;
    const filter: Record<string, unknown> = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
      isActive: true,
    };

    if (req.query.departmentId) {
      filter.departmentId = new mongoose.Types.ObjectId(String(req.query.departmentId));
    }

    const services = await Service.find(filter)
      .populate('departmentId', 'name')
      .sort({ name: 1 });
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch services', error });
  }
};

export const createService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, departmentId, description, durationInMinutes, price } = req.body;
    const organizationId = req.user!.organizationId!;

    if (!name || !departmentId) {
      res.status(400).json({ message: 'name and departmentId are required' });
      return;
    }

    const service = await Service.create({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      name,
      departmentId: new mongoose.Types.ObjectId(String(departmentId)),
      ...(description ? { description } : {}),
      durationInMinutes: durationInMinutes || 15,
      ...(price !== undefined ? { price } : {}),
    });
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create service', error });
  }
};

export const getServiceById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId!;
    const service = await Service.findOne({
      _id: new mongoose.Types.ObjectId(String(req.params.id)),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    }).populate('departmentId', 'name');

    if (!service) {
      res.status(404).json({ message: 'Service not found' });
      return;
    }
    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch service', error });
  }
};

export const updateService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId!;
    const service = await Service.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(String(req.params.id)),
        organizationId: new mongoose.Types.ObjectId(organizationId),
      },
      req.body,
      { new: true, runValidators: true }
    );
    if (!service) {
      res.status(404).json({ message: 'Service not found' });
      return;
    }
    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update service', error });
  }
};

export const deleteService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId!;
    const service = await Service.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(String(req.params.id)),
        organizationId: new mongoose.Types.ObjectId(organizationId),
      },
      { isActive: false },
      { new: true }
    );
    if (!service) {
      res.status(404).json({ message: 'Service not found' });
      return;
    }
    res.status(200).json({ message: 'Service deactivated', service });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete service', error });
  }
};
