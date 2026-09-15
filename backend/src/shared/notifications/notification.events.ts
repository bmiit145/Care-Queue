/**
 * Notification Events — decoupled event definitions for the notification service.
 *
 * Architecture § Notifications:
 *   Event → NotificationService → [WhatsApp | SMS | Email | Push]
 *
 * Controllers emit events; they do NOT know about delivery channels.
 */

export type NotificationEventType =
  | 'APPOINTMENT_BOOKED'
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_REMINDER'
  | 'APPOINTMENT_RESCHEDULED'
  | 'CHECKIN_COMPLETED'
  | 'QUEUE_JOINED'
  | 'QUEUE_POSITION_CHANGED'
  | 'PATIENT_CALLED'
  | 'PATIENT_RECALLED'
  | 'PATIENT_SKIPPED'
  | 'PATIENT_NO_SHOW'
  | 'DOCTOR_DELAYED'
  | 'VISIT_STARTED'
  | 'VISIT_COMPLETED';

export interface NotificationPayload {
  event: NotificationEventType;
  organizationId: string;
  patientId?: string;
  practitionerId?: string;
  /** Resource-specific context (appointment, queue entry, visit, etc.) */
  context: Record<string, unknown>;
}
