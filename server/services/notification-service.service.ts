import { getFirestore } from 'firebase-admin/firestore';
export interface Notification { notificationId: string; userId: string; message: string; read: boolean; }
class NotificationServiceImpl {
  private db = getFirestore();
  async sendNotification(userId: string, message: string): Promise<Notification> {
    const notificationId = `notif_${Date.now()}`;
    const notif: Notification = { notificationId, userId, message, read: false };
    await this.db.collection('notifications').doc(notificationId).set(notif);
    return notif;
  }
}
export const notificationService = new NotificationServiceImpl();
