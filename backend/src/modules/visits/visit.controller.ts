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
import mongoose from 'mongoose';
import { Visit } from './visit.model';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { Patient } from '../patients/patient.model';
import { Appointment } from '../appointments/appointment.model';
import { QueueEntry } from '../queues/queueEntry.model';
import { notificationService } from '../../shared/notifications/notification.service';
import { AuditService } from '../../shared/audit/audit.service';

const VISIT_TRANSITIONS: Record<string, string[]> = {
  CREATED: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

function assertValidVisitTransition(current: string, next: string): void {
  const allowed = VISIT_TRANSITIONS[current] ?? [];
  if (!allowed.includes(next)) {
    throw new Error(`Invalid visit transition: ${current} → ${next}`);
  }
}

export const createVisit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      appointmentId, patientId, practitionerId, departmentId,
      serviceId, locationId, checkInId, queueEntryId,
    } = req.body;
    const organizationId = req.user!.organizationId!;
    const orgObjectId = new mongoose.Types.ObjectId(organizationId);
    const patientObjectId = new mongoose.Types.ObjectId(String(patientId));

    if (!patientId) {
      res.status(400).json({ message: 'patientId is required' });
      return;
    }

    const patient = await Patient.findOne({ _id: patientObjectId, organizationId: orgObjectId });
    if (!patient) {
      res.status(400).json({ message: 'Patient not found in this organization' });
      return;
    }

    if (appointmentId) {
      const appt = await Appointment.findOne({ _id: new mongoose.Types.ObjectId(String(appointmentId)), organizationId: orgObjectId });
      if (!appt) {
        res.status(400).json({ message: 'Appointment not found in this organization' });
        return;
      }
      if (appt.patientId.toString() !== String(patientId)) {
        res.status(400).json({ message: 'Appointment does not belong to this patient' });
        return;
      }
    }

    if (queueEntryId) {
      const entry = await QueueEntry.findOne({ _id: new mongoose.Types.ObjectId(String(queueEntryId)), organizationId: orgObjectId });
      if (!entry) {
        res.status(400).json({ message: 'Queue entry not found in this organization' });
        return;
      }
      if (entry.patientId.toString() !== String(patientId)) {
        res.status(400).json({ message: 'Queue entry does not belong to this patient' });
        return;
      }
    }

    const visit = await Visit.create({
      organizationId: orgObjectId,
      ...(appointmentId ? { appointmentId: new mongoose.Types.ObjectId(String(appointmentId)) } : {}),
      patientId: patientObjectId,
      ...(practitionerId ? { practitionerId: new mongoose.Types.ObjectId(String(practitionerId)) } : {}),
      ...(departmentId ? { departmentId: new mongoose.Types.ObjectId(String(departmentId)) } : {}),
      ...(serviceId ? { serviceId: new mongoose.Types.ObjectId(String(serviceId)) } : {}),
      ...(locationId ? { locationId: new mongoose.Types.ObjectId(String(locationId)) } : {}),
      ...(checkInId ? { checkInId: new mongoose.Types.ObjectId(String(checkInId)) } : {}),
      ...(queueEntryId ? { queueEntryId: new mongoose.Types.ObjectId(String(queueEntryId)) } : {}),
      status: 'CREATED',
    });

    void AuditService.log({
      organizationId,
      actorUserId: req.user!.id,
      actorRole: req.user!.role,
      action: 'CREATE',
      entityType: 'Visit',
      entityId: visit._id.toString(),
      metadata: { appointmentId, queueEntryId, status: 'CREATED' },
      ...(req.ip ? { ipAddress: req.ip } : {}),
    });

    res.status(201).json(visit);
  } catch (error) {
    res.status(500).json({ message: 'Error creating visit', error });
  }
};

export const getVisits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId!;
    const filter: Record<string, unknown> = { organizationId: new mongoose.Types.ObjectId(organizationId) };

    if (req.query.patientId) filter.patientId = new mongoose.Types.ObjectId(String(req.query.patientId));
    if (req.query.practitionerId) filter.practitionerId = new mongoose.Types.ObjectId(String(req.query.practitionerId));
    if (req.query.status) filter.status = String(req.query.status);
    if (req.query.date) {
      const d = new Date(String(req.query.date));
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);
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

export const getVisitById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId!;
    const visit = await Visit.findOne({ _id: new mongoose.Types.ObjectId(String(id)), organizationId: new mongoose.Types.ObjectId(organizationId) })
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

export const updateVisitStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status?: string };
    const organizationId = req.user!.organizationId!;
    const orgObjectId = new mongoose.Types.ObjectId(organizationId);

    if (!status) {
      res.status(400).json({ message: 'status is required' });
      return;
    }

    const visit = await Visit.findOne({ _id: new mongoose.Types.ObjectId(String(id)), organizationId: orgObjectId });
    if (!visit) {
      res.status(404).json({ message: 'Visit not found' });
      return;
    }

    try {
      assertValidVisitTransition(visit.status, status);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid visit transition';
      res.status(400).json({ message, allowedTransitions: VISIT_TRANSITIONS[visit.status] ?? [] });
      return;
    }

    const previousStatus = visit.status;
    visit.status = status;
    if (status === 'IN_PROGRESS') visit.startedAt = new Date();
    if (status === 'COMPLETED') visit.endedAt = new Date();
    await visit.save();

    void AuditService.log({
      organizationId,
      actorUserId: req.user!.id,
      actorRole: req.user!.role,
      action: 'STATUS_CHANGE',
      entityType: 'Visit',
      entityId: visit._id.toString(),
      metadata: { previousStatus, newStatus: visit.status },
      ...(req.ip ? { ipAddress: req.ip } : {}),
    });

    if (status === 'COMPLETED') {
      if (visit.appointmentId) {
        await Appointment.findOneAndUpdate(
          { _id: visit.appointmentId, organizationId: orgObjectId },
          { status: 'COMPLETED' }
        );
      }
      if (visit.queueEntryId) {
        await QueueEntry.findOneAndUpdate(
          { _id: visit.queueEntryId, organizationId: orgObjectId },
          { status: 'COMPLETED', completedAt: new Date() }
        );
      }
    }

    const eventMap: Record<string, 'VISIT_STARTED' | 'VISIT_COMPLETED'> = {
      IN_PROGRESS: 'VISIT_STARTED',
      COMPLETED: 'VISIT_COMPLETED',
    };
    const notificationEvent = eventMap[status];
    if (notificationEvent) {
      notificationService.notify({
        event: notificationEvent,
        organizationId,
        patientId: visit.patientId.toString(),
        ...(visit.practitionerId ? { practitionerId: visit.practitionerId.toString() } : {}),
        context: { visitId: visit._id.toString(), status },
      });
    }

    res.status(200).json(visit);
  } catch (error) {
    res.status(500).json({ message: 'Error updating visit status', error });
  }
};
