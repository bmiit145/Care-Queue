import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import Organization from '../organizations/organization.model';
import Patient from '../patients/patient.model';

export const getDashboardOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let stats = {};

    if (req.user?.role === 'SUPER_ADMIN') {
      const totalOrganizations = await Organization.countDocuments();
      const activePatients = await Patient.countDocuments(); // Simple aggregate for now
      stats = { organizations: totalOrganizations, activePatients };
    } else {
      const totalPatients = await Patient.countDocuments({ organizationId: req.user?.organizationId });
      stats = { totalPatients };
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics overview', error });
  }
};
