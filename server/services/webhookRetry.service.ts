/**
 * Webhook Retry Service
 *
 * Handles retry logic with exponential backoff for failed webhook events.
 * Failed webhooks after max retries are persisted to dead letter queue.
 */

import { dbAdmin, authAdmin } from "../config/firebaseAdmin";
import { safeGetDoc } from "./firestoreSafe.service";

export interface WebhookEvent {
  id: string;
  type: string;
  provider: "stripe" | "paypal" | "livekit" | "openai";
  timestamp: number;
  payload: any;
}

export interface WebhookRetryConfig {
  maxRetries: number; // Default: 3
  initialDelayMs: number; // Default: 2000 (2s)
  backoffMultiplier: number; // Default: 2 (exponential)
}

const DEFAULT_CONFIG: WebhookRetryConfig = {
  maxRetries: 3,
  initialDelayMs: 2000,
  backoffMultiplier: 2,
};

export class WebhookRetryService {
  private static readonly RETRY_COLLECTION = "webhook_retries";
  private static readonly DEAD_LETTER_COLLECTION = "webhook_dead_letters";

  /**
   * Process a webhook event with automatic retry logic
   */
  static async processWithRetry(
    event: WebhookEvent,
    handler: (event: WebhookEvent) => Promise<void>,
    config: Partial<WebhookRetryConfig> = {}
  ): Promise<{ success: boolean; attempts: number; error?: string }> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    let lastError: Error | undefined;
    let attempts = 0;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      attempts = attempt + 1;

      try {
        // Execute the handler
        await handler(event);

        // Success — clean up any retry records
        await this.clearRetryRecord(event.id, event.provider);
        console.log(`[WebhookRetry] ✅ Event ${event.id} processed successfully on attempt ${attempts}`);

        return { success: true, attempts };
      } catch (error: any) {
        lastError = error;
        console.error(
          `[WebhookRetry] ❌ Event ${event.id} failed on attempt ${attempts}/${finalConfig.maxRetries}: ${error.message}`
        );

        // If this is not the last attempt, retry with backoff
        if (attempt < finalConfig.maxRetries) {
          const delayMs = finalConfig.initialDelayMs * Math.pow(finalConfig.backoffMultiplier, attempt);
          console.log(`[WebhookRetry] ⏳ Retrying in ${delayMs}ms...`);

          // Persist retry attempt
          await this.recordRetryAttempt(event, attempt + 1, finalConfig.maxRetries);

          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          // Max retries exceeded — move to dead letter queue
          console.error(`[WebhookRetry] 💀 Event ${event.id} exceeded max retries. Moving to dead letter queue.`);
          await this.moveToDeadLetterQueue(event, error.message);

          // Send alert email (async, don't block)
          this.alertAdmins(event, lastError).catch((err) =>
            console.error("[WebhookRetry] Failed to send alert email:", err)
          );
        }
      }
    }

    return {
      success: false,
      attempts,
      error: lastError?.message || "Unknown error",
    };
  }

  /**
   * Record a retry attempt in Firestore
   */
  private static async recordRetryAttempt(
    event: WebhookEvent,
    attemptNumber: number,
    maxRetries: number
  ): Promise<void> {
    if (!dbAdmin) return;

    try {
      const retryDoc = {
        eventId: event.id,
        provider: event.provider,
        eventType: event.type,
        attemptNumber,
        maxRetries,
        timestamp: new Date().toISOString(),
        nextRetryAt: new Date(Date.now() + 2000 * Math.pow(2, attemptNumber)).toISOString(),
        payload: event.payload,
      };

      await dbAdmin
        .collection(this.RETRY_COLLECTION)
        .doc(`${event.provider}_${event.id}`)
        .set(retryDoc, { merge: true });
    } catch (err) {
      console.error("[WebhookRetry] Failed to record retry attempt:", err);
    }
  }

  /**
   * Clear retry record after successful processing
   */
  private static async clearRetryRecord(eventId: string, provider: string): Promise<void> {
    if (!dbAdmin) return;

    try {
      await dbAdmin
        .collection(this.RETRY_COLLECTION)
        .doc(`${provider}_${eventId}`)
        .delete();
    } catch (err) {
      console.error("[WebhookRetry] Failed to clear retry record:", err);
    }
  }

  /**
   * Move event to dead letter queue after max retries
   */
  private static async moveToDeadLetterQueue(event: WebhookEvent, errorMessage: string): Promise<void> {
    if (!dbAdmin) return;

    try {
      const deadLetterDoc = {
        eventId: event.id,
        provider: event.provider,
        eventType: event.type,
        errorMessage,
        receivedAt: new Date(event.timestamp).toISOString(),
        failedAt: new Date().toISOString(),
        payload: event.payload,
        status: "pending_review",
        reviewed: false,
        reviewedBy: null,
        reviewedAt: null,
      };

      await dbAdmin
        .collection(this.DEAD_LETTER_COLLECTION)
        .doc(`${event.provider}_${event.id}`)
        .set(deadLetterDoc);

      console.log(`[WebhookRetry] 💀 Event ${event.id} moved to dead letter queue`);
    } catch (err) {
      console.error("[WebhookRetry] Failed to move event to dead letter queue:", err);
    }
  }

  /**
   * Alert admins about webhook failures
   */
  private static async alertAdmins(event: WebhookEvent, error: Error): Promise<void> {
    // TODO: Implement email alert via Resend or SendGrid
    // For now, just log
    console.error(`[WebhookRetry] 🚨 ADMIN ALERT: Webhook ${event.id} failed permanently:`, error.message);

    // In production, send email:
    // await resend.emails.send({
    //   from: 'alerts@lingolive.com',
    //   to: 'ops@lingolive.com',
    //   subject: `❌ Webhook ${event.provider}/${event.type} FAILED - Manual Review Required`,
    //   html: `
    //     <h2>Webhook Processing Failed</h2>
    //     <p><strong>Event ID:</strong> ${event.id}</p>
    //     <p><strong>Provider:</strong> ${event.provider}</p>
    //     <p><strong>Type:</strong> ${event.type}</p>
    //     <p><strong>Error:</strong> ${error.message}</p>
    //     <p><strong>Action:</strong> Check dead letter queue and retry manually</p>
    //   `
    // });
  }

  /**
   * Get pending retries for a provider
   */
  static async getPendingRetries(provider: string): Promise<any[]> {
    if (!dbAdmin) return [];

    try {
      const query = await dbAdmin
        .collection(this.RETRY_COLLECTION)
        .where("provider", "==", provider)
        .where("nextRetryAt", "<=", new Date().toISOString())
        .limit(50)
        .get();

      return query.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("[WebhookRetry] Failed to get pending retries:", err);
      return [];
    }
  }

  /**
   * Get dead letter queue entries
   */
  static async getDeadLetterEntries(provider?: string, limit: number = 100): Promise<any[]> {
    if (!dbAdmin) return [];

    try {
      let query: any = dbAdmin.collection(this.DEAD_LETTER_COLLECTION);

      if (provider) {
        query = query.where("provider", "==", provider);
      }

      const snapshot = await query.where("reviewed", "==", false).orderBy("failedAt", "desc").limit(limit).get();

      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("[WebhookRetry] Failed to get dead letter entries:", err);
      return [];
    }
  }

  /**
   * Mark dead letter entry as reviewed and optionally retry
   */
  static async reviewDeadLetter(
    provider: string,
    eventId: string,
    reviewed: boolean,
    reviewedBy: string,
    shouldRetry: boolean = false
  ): Promise<void> {
    if (!dbAdmin) return;

    try {
      const docId = `${provider}_${eventId}`;

      const updateData: any = {
        reviewed,
        reviewedBy,
        reviewedAt: new Date().toISOString(),
      };

      if (shouldRetry) {
        updateData.status = "retrying";
      } else {
        updateData.status = "archived";
      }

      await dbAdmin.collection(this.DEAD_LETTER_COLLECTION).doc(docId).update(updateData);

      console.log(`[WebhookRetry] ✅ Dead letter entry ${docId} reviewed by ${reviewedBy}`);
    } catch (err) {
      console.error("[WebhookRetry] Failed to review dead letter entry:", err);
    }
  }

  /**
   * Health check: get retry statistics
   */
  static async getRetryStats(): Promise<{
    totalRetries: number;
    totalDeadLetters: number;
    byProvider: Record<string, { retries: number; deadLetters: number }>;
  }> {
    if (!dbAdmin) {
      return { totalRetries: 0, totalDeadLetters: 0, byProvider: {} };
    }

    try {
      const retryCount = await dbAdmin.collection(this.RETRY_COLLECTION).count().get();
      const deadLetterCount = await dbAdmin.collection(this.DEAD_LETTER_COLLECTION).count().get();

      const providers = ["stripe", "paypal", "livekit", "openai"];
      const byProvider: Record<string, { retries: number; deadLetters: number }> = {};

      for (const provider of providers) {
        const retries = await dbAdmin
          .collection(this.RETRY_COLLECTION)
          .where("provider", "==", provider)
          .count()
          .get();
        const deadLetters = await dbAdmin
          .collection(this.DEAD_LETTER_COLLECTION)
          .where("provider", "==", provider)
          .count()
          .get();

        byProvider[provider] = {
          retries: retries.data().count,
          deadLetters: deadLetters.data().count,
        };
      }

      return {
        totalRetries: retryCount.data().count,
        totalDeadLetters: deadLetterCount.data().count,
        byProvider,
      };
    } catch (err) {
      console.error("[WebhookRetry] Failed to get retry stats:", err);
      return { totalRetries: 0, totalDeadLetters: 0, byProvider: {} };
    }
  }
}
