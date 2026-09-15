import { Response } from 'express';
import { Location } from './location.model';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';

// GET /api/locations — org-scoped list
export const getLocations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const locations = await Location.find({
      organizationId: req.user!.organizationId,
      isActive: true,
    }).sort({ name: 1 });
    res.status(200).json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch locations', error });
  }
};

// POST /api/locations — ORG_ADMIN / PLATFORM_ADMIN only
export const createLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, type, address, phone, contactEmail } = req.body;
    if (!name || !type) {
      res.status(400).json({ message: 'name and type are required' });
      return;
    }
    const location = await Location.create({
      organizationId: req.user!.organizationId,
      name,
      type,
      address,
      phone,
      contactEmail,
    });
    res.status(201).json(location);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create location', error });
  }
};

// GET /api/locations/:id
export const getLocationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const location = await Location.findOne({
      _id: req.params.id,
      organizationId: req.user!.organizationId,
    });
    if (!location) {
      res.status(404).json({ message: 'Location not found' });
      return;
    }
    res.status(200).json(location);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch location', error });
  }
};

// PUT /api/locations/:id — ORG_ADMIN only
export const updateLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const location = await Location.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user!.organizationId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!location) {
      res.status(404).json({ message: 'Location not found' });
      return;
    }
    res.status(200).json(location);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update location', error });
  }
};

// DELETE /api/locations/:id — soft delete
export const deleteLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const location = await Location.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user!.organizationId },
      { isActive: false },
      { new: true }
    );
    if (!location) {
      res.status(404).json({ message: 'Location not found' });
      return;
    }
    res.status(200).json({ message: 'Location deactivated', location });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete location', error });
  }
};
