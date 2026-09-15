import { Response } from 'express';
import { Department } from './department.model';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';

export const getDepartments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const departments = await Department.find({
      organizationId: req.user!.organizationId,
      isActive: true,
    }).populate('locationId', 'name').sort({ name: 1 });
    res.status(200).json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch departments', error });
  }
};

export const createDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, locationId } = req.body;
    if (!name) {
      res.status(400).json({ message: 'name is required' });
      return;
    }
    const department = await Department.create({
      organizationId: req.user!.organizationId,
      name,
      description,
      locationId,
    });
    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create department', error });
  }
};

export const getDepartmentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const department = await Department.findOne({
      _id: req.params.id,
      organizationId: req.user!.organizationId,
    }).populate('locationId', 'name address');
    if (!department) {
      res.status(404).json({ message: 'Department not found' });
      return;
    }
    res.status(200).json(department);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch department', error });
  }
};

export const updateDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const department = await Department.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user!.organizationId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!department) {
      res.status(404).json({ message: 'Department not found' });
      return;
    }
    res.status(200).json(department);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update department', error });
  }
};

export const deleteDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const department = await Department.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user!.organizationId },
      { isActive: false },
      { new: true }
    );
    if (!department) {
      res.status(404).json({ message: 'Department not found' });
      return;
    }
    res.status(200).json({ message: 'Department deactivated', department });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete department', error });
  }
};
