import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';
import crypto from 'crypto';

export type WebhookEvent =
  | 'payment.succeeded'
  | 'payment.failed'
  | 'subscription.created'
  | 'subscription.cancelled'
  | 'user.created'
  | 'user.deleted'
  | 'lesson.completed'
  | 'achievement.unlocked'
  | 'export.completed';

export interface WebhookPayload {
  event: WebhookEvent;
  userId?: string;
  data: Record<string, any>;
  timestamp: Date;
  id: string;
}

export interface WebhookEndpoint {
  id: string;
  userId: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
  retryPolicy: {
    maxAttempts: number;
    backoffMs: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  payloadId: string;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  error?: string;
  responseStatus?: number;
  createdAt: Date;
}

class WebhooksService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = getFirestore();
    this.startRetryJob();
  }

  public async createEndpoint(
    userId: string,
    url: string,
    events: WebhookEvent[]
  ): Promise<WebhookEndpoint> {
    const secret = crypto.randomBytes(32).toString('hex');
    const id = crypto.randomUUID();

    const endpoint: WebhookEndpoint = {
      id,
      userId,
      url,
      events,
      secret,
      active: true,
      retryPolicy: {
        maxAttempts: 5,
        backoffMs: 1000,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await this.db.collection('webhook_endpoints').doc(id).set(endpoint);

      logSecurityEvent(
        'WEBHOOK_ENDPOINT_CREATED' as any,
        'info' as any,
        `Webhook endpoint created for user`,
        { userId },
        { endpointId: id, url, events: events.length }
      );

      return endpoint;
    } catch (error: any) {
      logSecurityEvent(
        'WEBHOOK_ENDPOINT_CREATE_FAILED' as any,
        'warning' as any,
        `Failed to create webhook endpoint: ${error.message}`,
        { userId },
        { error: error.message }
      );
      throw error;
    }
  }

  public async updateEndpoint(
    endpointId: string,
    updates: Partial<WebhookEndpoint>
  ): Promise<void> {
    try {
      await this.db.collection('webhook_endpoints').doc(endpointId).update({
        ...updates,
        updatedAt: new Date(),
      });

      logSecurityEvent(
        'WEBHOOK_ENDPOINT_UPDATED' as any,
        'info' as any,
        `Webhook endpoint updated`,
        {},
        { endpointId }
      );
    } catch (error: any) {
      logSecurityEvent(
        'WEBHOOK_ENDPOINT_UPDATE_FAILED' as any,
        'warning' as any,
        `Failed to update webhook endpoint: ${error.message}`,
        {},
        { endpointId, error: error.message }
      );
      throw error;
    }
  }

  public async deleteEndpoint(endpointId: string): Promise<void> {
    try {
      await this.db.collection('webhook_endpoints').doc(endpointId).delete();

      logSecurityEvent(
        'WEBHOOK_ENDPOINT_DELETED' as any,
        'info' as any,
        `Webhook endpoint deleted`,
        {},
        { endpointId }
      );
    } catch (error: any) {
      console.error('Error deleting webhook endpoint:', error);
    }
  }

  public async getUserEndpoints(userId: string): Promise<WebhookEndpoint[]> {
    try {
      const snapshot = await this.db
        .collection('webhook_endpoints')
        .where('userId', '==', userId)
        .get();

      return snapshot.docs.map((doc) => doc.data() as WebhookEndpoint);
    } catch (error: any) {
      console.error('Error fetching user endpoints:', error);
      return [];
    }
  }

  public async dispatchEvent(payload: WebhookPayload): Promise<number> {
    try {
      const snapshot = await this.db
        .collection('webhook_endpoints')
        .where('active', '==', true)
        .where('events', 'array-contains', payload.event)
        .get();

      let deliveryCount = 0;

      for (const doc of snapshot.docs) {
        const endpoint = doc.data() as WebhookEndpoint;

        // Skip if user filter doesn't match
        if (payload.userId && endpoint.userId !== payload.userId) {
          continue;
        }

        // Create delivery record
        const deliveryId = crypto.randomUUID();
        const delivery: WebhookDelivery = {
          id: deliveryId,
          endpointId: endpoint.id,
          payloadId: payload.id,
          status: 'pending',
          attempts: 0,
          createdAt: new Date(),
        };

        await this.db.collection('webhook_deliveries').doc(deliveryId).set(delivery);
        deliveryCount++;
      }

      logSecurityEvent(
        'WEBHOOK_DISPATCHED' as any,
        'info' as any,
        `Webhook event dispatched`,
        { userId: payload.userId },
        { event: payload.event, deliveries: deliveryCount }
      );

      // Trigger async delivery
      if (deliveryCount > 0) {
        this.deliverWebhooks().catch((err) => console.error('Webhook delivery error:', err));
      }

      return deliveryCount;
    } catch (error: any) {
      logSecurityEvent(
        'WEBHOOK_DISPATCH_FAILED' as any,
        'warning' as any,
        `Webhook dispatch failed: ${error.message}`,
        { userId: payload.userId },
        { event: payload.event, error: error.message }
      );
      return 0;
    }
  }

  public generateSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  public verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  public async getDeliveries(
    endpointId: string,
    limit: number = 100
  ): Promise<WebhookDelivery[]> {
    try {
      const snapshot = await this.db
        .collection('webhook_deliveries')
        .where('endpointId', '==', endpointId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => doc.data() as WebhookDelivery);
    } catch (error: any) {
      console.error('Error fetching deliveries:', error);
      return [];
    }
  }

  public async getStats(): Promise<{
    totalEndpoints: number;
    activeEndpoints: number;
    totalDeliveries: number;
    failedDeliveries: number;
    successRate: number;
  }> {
    try {
      const endpointSnapshot = await this.db.collection('webhook_endpoints').get();
      const deliverySnapshot = await this.db.collection('webhook_deliveries').get();

      const totalEndpoints = endpointSnapshot.size;
      const activeEndpoints = endpointSnapshot.docs.filter((doc) => doc.data().active).length;

      const totalDeliveries = deliverySnapshot.size;
      const failedDeliveries = deliverySnapshot.docs.filter((doc) => doc.data().status === 'failed').length;
      const successRate = totalDeliveries > 0 ? ((totalDeliveries - failedDeliveries) / totalDeliveries) * 100 : 0;

      return {
        totalEndpoints,
        activeEndpoints,
        totalDeliveries,
        failedDeliveries,
        successRate: Math.round(successRate * 100) / 100,
      };
    } catch (error: any) {
      console.error('Error fetching webhook stats:', error);
      return {
        totalEndpoints: 0,
        activeEndpoints: 0,
        totalDeliveries: 0,
        failedDeliveries: 0,
        successRate: 0,
      };
    }
  }

  private async deliverWebhooks(): Promise<void> {
    try {
      const snapshot = await this.db
        .collection('webhook_deliveries')
        .where('status', '==', 'pending')
        .limit(10)
        .get();

      for (const doc of snapshot.docs) {
        const delivery = doc.data() as WebhookDelivery;
        const endpoint = await this.db.collection('webhook_endpoints').doc(delivery.endpointId).get();

        if (!endpoint.exists) continue;

        const endpointData = endpoint.data() as WebhookEndpoint;

        // Fetch payload
        const payloadDoc = await this.db.collection('webhook_payloads').doc(delivery.payloadId).get();
        if (!payloadDoc.exists) continue;

        const payload = payloadDoc.data() as WebhookPayload;

        try {
          const signature = this.generateSignature(JSON.stringify(payload), endpointData.secret);
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);

          try {
            const response = await fetch(endpointData.url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': signature,
                'X-Webhook-ID': delivery.id,
              },
              body: JSON.stringify(payload),
              signal: controller.signal,
            });
            clearTimeout(timeout);

            if (response.ok) {
              await doc.ref.update({
                status: 'sent',
                lastAttemptAt: new Date(),
                attempts: delivery.attempts + 1,
                responseStatus: response.status,
              });
            } else {
              throw new Error(`HTTP ${response.status}`);
            }
          } finally {
            clearTimeout(timeout);
          }
        } catch (error: any) {
          const nextRetry = delivery.attempts < endpointData.retryPolicy.maxAttempts
            ? new Date(Date.now() + Math.pow(2, delivery.attempts) * endpointData.retryPolicy.backoffMs)
            : undefined;

          await doc.ref.update({
            status: delivery.attempts >= endpointData.retryPolicy.maxAttempts ? 'failed' : 'pending',
            lastAttemptAt: new Date(),
            attempts: delivery.attempts + 1,
            nextRetryAt: nextRetry,
            error: error.message,
          });

          logSecurityEvent(
            'WEBHOOK_DELIVERY_FAILED' as any,
            'warning' as any,
            `Webhook delivery failed: ${error.message}`,
            {},
            { deliveryId: delivery.id, endpointId: delivery.endpointId, attempt: delivery.attempts + 1 }
          );
        }
      }
    } catch (error: any) {
      console.error('Webhook delivery job error:', error);
    }
  }

  private startRetryJob(): void {
    // Retry failed webhooks every minute
    setInterval(() => {
      this.deliverWebhooks().catch((err) => console.error('Webhook retry job error:', err));
    }, 60 * 1000);
  }
}

export const webhooksService = new WebhooksService();
