import { Response } from 'express';
import { Department } from './department.model';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { orgIdOf } from '../../shared/tenant/orgScope';
import { failed } from '../../shared/http/respond';

export const getDepartments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const departments = await Department.find({
      organizationId: orgIdOf(req),
      isActive: true,
    }).populate('locationId', 'name').sort({ name: 1 });
    res.status(200).json(departments);
  } catch (error) {
    failed(res, 'Failed to fetch departments', error);
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
      organizationId: orgIdOf(req),
      name,
      description,
      locationId,
    });
    res.status(201).json(department);
  } catch (error) {
    failed(res, 'Failed to create department', error);
  }
};

export const getDepartmentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const department = await Department.findOne({
      _id: req.params.id,
      organizationId: orgIdOf(req),
    }).populate('locationId', 'name address');
    if (!department) {
      res.status(404).json({ message: 'Department not found' });
      return;
    }
    res.status(200).json(department);
  } catch (error) {
    failed(res, 'Failed to fetch department', error);
  }
};

export const updateDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const department = await Department.findOneAndUpdate(
      { _id: req.params.id, organizationId: orgIdOf(req) },
      req.body,
      { new: true, runValidators: true }
    );
    if (!department) {
      res.status(404).json({ message: 'Department not found' });
      return;
    }
    res.status(200).json(department);
  } catch (error) {
    failed(res, 'Failed to update department', error);
  }
};

export const deleteDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const department = await Department.findOneAndUpdate(
      { _id: req.params.id, organizationId: orgIdOf(req) },
      { isActive: false },
      { new: true }
    );
    if (!department) {
      res.status(404).json({ message: 'Department not found' });
      return;
    }
    res.status(200).json({ message: 'Department deactivated', department });
  } catch (error) {
    failed(res, 'Failed to delete department', error);
  }
};
