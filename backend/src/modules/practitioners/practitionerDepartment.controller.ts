/**
 * Practitioner-Department assignment controller.
 *
 * Supports many-to-many:
 *   POST  /api/practitioners/:id/departments        — assign a practitioner to a dept
 *   GET   /api/practitioners/:id/departments        — list depts for a practitioner
 *   DELETE /api/practitioners/:id/departments/:deptId — remove assignment
 *   GET   /api/departments/:deptId/practitioners    — list practitioners in a dept
 */

import { Response } from 'express';
import { PractitionerDepartment } from './practitionerDepartment.model';
import { Practitioner } from './practitioner.model';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';

// ── Assign practitioner → department ─────────────────────────────────────────

export const assignDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: practitionerId } = req.params;
    const { departmentId, serviceIds, slotDurationMin } = req.body;
    const organizationId = (req.user!.organizationId as string);

    if (!departmentId) {
      res.status(400).json({ message: 'departmentId is required' });
      return;
    }

    // Verify practitioner belongs to this org
    const practitioner = await Practitioner.findOne({ _id: practitionerId, organizationId });
    if (!practitioner) {
      res.status(404).json({ message: 'Practitioner not found' });
      return;
    }

    // Upsert — if already assigned, update serviceIds
    const assignment = await PractitionerDepartment.findOneAndUpdate(
      { organizationId, practitionerId: practitionerId as string, departmentId: departmentId as string },
      { serviceIds: serviceIds || [], slotDurationMin, isActive: true },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Error assigning department', error });
  }
};

// ── Get departments for a practitioner ───────────────────────────────────────

export const getPractitionerDepartments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: practitionerId } = req.params;
    const organizationId = (req.user!.organizationId as string);

    const assignments = await PractitionerDepartment.find({
      organizationId,
      practitionerId: practitionerId as string,
      isActive: true,
    })
      .populate('departmentId', 'name')
      .populate('serviceIds', 'name defaultDurationMin');

    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching practitioner departments', error });
  }
};

// ── Remove assignment ─────────────────────────────────────────────────────────

export const removeDepartmentAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: practitionerId, deptId: departmentId } = req.params;
    const organizationId = (req.user!.organizationId as string);

    const result = await PractitionerDepartment.findOneAndUpdate(
      { organizationId, practitionerId: practitionerId as string, departmentId: departmentId as string },
      { isActive: false },
      { new: true }
    );

    if (!result) {
      res.status(404).json({ message: 'Department assignment not found' });
      return;
    }

    res.status(200).json({ message: 'Department assignment removed', result });
  } catch (error) {
    res.status(500).json({ message: 'Error removing department assignment', error });
  }
};

// ── List practitioners in a department ───────────────────────────────────────

export const getPractitionersInDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deptId } = req.params;
    const organizationId = (req.user!.organizationId as string);

    const assignments = await PractitionerDepartment.find({
      organizationId,
      departmentId: deptId as string,
      isActive: true,
    })
      .populate('practitionerId', 'firstName lastName type specializations isActive')
      .populate('serviceIds', 'name defaultDurationMin');

    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching practitioners in department', error });
  }
};
