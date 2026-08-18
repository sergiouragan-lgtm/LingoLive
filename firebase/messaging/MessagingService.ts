import { Messaging, getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging } from '../config/firebase.config';

export interface EnterpriseNotificationPayload {
  recipientToken: string;
  title: string;
  body: string;
  priority: 'high' | 'normal';
  category: 'PUSH_ALERTS' | 'STUDENT_MILESTONE' | 'SECURITY_ALERT' | 'TUTOR_SESSION' | 'MARKETPLACE_PRODUCT';
  data?: Record<string, string>;
}

export class MessagingService {
  private messaging: Messaging | null;

  constructor() {
    this.messaging = getFirebaseMessaging();
  }

  /**
   * Securely request client browser permission and fetch unique FCM Token.
   */
  public async retrieveDeviceToken(vapidKey: string): Promise<string | null> {
    if (!this.messaging) {
      console.warn("[Enterprise Messaging] Push service is not initialized or unsupported in this device runtime.");
      return null;
    }

    try {
      console.log("[Enterprise Messaging] Requesting permission for FCM Notifications...");
      const token = await getToken(this.messaging, { vapidKey });
      if (token) {
        console.log(`[Enterprise Messaging] FCM Registration Token generated: ${token}`);
        return token;
      } else {
        console.warn("[Enterprise Messaging] Registration failed. Browser returned empty device token.");
        return null;
      }
    } catch (error) {
      console.error("[Enterprise Messaging Error] Token retrieval failed:", error);
      return null;
    }
  }

  /**
   * Listen for incoming message events while the user has the browser tab active (Foreground Notifications).
   */
  public listenForForegroundMessages(callback: (payload: any) => void): void {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.log("[Enterprise Messaging] High-priority foreground notification intercepted:", payload);
      callback(payload);
    });
  }

  /**
   * Outgoing transactional or marketing alert dispatcher stub (Normally triggered via Functions server side).
   */
  public async dispatchPushAlert(payload: EnterpriseNotificationPayload): Promise<boolean> {
    console.log(`[Enterprise Messaging Audit] Queuing payload dispatch: "${payload.title}" to device token ID starting: ${payload.recipientToken.substring(0, 10)}...`);
    // Outgoing push notification queueing simulation
    return true;
  }
}
