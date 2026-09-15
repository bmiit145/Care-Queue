export class NotificationService {
  static async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    // Phase 1: Mock SMS service
    // In production, integrate with Twilio, AWS SNS, etc.
    console.log(`[MOCK SMS] Sending to ${phoneNumber}: ${message}`);
    return true;
  }

  static async sendEmail(email: string, subject: string, html: string): Promise<boolean> {
    // Phase 1: Mock Email service
    // In production, integrate with SendGrid, SES, etc.
    console.log(`[MOCK EMAIL] Sending to ${email} | Subject: ${subject}`);
    return true;
  }
}
