import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface FCMToken {
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  registeredAt: Date;
  lastUsedAt?: Date;
}

export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
  icon?: string;
  badge?: string;
  sound?: string;
  clickAction?: string;
}

class FCMService {
  private messaging: any;
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.messaging = getMessaging();
    this.db = getFirestore();
  }

  public async registerToken(userId: string, token: string, platform: 'ios' | 'android' | 'web'): Promise<void> {
    try {
      await this.db
        .collection('fcm_tokens')
        .doc()
        .set({
          userId,
          token,
          platform,
          registeredAt: new Date(),
        } as FCMToken);

      logSecurityEvent(
        'FCM_TOKEN_REGISTERED' as any,
        'info' as any,
        `FCM token registered for user ${userId}`,
        { userId },
        { platform, tokenLength: token.length }
      );
    } catch (error: any) {
      logSecurityEvent(
        'FCM_TOKEN_REGISTER_FAILED' as any,
        'warning' as any,
        `Failed to register FCM token: ${error.message}`,
        { userId },
        { error: error.message }
      );
      throw error;
    }
  }

  public async unregisterToken(token: string): Promise<void> {
    try {
      const snapshot = await this.db
        .collection('fcm_tokens')
        .where('token', '==', token)
        .get();

      const batch = this.db.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      logSecurityEvent(
        'FCM_TOKEN_UNREGISTERED' as any,
        'info' as any,
        'FCM token unregistered',
        {},
        { tokenLength: token.length }
      );
    } catch (error: any) {
      console.error('Error unregistering FCM token:', error);
    }
  }

  public async sendToUser(userId: string, notification: PushNotification): Promise<number> {
    try {
      const snapshot = await this.db
        .collection('fcm_tokens')
        .where('userId', '==', userId)
        .get();

      if (snapshot.empty) {
        logSecurityEvent(
          'FCM_NO_TOKENS' as any,
          'info' as any,
          `No FCM tokens found for user ${userId}`,
          { userId },
          {}
        );
        return 0;
      }

      const tokens = snapshot.docs.map((doc) => (doc.data() as FCMToken).token);
      let successCount = 0;

      for (const token of tokens) {
        try {
          await this.messaging.send({
            notification: {
              title: notification.title,
              body: notification.body,
            },
            data: notification.data || {},
            android: {
              priority: 'high',
              notification: {
                icon: notification.icon,
                sound: notification.sound || 'default',
                clickAction: notification.clickAction,
              },
            },
            apns: {
              payload: {
                aps: {
                  alert: {
                    title: notification.title,
                    body: notification.body,
                  },
                  sound: notification.sound || 'default',
                  badge: notification.badge,
                },
              },
            },
            webpush: {
              notification: {
                title: notification.title,
                body: notification.body,
                icon: notification.icon,
                badge: notification.badge,
              },
              data: notification.data || {},
            },
            token,
          });

          successCount++;
        } catch (tokenError: any) {
          if (tokenError.code === 'messaging/invalid-registration-token' ||
              tokenError.code === 'messaging/registration-token-not-registered') {
            await this.unregisterToken(token);
          }
        }
      }

      logSecurityEvent(
        'FCM_SENT_TO_USER' as any,
        'info' as any,
        `Push notification sent to user ${userId}`,
        { userId },
        { successCount, totalTokens: tokens.length }
      );

      return successCount;
    } catch (error: any) {
      logSecurityEvent(
        'FCM_SEND_FAILED' as any,
        'warning' as any,
        `Failed to send FCM notification: ${error.message}`,
        { userId },
        { error: error.message }
      );
      return 0;
    }
  }

  public async sendToMultiple(userIds: string[], notification: PushNotification): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        const count = await this.sendToUser(userId, notification);
        sent += count;
      } catch {
        failed++;
      }
    }

    return { sent, failed };
  }

  public async sendToTopic(topic: string, notification: PushNotification): Promise<string> {
    try {
      const messageId = await this.messaging.send({
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        topic,
      });

      logSecurityEvent(
        'FCM_SENT_TO_TOPIC' as any,
        'info' as any,
        `Push notification sent to topic ${topic}`,
        {},
        { topic, messageId }
      );

      return messageId;
    } catch (error: any) {
      logSecurityEvent(
        'FCM_TOPIC_SEND_FAILED' as any,
        'warning' as any,
        `Failed to send FCM to topic: ${error.message}`,
        {},
        { topic, error: error.message }
      );
      throw error;
    }
  }

  public async subscribeToTopic(token: string, topic: string): Promise<void> {
    try {
      await this.messaging.subscribeToTopic(token, topic);

      logSecurityEvent(
        'FCM_TOPIC_SUBSCRIBED' as any,
        'info' as any,
        `Device subscribed to topic ${topic}`,
        {},
        { topic }
      );
    } catch (error: any) {
      console.error('Error subscribing to topic:', error);
    }
  }

  public async unsubscribeFromTopic(token: string, topic: string): Promise<void> {
    try {
      await this.messaging.unsubscribeFromTopic(token, topic);

      logSecurityEvent(
        'FCM_TOPIC_UNSUBSCRIBED' as any,
        'info' as any,
        `Device unsubscribed from topic ${topic}`,
        {},
        { topic }
      );
    } catch (error: any) {
      console.error('Error unsubscribing from topic:', error);
    }
  }
}

export const fcmService = new FCMService();
