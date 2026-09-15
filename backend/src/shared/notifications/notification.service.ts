/**
 * NotificationService — decoupled delivery abstraction.
 *
 * This class receives a NotificationPayload and routes it to the
 * appropriate channel(s). Controllers only call `notify()`; they
 * never import channel-specific SDKs.
 *
 * Channel adapters (WhatsApp, SMS, Email, Push) are plugged in here.
 * For now they log to console — replace with real providers later.
 */

import { NotificationPayload } from './notification.events';

class NotificationService {
  /**
   * Emit a notification event. Non-blocking — failures are logged but
   * do not propagate to the caller so that the main operation succeeds.
   */
  async notify(payload: NotificationPayload): Promise<void> {
    try {
      // TODO: Route by org preferences (SMS provider, WhatsApp, email gateway)
      console.log(`[NOTIFICATION] ${payload.event}`, {
        org: payload.organizationId,
        patient: payload.patientId,
        context: payload.context,
      });

      // === Channel adapter stubs ===
      // await this.sendEmail(payload);
      // await this.sendSMS(payload);
      // await this.sendWhatsApp(payload);
      // await this.sendPush(payload);
    } catch (err) {
      // Notifications must NEVER crash the main request
      console.error('[NOTIFICATION] Delivery failed (non-fatal):', err);
    }
  }

  // ── Channel stubs ───────────────────────────────────────────────────────

  // private async sendEmail(payload: NotificationPayload): Promise<void> { ... }
  // private async sendSMS(payload: NotificationPayload): Promise<void>   { ... }
  // private async sendWhatsApp(payload: NotificationPayload): Promise<void> { ... }
  // private async sendPush(payload: NotificationPayload): Promise<void>  { ... }
}

// Singleton — import this everywhere that needs to send notifications
export const notificationService = new NotificationService();
