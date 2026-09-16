/**
 * Appointment state machine — the single owner of appointment status changes.
 *
 * The transition table used to live inside appointment.controller.ts and was
 * not exported, so queue.controller and visit.controller each reached past it
 * with `Appointment.findOneAndUpdate({ status })`. That let a completing visit
 * force COMPLETED onto an appointment sitting in CANCELLED or NO_SHOW — a
 * transition this table forbids. Architecture rule 11 puts these rules in the
 * domain layer; this module is that layer.
 *
 * Two policies, deliberately different:
 *
 *  - `canTransition` governs the explicit PATCH /appointments/:id/status API.
 *    It is the original strict table, unchanged, so the public contract does
 *    not shift underneath existing clients.
 *
 *  - `canSync` governs status changes driven by a queue or visit event. Those
 *    legitimately skip stages (a walk-in goes BOOKED → IN_QUEUE without ever
 *    being CONFIRMED), so forward jumps are allowed — but terminal states stay
 *    absorbing and backward moves stay forbidden, which is where the actual
 *    corruption was.
 */
import { Appointment } from './appointment.model';

export const APPOINTMENT_TRANSITIONS: Record<string, string[]> = {
  BOOKED: ['CONFIRMED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW'],
  CONFIRMED: ['CHECKED_IN', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW'],
  CHECKED_IN: ['IN_QUEUE', 'CANCELLED', 'NO_SHOW'],
  IN_QUEUE: ['IN_CONSULTATION', 'CANCELLED', 'NO_SHOW'],
  IN_CONSULTATION: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
  RESCHEDULED: ['BOOKED'],
};

/** Ordered operational lifecycle. Position defines "forward". */
const LIFECYCLE = [
  'BOOKED',
  'CONFIRMED',
  'CHECKED_IN',
  'IN_QUEUE',
  'IN_CONSULTATION',
  'COMPLETED',
] as const;

/** Statuses that end the appointment. Nothing may move out of these. */
const TERMINAL = new Set(['COMPLETED', 'CANCELLED', 'NO_SHOW']);

export const allowedNextStatuses = (current: string): string[] =>
  APPOINTMENT_TRANSITIONS[current] ?? [];

export const canTransition = (current: string, next: string): boolean =>
  allowedNextStatuses(current).includes(next);

export class InvalidAppointmentTransitionError extends Error {
  readonly allowedTransitions: string[];

  constructor(current: string, next: string) {
    super(`Invalid transition: ${current} → ${next}`);
    this.name = 'InvalidAppointmentTransitionError';
    this.allowedTransitions = allowedNextStatuses(current);
  }
};

const canSync = (current: string, next: string): boolean => {
  if (TERMINAL.has(current)) return false;
  if (next === 'CANCELLED' || next === 'NO_SHOW') return true;

  const from = LIFECYCLE.indexOf(current as (typeof LIFECYCLE)[number]);
  const to = LIFECYCLE.indexOf(next as (typeof LIFECYCLE)[number]);

  return from !== -1 && to !== -1 && to > from;
};

/**
 * Best-effort status sync driven by a queue or visit event.
 *
 * The operational event (patient called, visit completed) has already happened
 * and is the source of truth, so an illegal appointment transition must not
 * roll it back. It is skipped and logged instead of being forced through.
 */
export const syncAppointmentStatus = async (
  appointmentId: string,
  organizationId: string,
  nextStatus: string
): Promise<'applied' | 'unchanged' | 'skipped' | 'not-found'> => {
  const appointment = await Appointment.findOne({ _id: appointmentId, organizationId });

  if (!appointment) {
    return 'not-found';
  }

  if (appointment.status === nextStatus) {
    return 'unchanged';
  }

  if (!canSync(appointment.status, nextStatus)) {
    console.warn(
      `[appointment] Skipped illegal sync ${appointment.status} → ${nextStatus} ` +
        `for appointment ${appointmentId}`
    );
    return 'skipped';
  }

  appointment.status = nextStatus;
  await appointment.save();
  return 'applied';
};
