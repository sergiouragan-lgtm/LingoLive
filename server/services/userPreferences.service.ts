import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export enum NotificationChannel {
  IN_APP = 'in_app',
  PUSH = 'push',
  EMAIL = 'email',
}

export enum NotificationFrequency {
  INSTANT = 'instant',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  NEVER = 'never',
}

export interface NotificationTypePreference {
  enabled: boolean;
  channels: NotificationChannel[];
  frequency: NotificationFrequency;
}

export interface NotificationPreferences {
  userId: string;

  // Channel preferences
  inAppEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;

  // Per-type preferences
  searchAlerts: NotificationTypePreference;
  trendingTopics: NotificationTypePreference;
  jobComplete: NotificationTypePreference;
  jobFailed: NotificationTypePreference;
  achievements: NotificationTypePreference;
  milestones: NotificationTypePreference;
  messages: NotificationTypePreference;
  systemAlerts: NotificationTypePreference;

  // Global settings
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:MM format
  quietHoursEnd?: string;   // HH:MM format
  quietHoursTimezone?: string;

  // Frequency limits
  maxNotificationsPerDay?: number;
  maxNotificationsPerHour?: number;

  // Categories
  enabledCategories: string[];

  // Advanced
  unsubscribeAll: boolean; // Master switch
  doNotDisturb: boolean; // Temporary DND

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastModifiedBy?: string;
}

export interface NotificationDeliveryLog {
  userId: string;
  notificationId: string;
  channel: NotificationChannel;
  timestamp: Date;
  delivered: boolean;
  reason?: string; // Why it wasn't delivered (muted, quiet hours, etc.)
}

class UserPreferencesService {
  private db: Firestore;
  private deliveryLogs: Map<string, NotificationDeliveryLog[]> = new Map();
  private maxLogSize = 5000;

  constructor() {
    this.db = getFirestore();
  }

  /**
   * Get user notification preferences
   */
  public async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const doc = await this.db.collection('user_preferences').doc(userId).get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data() as any;
      return {
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      };
    } catch (error: any) {
      console.error(`Error fetching preferences for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Create default preferences for new user
   */
  public async createDefaultPreferences(userId: string): Promise<NotificationPreferences> {
    const defaultPreferences: NotificationPreferences = {
      userId,

      inAppEnabled: true,
      pushEnabled: true,
      emailEnabled: false,

      searchAlerts: {
        enabled: true,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        frequency: NotificationFrequency.INSTANT,
      },
      trendingTopics: {
        enabled: true,
        channels: [NotificationChannel.IN_APP],
        frequency: NotificationFrequency.DAILY,
      },
      jobComplete: {
        enabled: true,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        frequency: NotificationFrequency.INSTANT,
      },
      jobFailed: {
        enabled: true,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        frequency: NotificationFrequency.INSTANT,
      },
      achievements: {
        enabled: true,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        frequency: NotificationFrequency.INSTANT,
      },
      milestones: {
        enabled: true,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        frequency: NotificationFrequency.INSTANT,
      },
      messages: {
        enabled: true,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        frequency: NotificationFrequency.INSTANT,
      },
      systemAlerts: {
        enabled: true,
        channels: [NotificationChannel.IN_APP],
        frequency: NotificationFrequency.INSTANT,
      },

      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      quietHoursTimezone: 'UTC',

      maxNotificationsPerDay: 100,
      maxNotificationsPerHour: 20,

      enabledCategories: ['learning', 'social', 'system'],

      unsubscribeAll: false,
      doNotDisturb: false,

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await this.db.collection('user_preferences').doc(userId).set(defaultPreferences);

      logSecurityEvent(
        'USER_PREFERENCES_CREATED' as any,
        'info' as any,
        'Default notification preferences created',
        { userId },
        { userId }
      );

      return defaultPreferences;
    } catch (error: any) {
      logSecurityEvent(
        'USER_PREFERENCES_CREATE_FAILED' as any,
        'warning' as any,
        `Failed to create preferences: ${error.message}`,
        { userId },
        { error: error.message }
      );
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  public async updatePreferences(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      const updateData = {
        ...updates,
        userId,
        updatedAt: new Date(),
      };

      await this.db.collection('user_preferences').doc(userId).update(updateData);

      logSecurityEvent(
        'USER_PREFERENCES_UPDATED' as any,
        'info' as any,
        'User notification preferences updated',
        { userId },
        { updatedFields: Object.keys(updates) }
      );

      const preferences = await this.getPreferences(userId);
      if (!preferences) {
        throw new Error('Failed to retrieve updated preferences');
      }

      return preferences;
    } catch (error: any) {
      logSecurityEvent(
        'USER_PREFERENCES_UPDATE_FAILED' as any,
        'warning' as any,
        `Failed to update preferences: ${error.message}`,
        { userId },
        { error: error.message }
      );
      throw error;
    }
  }

  /**
   * Check if notification should be delivered based on preferences
   */
  public async shouldDeliverNotification(
    userId: string,
    notificationType: string,
    channel: NotificationChannel
  ): Promise<{ shouldDeliver: boolean; reason?: string }> {
    try {
      // Get preferences
      let preferences = await this.getPreferences(userId);
      if (!preferences) {
        preferences = await this.createDefaultPreferences(userId);
      }

      // Master switch
      if (preferences.unsubscribeAll) {
        return { shouldDeliver: false, reason: 'User unsubscribed from all notifications' };
      }

      // Channel check
      if (channel === NotificationChannel.IN_APP && !preferences.inAppEnabled) {
        return { shouldDeliver: false, reason: 'In-app notifications disabled' };
      }
      if (channel === NotificationChannel.PUSH && !preferences.pushEnabled) {
        return { shouldDeliver: false, reason: 'Push notifications disabled' };
      }
      if (channel === NotificationChannel.EMAIL && !preferences.emailEnabled) {
        return { shouldDeliver: false, reason: 'Email notifications disabled' };
      }

      // Type-specific check
      const typeKey = this.getTypeKey(notificationType);
      const typePreference = (preferences as any)[typeKey];

      if (typePreference && !typePreference.enabled) {
        return { shouldDeliver: false, reason: `${notificationType} notifications disabled` };
      }

      if (typePreference && !typePreference.channels.includes(channel)) {
        return { shouldDeliver: false, reason: `${notificationType} not configured for ${channel}` };
      }

      // Quiet hours check
      if (preferences.quietHoursEnabled) {
        const inQuietHours = this.isInQuietHours(
          preferences.quietHoursStart,
          preferences.quietHoursEnd,
          preferences.quietHoursTimezone
        );

        if (inQuietHours && channel !== NotificationChannel.IN_APP) {
          return { shouldDeliver: false, reason: 'In quiet hours' };
        }
      }

      // Rate limiting check
      const hourlyCount = await this.getNotificationCountInWindow(userId, 'hour');
      if (preferences.maxNotificationsPerHour && hourlyCount >= preferences.maxNotificationsPerHour) {
        return { shouldDeliver: false, reason: 'Hourly rate limit exceeded' };
      }

      const dailyCount = await this.getNotificationCountInWindow(userId, 'day');
      if (preferences.maxNotificationsPerDay && dailyCount >= preferences.maxNotificationsPerDay) {
        return { shouldDeliver: false, reason: 'Daily rate limit exceeded' };
      }

      return { shouldDeliver: true };
    } catch (error: any) {
      console.error(`Error checking delivery preference for user ${userId}:`, error);
      return { shouldDeliver: true }; // Default to delivery on error
    }
  }

  /**
   * Set quiet hours
   */
  public async setQuietHours(
    userId: string,
    start: string,
    end: string,
    timezone: string = 'UTC',
    enabled: boolean = true
  ): Promise<NotificationPreferences> {
    return this.updatePreferences(userId, {
      quietHoursEnabled: enabled,
      quietHoursStart: start,
      quietHoursEnd: end,
      quietHoursTimezone: timezone,
    });
  }

  /**
   * Enable/disable do not disturb
   */
  public async setDoNotDisturb(userId: string, enabled: boolean): Promise<NotificationPreferences> {
    return this.updatePreferences(userId, {
      doNotDisturb: enabled,
    });
  }

  /**
   * Update notification type preferences
   */
  public async updateTypePreference(
    userId: string,
    notificationType: string,
    preference: NotificationTypePreference
  ): Promise<NotificationPreferences> {
    const typeKey = this.getTypeKey(notificationType);
    return this.updatePreferences(userId, {
      [typeKey]: preference,
    });
  }

  /**
   * Enable/disable notification channel
   */
  public async updateChannelPreference(
    userId: string,
    channel: NotificationChannel,
    enabled: boolean
  ): Promise<NotificationPreferences> {
    const channelKey = this.getChannelKey(channel);
    return this.updatePreferences(userId, {
      [channelKey]: enabled,
    });
  }

  /**
   * Log notification delivery attempt
   */
  public async logDeliveryAttempt(
    userId: string,
    notificationId: string,
    channel: NotificationChannel,
    delivered: boolean,
    reason?: string
  ): Promise<void> {
    try {
      const log: NotificationDeliveryLog = {
        userId,
        notificationId,
        channel,
        timestamp: new Date(),
        delivered,
        reason,
      };

      // Add to in-memory log
      if (!this.deliveryLogs.has(userId)) {
        this.deliveryLogs.set(userId, []);
      }

      const userLogs = this.deliveryLogs.get(userId)!;
      userLogs.push(log);

      // Maintain size limit
      if (userLogs.length > this.maxLogSize) {
        userLogs.shift();
      }

      // Persist to Firestore
      await this.db
        .collection('notification_delivery_logs')
        .doc(userId)
        .collection('deliveries')
        .add(log);
    } catch (error: any) {
      console.error('Error logging delivery attempt:', error);
    }
  }

  /**
   * Get delivery history for user
   */
  public async getDeliveryHistory(
    userId: string,
    limit: number = 100
  ): Promise<NotificationDeliveryLog[]> {
    try {
      const snapshot = await this.db
        .collection('notification_delivery_logs')
        .doc(userId)
        .collection('deliveries')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      } as NotificationDeliveryLog));
    } catch (error: any) {
      console.error(`Error fetching delivery history for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get notification statistics for user
   */
  public async getNotificationStats(userId: string): Promise<{
    totalDelivered: number;
    totalFailed: number;
    deliveryRate: number;
    preferredChannels: NotificationChannel[];
    mostActiveTime: string;
  }> {
    try {
      const history = await this.getDeliveryHistory(userId, 1000);

      const delivered = history.filter((l) => l.delivered).length;
      const failed = history.filter((l) => !l.delivered).length;
      const total = history.length;

      const channelCounts = new Map<NotificationChannel, number>();
      const hourCounts = new Map<number, number>();

      history.forEach((log) => {
        channelCounts.set(
          log.channel,
          (channelCounts.get(log.channel) || 0) + 1
        );

        const hour = log.timestamp.getHours();
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      });

      const preferredChannels = Array.from(channelCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map((entry) => entry[0]);

      let mostActiveTime = 'Unknown';
      if (hourCounts.size > 0) {
        const maxHour = Array.from(hourCounts.entries()).sort((a, b) => b[1] - a[1])[0][0];
        mostActiveTime = `${String(maxHour).padStart(2, '0')}:00`;
      }

      return {
        totalDelivered: delivered,
        totalFailed: failed,
        deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
        preferredChannels,
        mostActiveTime,
      };
    } catch (error: any) {
      console.error(`Error fetching notification stats for user ${userId}:`, error);
      return {
        totalDelivered: 0,
        totalFailed: 0,
        deliveryRate: 0,
        preferredChannels: [],
        mostActiveTime: 'Unknown',
      };
    }
  }

  // Helper methods

  private getTypeKey(notificationType: string): string {
    const typeMap: Record<string, string> = {
      search_alert: 'searchAlerts',
      trending_topic: 'trendingTopics',
      job_complete: 'jobComplete',
      job_failed: 'jobFailed',
      achievement: 'achievements',
      milestone: 'milestones',
      message: 'messages',
      system_alert: 'systemAlerts',
    };
    return typeMap[notificationType] || notificationType;
  }

  private getChannelKey(channel: NotificationChannel): string {
    const channelMap: Record<NotificationChannel, string> = {
      [NotificationChannel.IN_APP]: 'inAppEnabled',
      [NotificationChannel.PUSH]: 'pushEnabled',
      [NotificationChannel.EMAIL]: 'emailEnabled',
    };
    return channelMap[channel];
  }

  private isInQuietHours(start?: string, end?: string, timezone?: string): boolean {
    if (!start || !end) return false;

    const now = new Date();
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    const currentTime = now.getHours() * 60 + now.getMinutes();

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // Quiet hours wrap around midnight
      return currentTime >= startTime || currentTime < endTime;
    }
  }

  private async getNotificationCountInWindow(
    userId: string,
    windowType: 'hour' | 'day'
  ): Promise<number> {
    const now = new Date();
    const cutoff = new Date();

    if (windowType === 'hour') {
      cutoff.setHours(cutoff.getHours() - 1);
    } else {
      cutoff.setDate(cutoff.getDate() - 1);
    }

    try {
      const snapshot = await this.db
        .collection('notification_delivery_logs')
        .doc(userId)
        .collection('deliveries')
        .where('timestamp', '>=', cutoff)
        .where('delivered', '==', true)
        .get();

      return snapshot.size;
    } catch (error) {
      console.error('Error counting notifications:', error);
      return 0;
    }
  }
}

export const userPreferencesService = new UserPreferencesService();
