import { safeGetDoc, safeSetDoc, safeAddDoc, safeSetSubDoc, safeGetSubDocs, localMemoryDb } from "./firestoreSafe.service";
import { SERVER_PLANS, PAYMENT_GRACE_PERIOD_DAYS } from "../config/plans";
import { dbAdmin } from "../config/firebaseAdmin";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "paid"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded"
  | "reversed"
  | "expired"
  | "in_grace_period"
  | "requires_review"
  | "review_required";

export type PaymentProvider = "stripe" | "paypal" | "multicaixa" | "bank_transfer" | "transfer";

export interface PaymentRecord {
  paymentId: string;
  userId: string;
  provider: PaymentProvider;
  providerTransactionId?: string;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  planId: string;
  paymentType?: "one_time" | "subscription" | "bank_transfer" | "multicaixa";
  amount: number;
  currency: string;
  status: PaymentStatus;
  previousStatus?: PaymentStatus | null;
  paymentMethod?: string | null;
  environment?: "production" | "sandbox" | "test";
  paidAt?: string | null;
  failedAt?: string | null;
  refundedAt?: string | null;
  cancelledAt?: string | null;
  expiresAt?: string | null;
  paidUntil?: string | null;
  gracePeriodEndsAt?: string | null;
  nextPaymentAttempt?: string | null;
  attemptCount?: number;
  createdAt: string;
  updatedAt: string;
  lastEventId?: string | null;
  lastEventType?: string | null;
  requiresReview?: boolean;
  reviewReason?: string | null;
  metadata?: Record<string, any>;
  transactionId?: string;
  refundReason?: string | null;
  refundOperator?: string | null;
  refundTransactionId?: string | null;
}

export interface PaymentEventRecord {
  eventId: string;
  paymentId: string;
  provider: PaymentProvider;
  providerEventId?: string | null;
  eventType: string;
  previousStatus: PaymentStatus | null;
  newStatus: PaymentStatus;
  occurredAt: string;
  processedAt: string;
  source: string;
  reasonCode?: string | null;
  retryable?: boolean | null;
  details?: Record<string, any>;
}

export interface WebhookEventRecord {
  eventId: string;
  provider: string;
  eventType: string;
  processedAt: string;
  status: "success" | "duplicate" | "error";
  details?: any;
}

/**
 * Mask PII such as phone numbers for audit compliance
 */
export function maskPhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 7) {
    return `${digits.substring(0, 3)}***${digits.substring(digits.length - 3)}`;
  }
  return "***";
}

/**
 * Helper to ensure stable deterministic ID format across providers
 */
export function getCanonicalPaymentId(provider: PaymentProvider, rawId: string): string {
  if (!rawId) return `${provider}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  if (
    rawId.startsWith("stripe_") ||
    rawId.startsWith("paypal_") ||
    rawId.startsWith("multicaixa_") ||
    rawId.startsWith("bank_")
  ) {
    return rawId;
  }
  const cleanProvider = provider === "transfer" ? "bank" : (provider === "bank_transfer" ? "bank" : provider);
  return `${cleanProvider}_${rawId}`;
}

/**
 * Sanitize metadata to exclude PII, raw payloads, secrets, or undefined values
 */
export function sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
  if (!metadata) return undefined;
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined) continue;
    // Mask sensitive keys
    if (/phone|telefone|cellphone|mobile/i.test(key) && typeof value === "string") {
      sanitized[key] = maskPhone(value);
    } else if (/(?:clientSecret|cardCvv|authPin|apiKey|privateKey|secret|token|password|signature)/i.test(key)) {
      // Omit secrets, cards, tokens, signatures
      continue;
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeMetadata(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export class PaymentEngineService {
  /**
   * Atomic Lock Acquisition for Webhook Events.
   * Uses Firestore runTransaction to atomically acquire processing status,
   * preventing race conditions when duplicate webhooks hit concurrently.
   */
  static async acquireEventLock(eventId: string, provider: string, eventType: string): Promise<{ acquired: boolean; status?: string }> {
    if (!eventId) return { acquired: false, status: "invalid_id" };
    const docId = `${provider}_${eventId}`;
    const lookupKey = `processed_webhook_${provider}_${eventId}`;
    const now = new Date().toISOString();

    if (process.env.NODE_ENV === "production" && !dbAdmin) {
      console.error("[PaymentEngine] CRITICAL: Firestore dbAdmin is missing in production environment!");
      throw new Error("Persistência do Firestore indisponível em ambiente de produção.");
    }

    if (dbAdmin) {
      try {
        const docRef = dbAdmin.collection("paymentWebhookEvents").doc(docId);
        let acquired = false;
        let currentStatus = "unknown";

        await dbAdmin.runTransaction(async (transaction: any) => {
          const docSnap = await transaction.get(docRef);
          if (docSnap.exists) {
            const data = docSnap.data();
            currentStatus = data.status || "completed";

            if (currentStatus === "completed" || currentStatus === "success") {
              acquired = false;
              return;
            }

            if (currentStatus === "processing") {
              const createdAtMs = new Date(data.createdAt || data.processedAt || 0).getTime();
              const lockAge = Date.now() - createdAtMs;
              if (lockAge < 60000) {
                acquired = false;
                return;
              }
            }

            if (currentStatus === "error" && !data.retryable) {
              acquired = false;
              return;
            }
          }

          transaction.set(docRef, {
            provider,
            eventId,
            eventType,
            status: "processing",
            createdAt: now,
            processedAt: now
          }, { merge: true });

          acquired = true;
        });

        if (!acquired) {
          localMemoryDb.set(lookupKey, { status: currentStatus });
          return { acquired: false, status: currentStatus };
        }

        localMemoryDb.set(lookupKey, { status: "processing" });
        return { acquired: true, status: "processing" };
      } catch (err: any) {
        console.warn(`[PaymentEngine Lock Error] ${err.message}. Falling back to local memory lock.`);
        if (process.env.NODE_ENV === "production") {
          throw new Error(`Persistência do Firestore indisponível em ambiente de produção: ${err.message}`);
        }
      }
    }

    const existingLocal = localMemoryDb.get(lookupKey);
    if (existingLocal) {
      if (
        existingLocal.status === "completed" ||
        existingLocal.status === "success" ||
        existingLocal.status === "error" ||
        existingLocal.status === "processing"
      ) {
        return { acquired: false, status: existingLocal.status };
      }
    }

    localMemoryDb.set(lookupKey, { status: "processing" });
    return { acquired: true, status: "processing" };
  }

  static async markEventProcessed(
    eventId: string,
    provider: string,
    eventType: string,
    details?: any,
    userId?: string,
    error?: string
  ): Promise<void> {
    const docId = `${provider}_${eventId}`;
    const lookupKey = `processed_webhook_${provider}_${eventId}`;
    const now = new Date().toISOString();

    const record = {
      eventId,
      provider,
      eventType,
      processedAt: now,
      status: error ? "error" : "success",
      userId: userId || null,
      details: sanitizeMetadata(details) || null,
      error: error || null,
      updatedAt: now
    };

    localMemoryDb.set(lookupKey, record);

    if (process.env.NODE_ENV === "production" && !dbAdmin) {
      console.error("[PaymentEngine] CRITICAL: dbAdmin indisponível ao salvar webhook processado em produção.");
      throw new Error("Não é possível persistir estado do webhook em produção sem Firestore.");
    }

    await safeSetDoc("paymentWebhookEvents", docId, record);
    localMemoryDb.set(`processed_webhooks_${eventId}`, record);
    console.log(`[PaymentEngine Log] 🔒 Webhook Event ID [${docId}] recorded as ${record.status} (${provider} - ${eventType}).`);
  }

  static async isEventProcessed(eventId: string, provider: string): Promise<boolean> {
    if (!eventId) return false;
    const lookupKey = `processed_webhook_${provider}_${eventId}`;
    const cached = localMemoryDb.get(lookupKey);
    if (cached && (cached.status === "completed" || cached.status === "success")) return true;

    const docId = `${provider}_${eventId}`;
    const snap = await safeGetDoc("paymentWebhookEvents", docId);
    if (snap.exists) {
      const data = snap.data();
      if (data.status === "completed" || data.status === "success") return true;
    }

    const legacySnap = await safeGetDoc("processed_webhooks", eventId);
    return legacySnap.exists;
  }

  /**
   * Record state transition event in `/pagamentos/{paymentId}/eventos/{eventId}` subcollection
   */
  static async recordPaymentEvent(
    paymentId: string,
    eventData: {
      eventId?: string;
      provider: PaymentProvider;
      providerEventId?: string | null;
      eventType: string;
      previousStatus?: PaymentStatus | null;
      newStatus: PaymentStatus;
      source?: string;
      reasonCode?: string | null;
      retryable?: boolean | null;
      details?: Record<string, any>;
    }
  ): Promise<PaymentEventRecord> {
    const now = new Date().toISOString();
    const eventId = eventData.eventId || `${eventData.provider}_evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const eventRecord: PaymentEventRecord = {
      eventId,
      paymentId,
      provider: eventData.provider,
      providerEventId: eventData.providerEventId || eventData.eventId || null,
      eventType: eventData.eventType,
      previousStatus: eventData.previousStatus || null,
      newStatus: eventData.newStatus,
      occurredAt: now,
      processedAt: now,
      source: eventData.source || `${eventData.provider}_webhook`,
      reasonCode: eventData.reasonCode || null,
      retryable: eventData.retryable ?? null,
      details: sanitizeMetadata(eventData.details) || undefined
    };

    await safeSetSubDoc("pagamentos", paymentId, "eventos", eventId, eventRecord);
    return eventRecord;
  }

  /**
   * Create or update a canonical payment transaction entry in `/pagamentos/{paymentId}`.
   * Enforces immutability of critical fields, deterministic IDs, PII sanitization, and state audit history.
   */
  static async recordPayment(
    paymentData: Omit<PaymentRecord, "createdAt" | "updatedAt"> & { createdAt?: string; updatedAt?: string; eventId?: string; eventType?: string; eventSource?: string }
  ): Promise<PaymentRecord> {
    const now = new Date().toISOString();
    const rawProvider = paymentData.provider || "stripe";
    const provider: PaymentProvider = rawProvider === "transfer" ? "bank_transfer" : rawProvider;
    
    const rawId = paymentData.paymentId || paymentData.transactionId || `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const paymentId = getCanonicalPaymentId(provider, rawId);

    // Look up canonical collection `/pagamentos`, fallback to legacy `/payments` if migrating
    let existingSnap = await safeGetDoc("pagamentos", paymentId);
    if (!existingSnap.exists) {
      existingSnap = await safeGetDoc("payments", paymentId);
    }
    const existing: PaymentRecord | null = existingSnap.exists ? (existingSnap.data() as PaymentRecord) : null;

    // Determine status transition
    const rawStatus = paymentData.status || "pending";
    const status: PaymentStatus = rawStatus === "completed" ? "paid" : (rawStatus === "review_required" ? "requires_review" : rawStatus);
    const previousStatus = existing ? existing.status : (paymentData.previousStatus || null);

    // Enforce Immutability of Critical Fields on Update
    const userId = existing?.userId || paymentData.userId;
    const providerTransactionId = existing?.providerTransactionId || paymentData.providerTransactionId || paymentData.transactionId || rawId;
    const amount = existing?.amount ?? paymentData.amount;
    const currency = (existing?.currency || paymentData.currency || "USD").toUpperCase();
    const createdAt = existing?.createdAt || paymentData.createdAt || now;

    const requiresReview = paymentData.requiresReview ?? (status === "requires_review");
    const reviewReason = paymentData.reviewReason ?? (paymentData.metadata?.error || (status === "requires_review" ? "UNKNOWN_PLAN_ID" : null));

    const sanitizedMeta = sanitizeMetadata(paymentData.metadata);

    // Monotonic calculations for paidUntil, attemptCount, and grace period fields
    let finalPaidUntil = paymentData.paidUntil || existing?.paidUntil || null;
    if (existing?.paidUntil && paymentData.paidUntil) {
      const existingTime = new Date(existing.paidUntil).getTime();
      const newTime = new Date(paymentData.paidUntil).getTime();
      finalPaidUntil = existingTime > newTime ? existing.paidUntil : paymentData.paidUntil;
    }

    const finalAttemptCount = Math.max(existing?.attemptCount || 0, paymentData.attemptCount || 0) || (paymentData.attemptCount ?? existing?.attemptCount ?? undefined);

    let finalGracePeriodEndsAt: string | null = null;
    if (status === "paid") {
      finalGracePeriodEndsAt = null;
    } else if (paymentData.gracePeriodEndsAt !== undefined) {
      finalGracePeriodEndsAt = paymentData.gracePeriodEndsAt;
    } else {
      finalGracePeriodEndsAt = existing?.gracePeriodEndsAt || null;
    }

    let finalNextPaymentAttempt: string | null = null;
    if (status === "paid") {
      finalNextPaymentAttempt = null;
    } else if (paymentData.nextPaymentAttempt !== undefined) {
      finalNextPaymentAttempt = paymentData.nextPaymentAttempt;
    } else {
      finalNextPaymentAttempt = existing?.nextPaymentAttempt || null;
    }

    const fullRecord: PaymentRecord = {
      paymentId,
      userId,
      provider,
      providerTransactionId,
      providerCustomerId: existing?.providerCustomerId || paymentData.providerCustomerId || null,
      providerSubscriptionId: existing?.providerSubscriptionId || paymentData.providerSubscriptionId || null,
      planId: paymentData.planId || existing?.planId || "UNKNOWN",
      paymentType: paymentData.paymentType || existing?.paymentType || "one_time",
      amount,
      currency,
      status,
      previousStatus: previousStatus !== status ? previousStatus : (existing?.previousStatus || null),
      paymentMethod: paymentData.paymentMethod || existing?.paymentMethod || provider,
      environment: paymentData.environment || existing?.environment || (process.env.NODE_ENV === "production" ? "production" : "sandbox"),
      paidAt: paymentData.paidAt || existing?.paidAt || (status === "paid" ? now : null),
      failedAt: paymentData.failedAt || existing?.failedAt || (status === "failed" ? now : null),
      refundedAt: paymentData.refundedAt || existing?.refundedAt || (status === "refunded" ? now : null),
      cancelledAt: paymentData.cancelledAt || existing?.cancelledAt || (status === "cancelled" ? now : null),
      expiresAt: paymentData.expiresAt || existing?.expiresAt || null,
      paidUntil: finalPaidUntil,
      gracePeriodEndsAt: finalGracePeriodEndsAt,
      nextPaymentAttempt: finalNextPaymentAttempt,
      attemptCount: finalAttemptCount,
      createdAt,
      updatedAt: now,
      lastEventId: paymentData.eventId || existing?.lastEventId || null,
      lastEventType: paymentData.eventType || existing?.lastEventType || null,
      requiresReview,
      reviewReason,
      metadata: sanitizedMeta,
      transactionId: providerTransactionId,
      refundReason: paymentData.refundReason || existing?.refundReason || null,
      refundOperator: paymentData.refundOperator || existing?.refundOperator || null,
      refundTransactionId: paymentData.refundTransactionId || existing?.refundTransactionId || null
    };

    // Save canonical document in `/pagamentos/{paymentId}`
    await safeSetDoc("pagamentos", paymentId, fullRecord);
    // Mirror only in local memory db to maintain legacy in-memory compatibility without duplicate Firestore document creation
    localMemoryDb.set(`payments_${paymentId}`, fullRecord);

    // Write audit event to `/pagamentos/{paymentId}/eventos/{eventId}`
    const eventId = paymentData.eventId || `${provider}_evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await this.recordPaymentEvent(paymentId, {
      eventId,
      provider,
      providerEventId: paymentData.eventId || null,
      eventType: paymentData.eventType || `payment_${status}`,
      previousStatus,
      newStatus: status,
      source: paymentData.eventSource || `${provider}_webhook`,
      reasonCode: reviewReason || null,
      details: sanitizedMeta
    });

    console.log(`[PaymentEngine Log] 💳 Canonical Payment Updated [/pagamentos/${paymentId}] | User: ${userId} | Provider: ${provider} | Status: ${status} | Amount: ${amount} ${currency}`);

    return fullRecord;
  }

  /**
   * Handle Successful Payment Event.
   * Updates `/pagamentos` and `/users/{userId}` subscription state idempotently.
   */
  static async handlePaymentSuccess(params: {
    userId: string;
    planId: string;
    provider: "stripe" | "paypal" | "multicaixa" | "bank_transfer" | "transfer";
    transactionId: string;
    amount: number;
    currency: string;
    paidUntil?: string;
    providerSubscriptionId?: string;
    providerCustomerId?: string;
    eventId?: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; idempotent?: boolean; paymentRecord: PaymentRecord; reason?: string }> {
    const {
      userId,
      planId,
      provider: rawProvider,
      transactionId,
      amount,
      currency,
      paidUntil: suppliedPaidUntil,
      providerSubscriptionId: suppliedSubId,
      providerCustomerId: suppliedCustId,
      eventId,
      metadata
    } = params;

    const provider: PaymentProvider = rawProvider === "transfer" ? "bank_transfer" : rawProvider;
    const canonicalPaymentId = getCanonicalPaymentId(provider, transactionId);

    const providerSubId = suppliedSubId || metadata?.providerSubscriptionId || metadata?.stripeSubscriptionId || metadata?.paypalSubscriptionId || metadata?.subscription || null;
    const providerCustId = suppliedCustId || metadata?.providerCustomerId || metadata?.stripeCustomerId || metadata?.customer || null;

    // Idempotency check
    if (eventId && await this.isEventProcessed(eventId, provider)) {
      console.log(`[PaymentEngine Log] ℹ️ Duplicate event skipped: ${eventId} (${provider})`);
      const existingPaySnap = await safeGetDoc("pagamentos", canonicalPaymentId);
      const paymentRecord: PaymentRecord = existingPaySnap.exists ? (existingPaySnap.data() as PaymentRecord) : {
        paymentId: canonicalPaymentId,
        userId,
        provider,
        providerTransactionId: transactionId,
        planId,
        amount,
        currency,
        status: "paid",
        requiresReview: false,
        transactionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return { success: true, idempotent: true, paymentRecord };
    }

    // Guard against unknown planId: never fallback to default or grant access for invalid planId
    if (!SERVER_PLANS[planId]) {
      console.warn(`[PaymentEngine] Intent de pagamento com planId desconhecido '${planId}'. Registando transação em revisão sem conceder acesso.`);
      const reviewPaymentRecord = await this.recordPayment({
        paymentId: canonicalPaymentId,
        userId,
        provider,
        providerTransactionId: transactionId,
        providerSubscriptionId: providerSubId,
        providerCustomerId: providerCustId,
        planId: planId || "UNKNOWN",
        amount,
        currency,
        status: "requires_review",
        requiresReview: true,
        reviewReason: "UNKNOWN_PLAN_ID",
        transactionId,
        eventId,
        eventType: "payment_requires_review",
        metadata: { ...metadata, error: "UNKNOWN_PLAN_ID" }
      });

      if (eventId) {
        await this.markEventProcessed(eventId, provider, "payment_success_unknown_plan", {
          error: "UNKNOWN_PLAN_ID",
          receivedPlanId: planId || null,
          transactionId
        }, userId, "UNKNOWN_PLAN_ID");
      }

      return { success: false, reason: "UNKNOWN_PLAN_ID", paymentRecord: reviewPaymentRecord };
    }

    const now = new Date();
    let calculatedPaidUntil: string;

    if (suppliedPaidUntil) {
      calculatedPaidUntil = suppliedPaidUntil;
    } else {
      const planConfig = SERVER_PLANS[planId];
      const intervalMonths = planConfig.interval === "year" ? 12 : (planConfig.interval === "quarter" ? 3 : 1);
      const nextBillingDate = new Date(now);
      nextBillingDate.setMonth(nextBillingDate.getMonth() + intervalMonths);
      calculatedPaidUntil = nextBillingDate.toISOString();
    }

    // Inspect current user doc to prevent stale events from rolling back expiry
    const userSnap = await safeGetDoc("users", userId);
    const userData = userSnap.exists ? userSnap.data() : null;

    let finalExpiresAt = calculatedPaidUntil;
    if (userData) {
      const existingExpiresAt = userData.subscriptionExpiresAt || userData.nextBillingDate || userData.accountStatus?.expiresAt;
      if (existingExpiresAt) {
        const existingTime = new Date(existingExpiresAt).getTime();
        const calculatedTime = new Date(calculatedPaidUntil).getTime();
        if (existingTime > calculatedTime) {
          finalExpiresAt = existingExpiresAt;
        }
      }
    }

    const cancelAtPeriodEnd = metadata?.cancelAtPeriodEnd ?? (userData?.cancelAtPeriodEnd || false);
    const subscriptionStatus = cancelAtPeriodEnd ? "cancel_at_period_end" : "active";

    // 1. Record payment transaction in `/pagamentos` collection
    const paymentRecord = await this.recordPayment({
      paymentId: canonicalPaymentId,
      userId,
      provider,
      providerTransactionId: transactionId,
      providerSubscriptionId: providerSubId,
      providerCustomerId: providerCustId,
      planId,
      amount,
      currency,
      status: "paid",
      requiresReview: false,
      transactionId,
      eventId,
      eventType: "payment_success",
      paidAt: now.toISOString(),
      paidUntil: finalExpiresAt,
      metadata
    });

    // 2. Update `/users/{userId}` subscription state (Both PT & EN state fields for compatibility)
    const userUpdatePayload = {
      pagamentoConcluido: true,
      planoAssinatura: planId,
      atualizadoEm: now.toISOString(),
      provedorAssinatura: provider,
      providerSubscriptionId: providerSubId,
      providerCustomerId: providerCustId,
      stripeCustomerId: providerCustId || userData?.stripeCustomerId || null,
      gracePeriodEndsAt: null,
      nextPaymentAttempt: null,
      statusDaConta: {
        statusDoPagamento: "PAGO",
        planoAssinatura: planId,
        atualizadoEm: now.toISOString(),
        expiraEm: finalExpiresAt,
        graceEndsAt: null,
        nextPaymentAttempt: null
      },
      paymentCompleted: true,
      subscriptionActive: true,
      subscriptionStatus,
      statusDaAssinatura: subscriptionStatus,
      subscriptionPlanId: planId,
      subscriptionProvider: provider,
      lastPaymentDate: now.toISOString(),
      nextBillingDate: finalExpiresAt,
      subscriptionExpiresAt: finalExpiresAt,
      cancelAtPeriodEnd,
      accountStatus: {
        paymentStatus: "PAID",
        subscriptionStatus,
        expiresAt: finalExpiresAt,
        graceEndsAt: null,
        nextPaymentAttempt: null,
        updatedAt: now.toISOString()
      },
      updatedAt: now.toISOString()
    };

    await safeSetDoc("users", userId, userUpdatePayload, true);

    // 3. Mark webhook as processed if eventId supplied
    if (eventId) {
      await this.markEventProcessed(eventId, provider, "payment_success", { userId, transactionId }, userId);
    }

    console.log(`[PaymentEngine Log] ✅ Subscription ACTIVE for user ${userId} on plan ${planId} until ${finalExpiresAt}`);

    return { success: true, paymentRecord };
  }

  /**
   * Handle Payment Failure Event (Grace Period).
   */
  static async handlePaymentFailure(params: {
    userId: string;
    planId: string;
    provider: "stripe" | "paypal" | "multicaixa" | "bank_transfer" | "transfer";
    transactionId: string;
    amount: number;
    currency: string;
    reason: string;
    eventId?: string;
    attemptCount?: number;
    nextPaymentAttempt?: string | null;
    providerSubscriptionId?: string | null;
    providerCustomerId?: string | null;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; paymentRecord: PaymentRecord }> {
    const {
      userId,
      planId,
      provider: rawProvider,
      transactionId,
      amount,
      currency,
      reason,
      eventId,
      attemptCount: suppliedAttemptCount,
      nextPaymentAttempt: suppliedNextAttempt,
      providerSubscriptionId: suppliedSubId,
      providerCustomerId: suppliedCustId,
      metadata
    } = params;

    const provider: PaymentProvider = rawProvider === "transfer" ? "bank_transfer" : rawProvider;
    const canonicalPaymentId = getCanonicalPaymentId(provider, transactionId);

    // Idempotency check
    if (eventId && await this.isEventProcessed(eventId, provider)) {
      const existingPaySnap = await safeGetDoc("pagamentos", canonicalPaymentId);
      return { success: true, paymentRecord: existingPaySnap.data() };
    }

    // Inspect existing payment record
    const existingPaySnap = await safeGetDoc("pagamentos", canonicalPaymentId);
    const existingPayment: PaymentRecord | null = existingPaySnap.exists ? existingPaySnap.data() as PaymentRecord : null;

    // Stale event protection: If payment is already paid/refunded/reversed, do not revert to failed
    if (existingPayment && (existingPayment.status === "paid" || existingPayment.status === "refunded" || existingPayment.status === "reversed")) {
      console.warn(`[PaymentEngine] 🛡️ Ignored stale payment_failed event for payment ${canonicalPaymentId} which is currently '${existingPayment.status}'.`);
      if (eventId) {
        await this.markEventProcessed(eventId, provider, "payment_failed_stale_ignored", {
          reason: "STALE_EVENT_IGNORED",
          currentStatus: existingPayment.status
        }, userId);
      }
      return { success: true, paymentRecord: existingPayment };
    }

    // Inspect user doc
    const userSnap = await safeGetDoc("users", userId);
    const userData = userSnap.exists ? userSnap.data() : null;

    // Monotonic Attempt Count
    const existingAttemptCount = existingPayment?.attemptCount || userData?.attemptCount || 0;
    const finalAttemptCount = Math.max(existingAttemptCount, suppliedAttemptCount || (existingAttemptCount + 1));

    // Calculate gracePeriodEndsAt (preserve existing if in the future so redeliveries do not extend grace period)
    const now = new Date();
    const nowIso = now.toISOString();

    let finalGracePeriodEndsAt: string;
    const existingGrace = existingPayment?.gracePeriodEndsAt || userData?.gracePeriodEndsAt || userData?.statusDaConta?.graceEndsAt || userData?.accountStatus?.graceEndsAt;

    if (existingGrace && new Date(existingGrace).getTime() > now.getTime()) {
      finalGracePeriodEndsAt = existingGrace;
    } else {
      const graceEnd = new Date(now.getTime() + PAYMENT_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
      finalGracePeriodEndsAt = graceEnd.toISOString();
    }

    // Monotonic nextPaymentAttempt
    let finalNextAttempt = suppliedNextAttempt || existingPayment?.nextPaymentAttempt || userData?.nextPaymentAttempt || null;
    if (suppliedNextAttempt && existingPayment?.nextPaymentAttempt) {
      const existingTime = new Date(existingPayment.nextPaymentAttempt).getTime();
      const suppliedTime = new Date(suppliedNextAttempt).getTime();
      if (existingTime > suppliedTime && existingTime > now.getTime()) {
        finalNextAttempt = existingPayment.nextPaymentAttempt;
      }
    }

    const providerSubId = suppliedSubId || metadata?.providerSubscriptionId || metadata?.stripeSubscriptionId || metadata?.paypalSubscriptionId || existingPayment?.providerSubscriptionId || null;
    const providerCustId = suppliedCustId || metadata?.providerCustomerId || metadata?.stripeCustomerId || existingPayment?.providerCustomerId || null;

    // 1. Record failed payment
    const paymentRecord = await this.recordPayment({
      paymentId: canonicalPaymentId,
      userId,
      provider,
      providerTransactionId: transactionId,
      providerSubscriptionId: providerSubId,
      providerCustomerId: providerCustId,
      planId,
      amount,
      currency,
      status: "failed",
      requiresReview: false,
      transactionId,
      eventId,
      eventType: "payment_failed",
      failedAt: nowIso,
      gracePeriodEndsAt: finalGracePeriodEndsAt,
      nextPaymentAttempt: finalNextAttempt,
      attemptCount: finalAttemptCount,
      metadata: { ...metadata, failureReason: reason }
    });

    // 2. Transition user to Grace Period (Preserving access during grace period)
    const existingExpiresAt = userData?.subscriptionExpiresAt || userData?.nextBillingDate || userData?.accountStatus?.expiresAt;
    const finalExpiresAt = existingExpiresAt && new Date(existingExpiresAt).getTime() > now.getTime() ? existingExpiresAt : finalGracePeriodEndsAt;

    await safeSetDoc("users", userId, {
      gracePeriodEndsAt: finalGracePeriodEndsAt,
      nextPaymentAttempt: finalNextAttempt,
      attemptCount: finalAttemptCount,
      subscriptionStatus: "in_grace_period",
      statusDaAssinatura: "in_grace_period",
      subscriptionActive: true,
      pagamentoConcluido: true,
      paymentCompleted: true,
      subscriptionExpiresAt: finalExpiresAt,
      nextBillingDate: finalExpiresAt,
      statusDaConta: {
        statusDoPagamento: "GRACE_PERIOD",
        graceEndsAt: finalGracePeriodEndsAt,
        nextPaymentAttempt: finalNextAttempt,
        attemptCount: finalAttemptCount,
        razaoFalha: reason,
        atualizadoEm: nowIso
      },
      accountStatus: {
        paymentStatus: "GRACE_PERIOD",
        subscriptionStatus: "in_grace_period",
        graceEndsAt: finalGracePeriodEndsAt,
        nextPaymentAttempt: finalNextAttempt,
        attemptCount: finalAttemptCount,
        failureReason: reason,
        updatedAt: nowIso
      },
      atualizadoEm: nowIso,
      updatedAt: nowIso
    }, true);

    if (eventId) {
      await this.markEventProcessed(eventId, provider, "payment_failed", {
        userId,
        reason,
        attemptCount: finalAttemptCount,
        gracePeriodEndsAt: finalGracePeriodEndsAt,
        nextPaymentAttempt: finalNextAttempt
      }, userId);
    }

    console.warn(`[PaymentEngine Log] ⚠️ Payment FAILED for user ${userId} (Attempt #${finalAttemptCount}). Grace Period active until ${finalGracePeriodEndsAt}`);

    return { success: true, paymentRecord };
  }

  /**
   * Handle Subscription Renewal.
   */
  static async handleSubscriptionRenewal(params: {
    userId: string;
    planId: string;
    provider: "stripe" | "paypal" | "multicaixa" | "bank_transfer" | "transfer";
    transactionId: string;
    amount: number;
    currency: string;
    paidUntil?: string;
    providerSubscriptionId?: string;
    providerCustomerId?: string;
    eventId?: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; idempotent?: boolean; paymentRecord: PaymentRecord; reason?: string }> {
    return this.handlePaymentSuccess(params);
  }

  /**
   * Cancel Subscription.
   * Supports instant cancellation or cancel at end of billing cycle without altering completed payments.
   */
  static async cancelSubscription(params: {
    userId: string;
    cancelAtPeriodEnd?: boolean;
    effectiveDate?: string | Date;
    reason?: string;
    cancelledBy?: string;
  }): Promise<{ success: boolean; subscriptionStatus: string }> {
    const { userId, cancelAtPeriodEnd = true, effectiveDate, reason = "User requested cancellation", cancelledBy = "system" } = params;
    
    const userSnap = await safeGetDoc("users", userId);
    const userData = userSnap.exists ? userSnap.data() : null;
    const now = new Date();
    const nowIso = now.toISOString();

    let periodEndMs = 0;
    if (effectiveDate) {
      periodEndMs = new Date(effectiveDate).getTime();
    } else if (userData?.subscriptionExpiresAt) {
      periodEndMs = new Date(userData.subscriptionExpiresAt).getTime();
    } else if (userData?.nextBillingDate) {
      periodEndMs = new Date(userData.nextBillingDate).getTime();
    } else if (userData?.accountStatus?.expiresAt) {
      periodEndMs = new Date(userData.accountStatus.expiresAt).getTime();
    }

    const isFuture = periodEndMs > now.getTime();
    const keepAccessActive = cancelAtPeriodEnd && isFuture;
    const periodEndIso = isFuture ? new Date(periodEndMs).toISOString() : (userData?.subscriptionExpiresAt || nowIso);

    const subscriptionStatus = keepAccessActive ? "cancel_at_period_end" : "cancelled";
    const subscriptionActive = keepAccessActive;
    const paymentCompleted = keepAccessActive ? (userData?.paymentCompleted ?? true) : false;

    const payload = {
      cancelAtPeriodEnd: true,
      subscriptionActive,
      assinaturaAtiva: subscriptionActive,
      pagamentoConcluido: paymentCompleted,
      paymentCompleted,
      subscriptionStatus,
      statusDaAssinatura: subscriptionStatus,
      cancellationReason: reason,
      cancelledAt: nowIso,
      cancelledBy,
      subscriptionExpiresAt: periodEndIso,
      accountStatus: {
        paymentStatus: keepAccessActive ? "PAID" : "CANCELLED",
        subscriptionStatus,
        cancelAtPeriodEnd: true,
        expiresAt: periodEndIso,
        updatedAt: nowIso
      },
      updatedAt: nowIso
    };

    await safeSetDoc("users", userId, payload, true);

    console.log(`[PaymentEngine Log] 🛑 Subscription ${keepAccessActive ? `scheduled for cancellation at period end (${periodEndIso})` : "CANCELLED IMMEDIATELY"} for user ${userId}`);

    return { success: true, subscriptionStatus };
  }

  /**
   * Expire Subscription.
   */
  static async expireSubscription(userId: string): Promise<{ success: boolean }> {
    const now = new Date().toISOString();
    await safeSetDoc("users", userId, {
      paymentCompleted: false,
      subscriptionActive: false,
      subscriptionStatus: "expired",
      accountStatus: {
        paymentStatus: "EXPIRED",
        subscriptionStatus: "expired",
        updatedAt: now
      },
      updatedAt: now
    }, true);

    console.log(`[PaymentEngine Log] ⌛ Subscription EXPIRED for user ${userId}. Access restricted.`);
    return { success: true };
  }

  /**
   * Reactivate Subscription.
   */
  static async reactivateSubscription(userId: string): Promise<{ success: boolean }> {
    const userSnap = await safeGetDoc("users", userId);
    const userData = userSnap.exists ? userSnap.data() : null;
    const now = new Date().toISOString();

    const planId = userData?.subscriptionPlanId || "monthly";
    const planConfig = SERVER_PLANS[planId] || { interval: "month" };
    const intervalMonths = planConfig.interval === "year" ? 12 : 1;
    
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + intervalMonths);

    await safeSetDoc("users", userId, {
      paymentCompleted: true,
      subscriptionActive: true,
      subscriptionStatus: "active",
      cancelAtPeriodEnd: false,
      nextBillingDate: nextBillingDate.toISOString(),
      subscriptionExpiresAt: nextBillingDate.toISOString(),
      accountStatus: {
        paymentStatus: "PAID",
        subscriptionStatus: "active",
        expiresAt: nextBillingDate.toISOString(),
        updatedAt: now
      },
      updatedAt: now
    }, true);

    console.log(`[PaymentEngine Log] 🔄 Subscription REACTIVATED for user ${userId}`);
    return { success: true };
  }

  /**
   * Plan Upgrade / Downgrade with Proration Calculation.
   */
  static async changePlan(params: {
    userId: string;
    newPlanId: string;
    provider?: "stripe" | "paypal" | "multicaixa" | "bank_transfer" | "transfer";
  }): Promise<{
    success: boolean;
    prorationAmount: number;
    actionType: "upgrade" | "downgrade" | "same";
    newPlan: any;
    updatedUser: any;
  }> {
    const { userId, newPlanId, provider: rawProvider = "stripe" } = params;
    const provider: PaymentProvider = rawProvider === "transfer" ? "bank_transfer" : rawProvider;

    const userSnap = await safeGetDoc("users", userId);
    const userData = userSnap.exists ? userSnap.data() : null;

    const currentPlanId = userData?.subscriptionPlanId || "monthly";
    const currentPlan = SERVER_PLANS[currentPlanId] || { amount: 5.0, currency: "usd" };
    const newPlan = SERVER_PLANS[newPlanId];

    if (!newPlan) {
      throw new Error(`Plano de destino inválido: ${newPlanId}`);
    }

    let actionType: "upgrade" | "downgrade" | "same" = "same";
    if (newPlan.amount > currentPlan.amount) {
      actionType = "upgrade";
    } else if (newPlan.amount < currentPlan.amount) {
      actionType = "downgrade";
    }

    const nextBillingStr = userData?.nextBillingDate || userData?.subscriptionExpiresAt;
    let prorationAmount = 0;

    if (nextBillingStr && actionType === "upgrade") {
      const now = new Date();
      const billingEnd = new Date(nextBillingStr);
      const daysRemaining = Math.max(1, Math.ceil((billingEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      const dailyRateCurrent = currentPlan.amount / 30;
      const dailyRateNew = newPlan.amount / 30;
      
      const unusedCredit = dailyRateCurrent * daysRemaining;
      const newCostRemaining = dailyRateNew * daysRemaining;
      
      prorationAmount = Math.max(0, Math.round((newCostRemaining - unusedCredit) * 100) / 100);
    }

    const now = new Date();
    const intervalMonths = newPlan.interval === "year" ? 12 : 1;
    const newNextBilling = new Date(now);
    newNextBilling.setMonth(newNextBilling.getMonth() + intervalMonths);

    const updatePayload = {
      subscriptionPlanId: newPlanId,
      subscriptionActive: true,
      subscriptionStatus: "active",
      nextBillingDate: newNextBilling.toISOString(),
      subscriptionExpiresAt: newNextBilling.toISOString(),
      accountStatus: {
        paymentStatus: "PAID",
        subscriptionStatus: "active",
        planId: newPlanId,
        expiresAt: newNextBilling.toISOString(),
        updatedAt: now.toISOString()
      },
      updatedAt: now.toISOString()
    };

    await safeSetDoc("users", userId, updatePayload, true);

    const rawId = `MIGRATION-${currentPlanId}-TO-${newPlanId}-${Date.now()}`;
    const paymentId = getCanonicalPaymentId(provider, rawId);

    await this.recordPayment({
      paymentId,
      userId,
      provider,
      providerTransactionId: rawId,
      planId: newPlanId,
      amount: prorationAmount > 0 ? prorationAmount : newPlan.amount,
      currency: newPlan.currency || "USD",
      status: "paid",
      requiresReview: false,
      transactionId: rawId,
      eventType: "plan_change",
      metadata: { actionType, oldPlanId: currentPlanId, newPlanId, prorationAmount }
    });

    console.log(`[PaymentEngine Log] 🔄 Plan changed for ${userId}: ${currentPlanId} ➔ ${newPlanId} (${actionType.toUpperCase()}) | Proration charge: ${prorationAmount}`);

    return {
      success: true,
      prorationAmount,
      actionType,
      newPlan,
      updatedUser: { ...userData, ...updatePayload }
    };
  }

  /**
   * Process Refund.
   * Updates canonical payment record in `/pagamentos` to 'refunded', records audit details, and reverses subscription if applicable.
   */
  static async processRefund(params: {
    paymentId: string;
    reason: string;
    operatorId: string;
    provider?: string;
  }): Promise<{ success: boolean; paymentRecord: PaymentRecord; userReversed: boolean }> {
    const { paymentId: rawPaymentId, reason, operatorId, provider: rawProvider } = params;

    const provider: PaymentProvider = (rawProvider === "transfer" ? "bank_transfer" : (rawProvider as PaymentProvider)) || "stripe";
    const paymentId = getCanonicalPaymentId(provider, rawPaymentId);

    let paymentSnap = await safeGetDoc("pagamentos", paymentId);
    if (!paymentSnap.exists) {
      paymentSnap = await safeGetDoc("pagamentos", rawPaymentId);
    }
    if (!paymentSnap.exists) {
      paymentSnap = await safeGetDoc("payments", paymentId);
    }
    if (!paymentSnap.exists) {
      paymentSnap = await safeGetDoc("payments", rawPaymentId);
    }
    if (!paymentSnap.exists) {
      throw new Error(`Transação de pagamento não encontrada: ${paymentId}`);
    }

    const payment = paymentSnap.data() as PaymentRecord;
    if (payment.status === "refunded") {
      throw new Error("Este pagamento já foi reembolsado anteriormente.");
    }

    const now = new Date().toISOString();
    const refundTransactionId = `REF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const updatedPayment = await this.recordPayment({
      ...payment,
      paymentId: payment.paymentId,
      userId: payment.userId,
      provider: payment.provider,
      providerTransactionId: payment.providerTransactionId,
      planId: payment.planId,
      amount: payment.amount,
      currency: payment.currency,
      status: "refunded",
      previousStatus: payment.status,
      requiresReview: false,
      refundReason: reason,
      refundOperator: operatorId,
      refundedAt: now,
      refundTransactionId,
      eventType: "payment_refund",
      eventSource: "admin_refund"
    });

    let userReversed = false;
    const userId = payment.userId;

    if (userId) {
      await safeSetDoc("users", userId, {
        paymentCompleted: false,
        subscriptionActive: false,
        subscriptionStatus: "refunded",
        statusDaConta: {
          statusDoPagamento: "REFUNDED",
          razaoReembolso: reason,
          atualizadoEm: now
        },
        atualizadoEm: now,
        accountStatus: {
          paymentStatus: "REFUNDED",
          subscriptionStatus: "refunded",
          refundReason: reason,
          refundedAt: now,
          updatedAt: now
        },
        updatedAt: now
      }, true);
      userReversed = true;
    }

    await safeAddDoc("auditLogs", {
      type: "payment_refund",
      paymentId: payment.paymentId,
      userId: payment.userId,
      operatorId,
      amount: payment.amount,
      currency: payment.currency,
      provider: payment.provider,
      reason,
      refundTransactionId,
      createdAt: now
    });

    console.log(`[PaymentEngine Log] 💸 Refund processed for Payment [${payment.paymentId}] | User: ${payment.userId} | Amount: ${payment.amount} ${payment.currency} | Reason: ${reason}`);

    return {
      success: true,
      paymentRecord: updatedPayment,
      userReversed
    };
  }

  /**
   * Search / Query Payments from canonical `/pagamentos` collection (with fallback to legacy `/payments`).
   */
  static async getPayments(filters: {
    userId?: string;
    status?: string;
    provider?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<PaymentRecord[]> {
    const results: PaymentRecord[] = [];

    if (dbAdmin) {
      try {
        let query: any = dbAdmin.collection("pagamentos");
        if (filters.userId) query = query.where("userId", "==", filters.userId);
        if (filters.status && filters.status !== "ALL") query = query.where("status", "==", filters.status);
        if (filters.provider && filters.provider !== "ALL") query = query.where("provider", "==", filters.provider);

        const snap = await query.get();
        snap.forEach((doc: any) => {
          results.push(doc.data() as PaymentRecord);
        });
      } catch (err: any) {
        console.warn("[PaymentEngine] Firestore query fallback to memory cache:", err.message);
      }
    }

    // Merge/fallback with local memory db (`pagamentos_` and `payments_`)
    for (const [key, value] of localMemoryDb.entries()) {
      if (key.startsWith("pagamentos_") || key.startsWith("payments_")) {
        const item = value as PaymentRecord;
        if (item && item.paymentId && !results.some(r => r.paymentId === item.paymentId)) {
          results.push(item);
        }
      }
    }

    // Apply client-side filters (search query, date range)
    let filtered = results;

    if (filters.userId) {
      filtered = filtered.filter(p => p.userId === filters.userId);
    }
    if (filters.status && filters.status !== "ALL") {
      filtered = filtered.filter(p => p.status === filters.status || (filters.status === "paid" && p.status === "completed"));
    }
    if (filters.provider && filters.provider !== "ALL") {
      filtered = filtered.filter(p => p.provider === filters.provider);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        (p.paymentId && p.paymentId.toLowerCase().includes(q)) ||
        (p.userId && p.userId.toLowerCase().includes(q)) ||
        (p.providerTransactionId && p.providerTransactionId.toLowerCase().includes(q)) ||
        (p.transactionId && p.transactionId.toLowerCase().includes(q)) ||
        (p.planId && p.planId.toLowerCase().includes(q))
      );
    }
    if (filters.startDate) {
      const startMs = new Date(filters.startDate).getTime();
      filtered = filtered.filter(p => new Date(p.createdAt).getTime() >= startMs);
    }
    if (filters.endDate) {
      const endMs = new Date(filters.endDate).getTime();
      filtered = filtered.filter(p => new Date(p.createdAt).getTime() <= endMs);
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return filtered;
  }

  /**
   * Retrieve state event history for a given payment ID
   */
  static async getPaymentEvents(paymentId: string): Promise<PaymentEventRecord[]> {
    return safeGetSubDocs("pagamentos", paymentId, "eventos");
  }
}
