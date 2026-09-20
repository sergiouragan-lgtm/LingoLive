import Queue from 'bull';
import { BatchNotificationJobData, JobType } from '../queue.service';
import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { logSecurityEvent } from '../security.event.logger';

export async function processBatchNotificationJob(
  job: Queue.Job<BatchNotificationJobData>
): Promise<{ sent: number; failed: number; details: string[] }> {
  const { userIds, title, message, type, metadata } = job.data;

  const results = {
    sent: 0,
    failed: 0,
    details: [] as string[],
  };

  try {
    const db = getFirestore();
    const messaging = getMessaging();

    job.progress(10);

    // Fetch device tokens for all users
    const userDeviceTokens: Map<string, string[]> = new Map();

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const tokensDoc = await db.collection('user_devices').doc(userId).get();

      if (tokensDoc.exists) {
        const tokens = tokensDoc.data()?.deviceTokens || [];
        if (tokens.length > 0) {
          userDeviceTokens.set(userId, tokens);
        }
      }

      // Update progress
      if (i % 50 === 0) {
        job.progress(10 + (i / userIds.length) * 30);
      }
    }

    job.progress(40);

    // Send notifications
    const batchSize = 100;
    for (let i = 0; i < Array.from(userDeviceTokens.entries()).length; i += batchSize) {
      const batch = Array.from(userDeviceTokens.entries()).slice(i, i + batchSize);

      const sendPromises = batch.map(async ([userId, tokens]) => {
        try {
          const notificationData: Record<string, string> = {
            title,
            body: message,
            notificationType: type,
            timestamp: new Date().toISOString(),
          };

          if (metadata) {
            Object.entries(metadata).forEach(([key, value]) => {
              notificationData[key] = String(value);
            });
          }

          // Send to all device tokens for this user
          for (const token of tokens) {
            try {
              await messaging.send({
                token,
                notification: {
                  title,
                  body: message,
                },
                data: notificationData,
              });

              results.sent++;
            } catch (tokenError: any) {
              // Handle invalid tokens
              if (
                tokenError.code === 'messaging/invalid-registration-token' ||
                tokenError.code === 'messaging/registration-token-not-registered'
              ) {
                await removeInvalidToken(db, userId, token);
              }
              results.failed++;
              results.details.push(`Token error for ${userId}: ${tokenError.message}`);
            }
          }

          // Store notification record
          await db
            .collection('user_notifications')
            .add({
              userId,
              title,
              message,
              type,
              status: 'sent',
              sentAt: new Date().toISOString(),
              metadata,
            });
        } catch (userError: any) {
          results.failed++;
          results.details.push(`User ${userId} error: ${userError.message}`);
        }
      });

      await Promise.all(sendPromises);

      job.progress(40 + (i / Array.from(userDeviceTokens.entries()).length) * 50);
    }

    job.progress(100);

    logSecurityEvent(
      'BATCH_NOTIFICATION_SENT' as any,
      'info' as any,
      `Batch notification sent to ${results.sent} users`,
      {},
      { type, totalUsers: userIds.length, sentCount: results.sent, failedCount: results.failed }
    );

    return results;
  } catch (error: any) {
    console.error(`Batch notification failed:`, error);

    logSecurityEvent(
      'BATCH_NOTIFICATION_FAILED' as any,
      'warning' as any,
      `Batch notification failed: ${error.message}`,
      {},
      { type, totalUsers: userIds.length, error: error.message }
    );

    throw error;
  }
}

async function removeInvalidToken(
  db: Firestore,
  userId: string,
  token: string
): Promise<void> {
  const tokensDoc = await db.collection('user_devices').doc(userId).get();

  if (tokensDoc.exists) {
    const tokens = tokensDoc.data()?.deviceTokens || [];
    const updatedTokens = tokens.filter((t: string) => t !== token);

    if (updatedTokens.length > 0) {
      await db.collection('user_devices').doc(userId).update({
        deviceTokens: updatedTokens,
      });
    } else {
      await db.collection('user_devices').doc(userId).delete();
    }
  }
}
