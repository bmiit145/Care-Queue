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
declare class NotificationService {
    /**
     * Emit a notification event. Non-blocking — failures are logged but
     * do not propagate to the caller so that the main operation succeeds.
     */
    notify(payload: NotificationPayload): Promise<void>;
}
export declare const notificationService: NotificationService;
export {};
//# sourceMappingURL=notification.service.d.ts.map