"use strict";
/**
 * Notification Events — decoupled event definitions for the notification service.
 *
 * Architecture § Notifications:
 *   Event → NotificationService → [WhatsApp | SMS | Email | Push]
 *
 * Controllers emit events; they do NOT know about delivery channels.
 */
Object.defineProperty(exports, "__esModule", { value: true });
//# sourceMappingURL=notification.events.js.map