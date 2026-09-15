/**
 * Visit / Encounter Controller — operational boundary for consultations.
 *
 * Architecture compliance:
 *  ✅ All queries scoped to organizationId (tenant isolation)
 *  ✅ State machine (CREATED → ARRIVED → IN_PROGRESS → COMPLETED | CANCELLED)
 *  ✅ Cross-entity: validate patient, appointment, queue entry belong to same org
 *  ✅ Notification events on start/complete
 *  ✅ Keep Visit lean — no clinical fields (notes, diagnosis stay in future bounded domains)
 */

import { Response } from 'express';
import { Visit } from './visit.model';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { Patient } from '../patients/patient.model';
import { Appointment } from '../appointments/appointment.model';
import { QueueEntry } from '../queues/queueEntry.model';
import { notificationService } from '../../shared/notifications/notification.service';
import { AuditService } from '../../shared/audit/audit.service';

// ── State machine ─────────────────────────────────────────────────────────────

const VISIT_TRANSITIONS: Record<string, string[]> = {
  CREATED:     ['ARRIVED', 'CANCELLED'],
  ARRIVED:     ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED:   [],
  CANCELLED:   [],
};

function assertValidVisitTransition(current: string, next: string): void {
  const allowed = VISIT_TRANSITIONS[current] ?? [];
  if (!allowed.includes(next)) {
    throw new Error(`Invalid visit transition: ${current} → ${next}`);
  }
}

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/visits
 * Create a Visit/Encounter.
 * Cross-entity validates: patient, appointment, queue entry.
 */
export const createVisit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      appointmentId, patientId, practitionerId, departmentId,
      serviceId, locationId, checkInId, queueEntryId,
    } = req.body;
    const organizationId = (req.user!.organizationId as string);

    if (!patientId) {
      res.status(400).json({ message: 'patientId is required' });
      return;
    }

    // Cross-entity: validate patient belongs to this org
    const patient = await Patient.findOne({ _id: patientId, organizationId });
    if (!patient) {
      res.status(400).json({ message: 'Patient not found in this organization' });
      return;
    }

    // Cross-entity: validate appointment ownership + patient match
    if (appointmentId) {
      const appt = await Appointment.findOne({ _id: appointmentId, organizationId });
      if (!appt) {
        res.status(400).json({ message: 'Appointment not found in this organization' });
        return;
      }
      if (appt.patientId.toString() !== patientId) {
        res.status(400).json({ message: 'Appointment does not belong to this patient' });
        return;
      }
    }

    // Cross-entity: validate queue entry ownership + patient match
    if (queueEntryId) {
      const entry = await QueueEntry.findOne({ _id: queueEntryId, organizationId });
      if (!entry) {
        res.status(400).json({ message: 'Queue entry not found in this organization' });
        return;
      }
      if (entry.patientId.toString() !== patientId) {
        res.status(400).json({ message: 'Queue entry does not belong to this patient' });
        return;
      }
    }

    const visit = await Visit.create({
      organizationId,
      appointmentId,
      patientId,
      practitionerId,
      departmentId,
      serviceId,
      locationId,
      checkInId,
      queueEntryId,
      status: 'CREATED',
    });

    AuditService.log({
      organizationId: organizationId!.toString(),
      actorUserId: req.user!.id,
      actorRole: req.user!.role,
      action: 'CREATE',
      entityType: 'Visit',
      entityId: visit._id.toString(),
      metadata: { appointmentId, queueEntryId, status: 'CREATED' },
      ipAddress: req.ip
    });

    res.status(201).json(visit);
  } catch (error) {
    res.status(500).json({ message: 'Error creating visit', error });
  }
};

/**
 * GET /api/visits
 * List visits for this organization. Optional filters: ?date=&patientId=&practitionerId=&status=
 */
export const getVisits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = (req.user!.organizationId as string);
    const filter: Record<string, unknown> = { organizationId };

    if (req.query.patientId)       filter.patientId       = req.query.patientId;
    if (req.query.practitionerId)  filter.practitionerId  = req.query.practitionerId;
    if (req.query.status)          filter.status          = req.query.status;
    if (req.query.date) {
      const d = new Date(req.query.date as string);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end   = new Date(d); end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    const visits = await Visit.find(filter)
      .populate('patientId', 'firstName lastName contactPhone')
      .populate('practitionerId', 'firstName lastName type')
      .populate('departmentId', 'name')
      .populate('serviceId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(visits);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching visits', error });
  }
};

/**
 * GET /api/visits/:id
 */
export const getVisitById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = (req.user!.organizationId as string);

    const visit = await Visit.findOne({ _id: id, organizationId })
      .populate('patientId', 'firstName lastName contactPhone')
      .populate('practitionerId', 'firstName lastName type')
      .populate('departmentId', 'name')
      .populate('serviceId', 'name')
      .populate('appointmentId', 'date scheduledStartTime status')
      .populate('queueEntryId', 'tokenNumber status');

    if (!visit) {
      res.status(404).json({ message: 'Visit not found' });
      return;
    }
    res.status(200).json(visit);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching visit', error });
  }
};

/**
 * PATCH /api/visits/:id/status
 * State machine enforced. Fires notification events.
 */
export const updateVisitStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const organizationId = (req.user!.organizationId as string);

    if (!status) {
      res.status(400).json({ message: 'status is required' });
      return;
    }

    const visit = await Visit.findOne({ _id: id, organizationId });
    if (!visit) {
      res.status(404).json({ message: 'Visit not found' });
      return;
    }

    try {
      assertValidVisitTransition(visit.status, status);
    } catch (e: any) {
      res.status(400).json({ message: e.message, allowedTransitions: VISIT_TRANSITIONS[visit.status] });
      return;
    }

    const previousStatus = visit.status;
    visit.status = status;
    if (status === 'IN_PROGRESS') visit.startedAt = new Date();
    if (status === 'COMPLETED')   visit.endedAt   = new Date();
    await visit.save();

    AuditService.log({
      organizationId: organizationId!.toString(),
      actorUserId: req.user!.id,
      actorRole: req.user!.role,
      action: 'STATUS_CHANGE',
      entityType: 'Visit',
      entityId: visit._id.toString(),
      metadata: { previousStatus, newStatus: visit.status },
      ipAddress: req.ip
    });

    // Sync related entities when visit completes
    if (status === 'COMPLETED') {
      if (visit.appointmentId) {
        await Appointment.findOneAndUpdate(
          { _id: visit.appointmentId, organizationId },
          { status: 'COMPLETED' }
        );
      }
      if (visit.queueEntryId) {
        await QueueEntry.findOneAndUpdate(
          { _id: visit.queueEntryId, organizationId },
          { status: 'COMPLETED', completedAt: new Date() }
        );
      }
    }

    // Notification events
    const eventMap: Record<string, 'VISIT_STARTED' | 'VISIT_COMPLETED'> = {
      IN_PROGRESS: 'VISIT_STARTED',
      COMPLETED:   'VISIT_COMPLETED',
    };
    if (eventMap[status]) {
      notificationService.notify({
        event:          eventMap[status],
        organizationId: organizationId!.toString(),
        patientId:      visit.patientId.toString(),
        practitionerId: visit.practitionerId?.toString(),
        context:        { visitId: id, status },
      });
    }

    res.status(200).json(visit);
  } catch (error) {
    res.status(500).json({ message: 'Error updating visit', error });
  }
};
