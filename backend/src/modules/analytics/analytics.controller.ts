import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { Organization } from '../organizations/organization.model';
import { Patient } from '../patients/patient.model';
import { Appointment } from '../appointments/appointment.model';
import { Visit } from '../visits/visit.model';

export const getDashboardOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let stats = {};

    if (req.user?.role === 'PLATFORM_ADMIN') {
      const totalOrganizations = await Organization.countDocuments();
      const activePatients = await Patient.countDocuments();
      const totalAppointments = await Appointment.countDocuments();
      stats = { organizations: totalOrganizations, activePatients, totalAppointments };
    } else {
      const organizationId = req.user!.organizationId;

      const totalPatients = await Patient.countDocuments({ organizationId });
      
      const totalAppointments = await Appointment.countDocuments({ organizationId });
      const completedAppointments = await Appointment.countDocuments({ organizationId, status: 'COMPLETED' });
      const cancelledAppointments = await Appointment.countDocuments({ organizationId, status: 'CANCELLED' });
      const noShowAppointments = await Appointment.countDocuments({ organizationId, status: 'NO_SHOW' });
      
      const totalVisits = await Visit.countDocuments({ organizationId });
      const completedVisits = await Visit.countDocuments({ organizationId, status: 'COMPLETED' });

      stats = {
        totalPatients,
        appointments: {
          total: totalAppointments,
          completed: completedAppointments,
          cancelled: cancelledAppointments,
          noShow: noShowAppointments,
        },
        visits: {
          total: totalVisits,
          completed: completedVisits,
        }
      };
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics overview', error });
  }
};
