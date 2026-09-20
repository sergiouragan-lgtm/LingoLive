import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export enum NotificationType {
  SEARCH_ALERT = 'search_alert',
  TRENDING_TOPIC = 'trending_topic',
  JOB_COMPLETE = 'job_complete',
  JOB_FAILED = 'job_failed',
  ACHIEVEMENT = 'achievement',
  MILESTONE = 'milestone',
  MESSAGE = 'message',
  SYSTEM_ALERT = 'system_alert',
}

export interface NotificationPayload {
  type: NotificationType;
  userId: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
  priority?: 'high' | 'normal' | 'low';
  expiresIn?: number; // milliseconds
}

export interface UserNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
  read: boolean;
  createdAt: Date;
  readAt?: Date;
}

export interface NotificationSubscription {
  userId: string;
  channel: string;
  subscriptionId: string;
  createdAt: Date;
}

class NotificationsService {
  private db: FirebaseFirestore.Firestore;
  private subscribers: Map<string, Set<(notification: UserNotification) => void>> = new Map();
  private notificationQueue: UserNotification[] = [];
  private maxQueueSize = 10000;

  constructor() {
    this.db = getFirestore();
  }

  /**
   * Create and store a notification
   */
  public async createNotification(payload: NotificationPayload): Promise<UserNotification> {
    try {
      const notification: UserNotification = {
        id: '',
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        data: payload.data,
        actionUrl: payload.actionUrl,
        read: false,
        createdAt: new Date(),
      };

      const docRef = await this.db
        .collection('notifications')
        .doc(payload.userId)
        .collection('messages')
        .add({
          ...notification,
          createdAt: new Date(),
        });

      notification.id = docRef.id;

      // Broadcast to connected subscribers
      this.broadcastToUser(payload.userId, notification);

      // Log security event
      logSecurityEvent(
        'NOTIFICATION_CREATED' as any,
        'info' as any,
        `Notification created: ${payload.type}`,
        { userId: payload.userId },
        { type: payload.type, title: payload.title }
      );

      return notification;
    } catch (error: any) {
      logSecurityEvent(
        'NOTIFICATION_CREATE_FAILED' as any,
        'warning' as any,
        `Failed to create notification: ${error.message}`,
        { userId: payload.userId },
        { error: error.message }
      );
      throw error;
    }
  }

  /**
   * Get user notifications
   */
  public async getNotifications(
    userId: string,
    limit: number = 50,
    unreadOnly: boolean = false
  ): Promise<UserNotification[]> {
    try {
      let query = this.db
        .collection('notifications')
        .doc(userId)
        .collection('messages')
        .orderBy('createdAt', 'desc')
        .limit(limit);

      if (unreadOnly) {
        query = query.where('read', '==', false) as any;
      }

      const snapshot = await query.get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        readAt: doc.data().readAt ? doc.data().readAt.toDate() : undefined,
      } as UserNotification));
    } catch (error: any) {
      console.error(`Error fetching notifications for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  public async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      await this.db
        .collection('notifications')
        .doc(userId)
        .collection('messages')
        .doc(notificationId)
        .update({
          read: true,
          readAt: new Date(),
        });

      logSecurityEvent(
        'NOTIFICATION_READ' as any,
        'info' as any,
        'Notification marked as read',
        { userId, notificationId },
        { notificationId }
      );
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  public async markAllAsRead(userId: string): Promise<number> {
    try {
      const snapshot = await this.db
        .collection('notifications')
        .doc(userId)
        .collection('messages')
        .where('read', '==', false)
        .get();

      const batch = this.db.batch();
      let count = 0;

      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          read: true,
          readAt: new Date(),
        });
        count++;
      });

      await batch.commit();

      logSecurityEvent(
        'NOTIFICATIONS_READ_ALL' as any,
        'info' as any,
        `Marked ${count} notifications as read`,
        { userId },
        { count }
      );

      return count;
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      return 0;
    }
  }

  /**
   * Delete notification
   */
  public async deleteNotification(userId: string, notificationId: string): Promise<void> {
    try {
      await this.db
        .collection('notifications')
        .doc(userId)
        .collection('messages')
        .doc(notificationId)
        .delete();

      logSecurityEvent(
        'NOTIFICATION_DELETED' as any,
        'info' as any,
        'Notification deleted',
        { userId, notificationId },
        { notificationId }
      );
    } catch (error: any) {
      console.error('Error deleting notification:', error);
    }
  }

  /**
   * Delete all notifications
   */
  public async deleteAllNotifications(userId: string): Promise<number> {
    try {
      const snapshot = await this.db
        .collection('notifications')
        .doc(userId)
        .collection('messages')
        .get();

      const batch = this.db.batch();
      let count = 0;

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        count++;
      });

      await batch.commit();

      logSecurityEvent(
        'NOTIFICATIONS_DELETED_ALL' as any,
        'info' as any,
        `Deleted all ${count} notifications`,
        { userId },
        { count }
      );

      return count;
    } catch (error: any) {
      console.error('Error deleting all notifications:', error);
      return 0;
    }
  }

  /**
   * Get unread notification count
   */
  public async getUnreadCount(userId: string): Promise<number> {
    try {
      const snapshot = await this.db
        .collection('notifications')
        .doc(userId)
        .collection('messages')
        .where('read', '==', false)
        .count()
        .get();

      return snapshot.data().count;
    } catch (error: any) {
      console.error(`Error fetching unread count for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Subscribe to real-time notifications via WebSocket
   */
  public subscribe(userId: string, callback: (notification: UserNotification) => void): string {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }

    this.subscribers.get(userId)!.add(callback);

    const subscriptionId = `${userId}_${Date.now()}_${Math.random()}`;

    logSecurityEvent(
      'NOTIFICATION_SUBSCRIBED' as any,
      'info' as any,
      'User subscribed to notifications',
      { userId },
      { subscriptionId }
    );

    return subscriptionId;
  }

  /**
   * Unsubscribe from real-time notifications
   */
  public unsubscribe(userId: string, callback: (notification: UserNotification) => void): void {
    const userSubscribers = this.subscribers.get(userId);
    if (userSubscribers) {
      userSubscribers.delete(callback);

      if (userSubscribers.size === 0) {
        this.subscribers.delete(userId);
      }
    }

    logSecurityEvent(
      'NOTIFICATION_UNSUBSCRIBED' as any,
      'info' as any,
      'User unsubscribed from notifications',
      { userId },
      {}
    );
  }

  /**
   * Broadcast notification to connected subscribers
   */
  private broadcastToUser(userId: string, notification: UserNotification): void {
    const userSubscribers = this.subscribers.get(userId);
    if (userSubscribers) {
      userSubscribers.forEach((callback) => {
        try {
          callback(notification);
        } catch (error) {
          console.error('Error in notification callback:', error);
        }
      });
    }

    // Queue for offline delivery
    this.queueNotification(notification);
  }

  /**
   * Queue notification for offline users
   */
  private queueNotification(notification: UserNotification): void {
    if (this.notificationQueue.length >= this.maxQueueSize) {
      this.notificationQueue.shift();
    }
    this.notificationQueue.push(notification);
  }

  /**
   * Get notification statistics
   */
  public async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
  }> {
    try {
      const snapshot = await this.db
        .collection('notifications')
        .doc(userId)
        .collection('messages')
        .get();

      const stats = {
        total: snapshot.size,
        unread: 0,
        byType: {} as Record<string, number>,
      };

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (!data.read) {
          stats.unread++;
        }

        const type = data.type as string;
        stats.byType[type] = (stats.byType[type] || 0) + 1;
      });

      return stats;
    } catch (error: any) {
      console.error(`Error fetching notification stats for user ${userId}:`, error);
      return { total: 0, unread: 0, byType: {} };
    }
  }

  /**
   * Clean up old notifications (older than specified days)
   */
  public async cleanupOldNotifications(userId: string, olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const snapshot = await this.db
        .collection('notifications')
        .doc(userId)
        .collection('messages')
        .where('createdAt', '<', cutoffDate)
        .get();

      const batch = this.db.batch();
      let count = 0;

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        count++;
      });

      if (count > 0) {
        await batch.commit();
      }

      return count;
    } catch (error: any) {
      console.error('Error cleaning up old notifications:', error);
      return 0;
    }
  }

  /**
   * Broadcast notification to multiple users
   */
  public async broadcastToUsers(userIds: string[], payload: Omit<NotificationPayload, 'userId'>): Promise<number> {
    let successCount = 0;

    for (const userId of userIds) {
      try {
        await this.createNotification({
          ...payload,
          userId,
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to create notification for user ${userId}:`, error);
      }
    }

    return successCount;
  }

  /**
   * Get active subscriber count
   */
  public getActiveSubscriberCount(): number {
    return this.subscribers.size;
  }

  /**
   * Get queued notification count
   */
  public getQueuedNotificationCount(): number {
    return this.notificationQueue.length;
  }
}

export const notificationsService = new NotificationsService();
