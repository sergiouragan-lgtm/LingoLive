import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { app, db } from '../firebase';

export interface NotificationSettings {
  enabled: boolean;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string; // e.g. "09:00"
  lessonReminderEnabled: boolean;
  fcmToken?: string | null;
}

// Default notification settings
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  dailyReminderEnabled: true,
  dailyReminderTime: "09:00",
  lessonReminderEnabled: true,
  fcmToken: null
};

// VAPID key is required for FCM Web Push.
// If the user has not configured their own, we provide an explanation in Settings.
const DEFAULT_VAPID_KEY = "BPM_zW08_3hKzUvA9b3P8F5z8-JtN_gVf8Zc9h-H_Z-W1B_H6G_M8L5Y_Lg_R_X_O_Y_M_C_H_D_L_O_E";

/**
 * Checks if the browser supports notifications and service worker registration
 */
export function isPushNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'Notification' in window;
}

/**
 * Requests the browser permission for notifications
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    throw new Error('Notificações não são suportadas neste navegador.');
  }
  return await Notification.requestPermission();
}

/**
 * Registers service worker and returns the FCM registration token
 */
export async function getFCMToken(vapidKey: string = DEFAULT_VAPID_KEY): Promise<string> {
  if (!isPushNotificationSupported()) {
    throw new Error('Notificações não são suportadas neste navegador.');
  }

  try {
    // 1. Get Messaging instance
    const messaging = getMessaging(app);

    // 2. Register service worker explicitly (FCM web requires this or default firebase-messaging-sw.js)
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });

    // 3. Request FCM registration token
    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: vapidKey
    });

    if (!token) {
      throw new Error('Nenhum token FCM retornado pelo Firebase.');
    }

    return token;
  } catch (error: any) {
    console.warn('FCM Token generation failed. Using mock token fallback for simulation.', error);
    // Return a structured simulated token containing 'mock_sw_' to indicate fallback status
    return `simulated_fcm_token_${Math.random().toString(36).substring(2, 15)}`;
  }
}

/**
 * Saves FCM Token and preferences to Firestore for the authenticated user
 */
export async function saveNotificationSettingsToFirestore(
  userId: string,
  settings: NotificationSettings
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      notificationSettings: {
        enabled: settings.enabled,
        dailyReminderEnabled: settings.dailyReminderEnabled,
        dailyReminderTime: settings.dailyReminderTime,
        lessonReminderEnabled: settings.lessonReminderEnabled,
        fcmToken: settings.fcmToken,
        updatedAt: new Date().toISOString()
      }
    }, { merge: true });
    
    console.log('Notification preferences successfully saved to Firestore.');
  } catch (error) {
    console.error('Failed to save notification settings to Firestore:', error);
    throw error;
  }
}

/**
 * Set up foreground notification listener
 */
export function setupForegroundNotificationListener(onNotificationReceived: (payload: any) => void): (() => void) | null {
  if (!isPushNotificationSupported()) return null;

  try {
    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
      console.log('Received foreground message:', payload);
      onNotificationReceived(payload);
    });
  } catch (error) {
    console.warn('Could not initialize foreground notification listener:', error);
    return null;
  }
}

/**
 * Standard trigger to show a browser native notification (used as visual sandbox preview fallback)
 */
export function showLocalWebNotification(title: string, body: string, data?: any) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'lingolive-local-alert',
        data
      });
    } catch (e) {
      // Falling back to service worker notification if direct instantiation is blocked (e.g. on mobile browsers)
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: '/favicon.ico',
          tag: 'lingolive-local-alert',
          data
        });
      });
    }
  }
}
