/**
 * Analytics Controller — operational metrics.
 *
 * Architecture requirement: calculate from Appointments, CheckIns, QueueEntries, Visits.
 * Not just total counts — operational dashboard metrics for today.
 *
 * All queries are strictly scoped to organizationId.
 */

import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { Organization } from '../organizations/organization.model';
import { Patient } from '../patients/patient.model';
import { Appointment } from '../appointments/appointment.model';
import { CheckIn } from '../check-ins/checkIn.model';
import { QueueEntry } from '../queues/queueEntry.model';
import { Visit } from '../visits/visit.model';

/** Midnight → 23:59:59 for today */
function todayRange(): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/** Average milliseconds between two date fields across a set of documents */
function avgMs(docs: Array<Record<string, Date>>, fieldA: string, fieldB: string): number {
  const valid = docs.filter(d => d[fieldA] && d[fieldB]);
  if (!valid.length) return 0;
  const total = valid.reduce((sum, d) => sum + (d[fieldB].getTime() - d[fieldA].getTime()), 0);
  return Math.round(total / valid.length);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/analytics/dashboard
// ─────────────────────────────────────────────────────────────────────────────

export const getDashboardOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // PLATFORM_ADMIN sees global cross-tenant totals
    if (req.user?.role === 'PLATFORM_ADMIN') {
      const [totalOrganizations, totalPatients, totalAppointments, totalVisits] = await Promise.all([
        Organization.countDocuments(),
        Patient.countDocuments(),
        Appointment.countDocuments(),
        Visit.countDocuments(),
      ]);
      res.json({ totalOrganizations, totalPatients, totalAppointments, totalVisits });
      return;
    }

    const organizationId = req.user!.organizationId;
    const { start, end } = todayRange();

    // ── Today's appointment breakdown ────────────────────────────────────────
    const [
      todayTotal,
      todayCompleted,
      todayCancelled,
      todayNoShow,
      todayWalkIn,
      todayInProgress,
    ] = await Promise.all([
      Appointment.countDocuments({ organizationId, date: { $gte: start, $lte: end } }),
      Appointment.countDocuments({ organizationId, date: { $gte: start, $lte: end }, status: 'COMPLETED' }),
      Appointment.countDocuments({ organizationId, date: { $gte: start, $lte: end }, status: 'CANCELLED' }),
      Appointment.countDocuments({ organizationId, date: { $gte: start, $lte: end }, status: 'NO_SHOW' }),
      Appointment.countDocuments({ organizationId, date: { $gte: start, $lte: end }, source: 'WALK_IN' }),
      Appointment.countDocuments({ organizationId, date: { $gte: start, $lte: end }, status: 'IN_CONSULTATION' }),
    ]);

    // ── Queue metrics ────────────────────────────────────────────────────────
    const [
      currentlyWaiting,
      todayServed,
    ] = await Promise.all([
      QueueEntry.countDocuments({ organizationId, queueDate: { $gte: start, $lte: end }, status: 'WAITING' }),
      QueueEntry.countDocuments({ organizationId, queueDate: { $gte: start, $lte: end }, status: 'COMPLETED' }),
    ]);

    // ── Wait time: time from joinedAt to calledAt (COMPLETED today) ──────────
    const completedEntries = await QueueEntry.find({
      organizationId,
      queueDate: { $gte: start, $lte: end },
      status: 'COMPLETED',
      joinedAt: { $exists: true },
      calledAt: { $exists: true },
      completedAt: { $exists: true },
    }).select('joinedAt calledAt completedAt').lean();

    const avgWaitMs        = avgMs(completedEntries as any, 'joinedAt', 'calledAt');
    const avgConsultMs     = avgMs(completedEntries as any, 'calledAt', 'completedAt');

    // ── Visit metrics ────────────────────────────────────────────────────────
    const [totalVisitsToday, completedVisitsToday] = await Promise.all([
      Visit.countDocuments({ organizationId, createdAt: { $gte: start, $lte: end } }),
      Visit.countDocuments({ organizationId, createdAt: { $gte: start, $lte: end }, status: 'COMPLETED' }),
    ]);

    // ── Check-in metrics ─────────────────────────────────────────────────────
    const todayCheckIns = await CheckIn.countDocuments({
      organizationId,
      checkInTime: { $gte: start, $lte: end },
    });

    // ── Lifetime totals ──────────────────────────────────────────────────────
    const [totalPatients, totalAppointmentsAll] = await Promise.all([
      Patient.countDocuments({ organizationId }),
      Appointment.countDocuments({ organizationId }),
    ]);

    res.json({
      today: {
        appointments: {
          total:         todayTotal,
          completed:     todayCompleted,
          cancelled:     todayCancelled,
          noShow:        todayNoShow,
          walkIn:        todayWalkIn,
          inProgress:    todayInProgress,
        },
        checkIns:        todayCheckIns,
        queue: {
          currentlyWaiting,
          served:          todayServed,
          avgWaitMin:      Math.round(avgWaitMs / 60000),
          avgConsultMin:   Math.round(avgConsultMs / 60000),
        },
        visits: {
          total:           totalVisitsToday,
          completed:       completedVisitsToday,
        },
      },
      lifetime: {
        totalPatients,
        totalAppointments: totalAppointmentsAll,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics overview', error });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/analytics/queue-performance
// ─────────────────────────────────────────────────────────────────────────────

export const getQueuePerformance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const days = parseInt((req.query.days as string) || '7', 10);

    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const entries = await QueueEntry.find({
      organizationId,
      queueDate: { $gte: since },
      status: 'COMPLETED',
      joinedAt: { $exists: true },
      calledAt: { $exists: true },
      completedAt: { $exists: true },
    }).select('joinedAt calledAt completedAt queueDate').lean();

    const avgWaitMs    = avgMs(entries as any, 'joinedAt', 'calledAt');
    const avgConsultMs = avgMs(entries as any, 'calledAt', 'completedAt');
    const totalServed  = entries.length;

    const noShows = await QueueEntry.countDocuments({
      organizationId,
      queueDate: { $gte: since },
      status: 'NO_SHOW',
    });

    res.json({
      periodDays:      days,
      totalServed,
      noShows,
      avgWaitMin:      Math.round(avgWaitMs / 60000),
      avgConsultMin:   Math.round(avgConsultMs / 60000),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching queue performance', error });
  }
};
