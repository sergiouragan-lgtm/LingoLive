import { doc, setDoc, getDoc } from 'firebase/firestore';
import { NotificationPreference } from '../models/notification_preference';
import { db, handleFirestoreError, OperationType } from '../firebase';

export class NotificationService {
  private db = db;

  async getPreferences(tenantId: string, userId: string): Promise<NotificationPreference | null> {
    const docRef = doc(this.db, 'tenants', tenantId, 'notificationPreferences', userId);
    try {
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as NotificationPreference) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, docRef.path);
      return null;
    }
  }

  async updatePreferences(tenantId: string, userId: string, preferences: NotificationPreference): Promise<void> {
    const docRef = doc(this.db, 'tenants', tenantId, 'notificationPreferences', userId);
    try {
      await setDoc(docRef, preferences);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docRef.path);
    }
  }

  // Placeholder for sending logic
  async sendNotification(tenantId: string, userId: string, type: string, message: string): Promise<void> {
    console.log(`Sending ${type} notification to ${userId} in ${tenantId}: ${message}`);
  }

  async notifyUser(userId: string, notification: { title: string; message: string; type: string }) {
    console.log(`[NotificationService] Sending in-app notification to ${userId}:`, notification);
    const key = `lingolive_notifications_${userId}`;
    let existing = [];
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(key);
        existing = stored ? JSON.parse(stored) : [];
      } catch (e) {
        console.warn('Failed to read notifications from localStorage:', e);
      }
    }
    
    const newNotif = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: false,
      timestamp: new Date().toISOString()
    };
    
    existing.unshift(newNotif);
    
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
      } catch (e) {
        console.warn('Failed to write notifications to localStorage:', e);
      }
      // Dispatch a custom event so components can listen to notifications dynamically
      window.dispatchEvent(new CustomEvent('lingolive_new_notification', { detail: newNotif }));
    }
  }
}

export const notificationService = new NotificationService();

