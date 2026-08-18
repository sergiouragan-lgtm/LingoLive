import { stripe } from "../config/stripe";
import { SERVER_PLANS } from "../config/plans";
import { dbAdmin } from "../config/firebaseAdmin";
import { appBaseUrl } from "../config/env";
import { PaymentEngineService } from "./paymentEngine.service";
import { safeGetDoc } from "./firestoreSafe.service";

export class StripeService {
  static async createCheckoutSession(userId: string, planId: string) {
    if (!stripe) {
      throw new Error("Stripe is not configured in this environment.");
    }

    const plan = SERVER_PLANS[planId];
    if (!plan) {
      throw new Error("Plano de subscrição inválido.");
    }

    console.log(`[Stripe Debug] appBaseUrl: ${appBaseUrl}`);
    console.log(`[Stripe Debug] success_url: ${appBaseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`);
    console.log(`[Stripe Debug] Creating session for user ${userId}, plan ${planId}`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      client_reference_id: userId,
      line_items: [
        {
          price_data: {
            currency: plan.currency || "usd",
            product_data: {
              name: plan.name,
            },
            unit_amount: Math.round(plan.amount * 100),
            recurring: {
              interval: plan.interval || "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appBaseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appBaseUrl}/billing/cancel`,
      metadata: {
        userId: userId,
        planId: planId
      }
    });
    console.log(`[Stripe Debug] Session created: ${session.id}, url: ${session.url}`);

    return session;
  }

  static async verifyWebhookSignature(payload: string | Buffer, signature: string): Promise<boolean> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret || !signature) {
      return false;
    }
    if (!stripe) {
      throw new Error("Stripe SDK não está inicializado.");
    }
    try {
      stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      return true;
    } catch (err: any) {
      throw new Error(`Stripe Signature Verification Failed: ${err.message}`);
    }
  }

  static async handleWebhookEvent(event: any) {
    try {
      const eventId = event.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      
      // Atomic Lock Acquisition via PaymentEngineService
      const lock = await PaymentEngineService.acquireEventLock(eventId, "stripe", event.type);
      if (!lock.acquired) {
        console.log(`[Stripe Webhook] 🔒 Event [${eventId}] already processed or in-flight (status: ${lock.status}). Skipping duplicate.`);
        return { received: true, idempotent: true };
      }

      console.log(`[Stripe Webhook Event] Processing event: ${event.type} (ID: ${eventId})`);

      if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.userId;
        const planId = session.metadata?.planId;

        if (!planId || !SERVER_PLANS[planId]) {
          console.warn(`[Stripe Webhook] Plan ID desconhecido '${planId}'. Registando como UNKNOWN_PLAN_ID sem conceder acesso.`);
          if (session.amount_total && session.amount_total > 0 && userId) {
            await PaymentEngineService.recordPayment({
              paymentId: session.payment_intent || session.id,
              userId,
              provider: "stripe",
              planId: planId || "UNKNOWN",
              amount: session.amount_total / 100,
              currency: session.currency || "usd",
              status: "review_required",
              transactionId: session.payment_intent || session.id,
              metadata: { session: session.id, error: "UNKNOWN_PLAN_ID" }
            });
          }
          await PaymentEngineService.markEventProcessed(eventId, "stripe", event.type, {
            error: "UNKNOWN_PLAN_ID",
            receivedPlanId: planId || null,
            sessionId: session.id
          }, userId || undefined, "UNKNOWN_PLAN_ID");
          return { received: true, error: "UNKNOWN_PLAN_ID" };
        }

        const transactionId = session.payment_intent || session.id;
        const amount = session.amount_total ? session.amount_total / 100 : SERVER_PLANS[planId].amount;
        const currency = session.currency || "usd";

        if (userId) {
          await PaymentEngineService.handlePaymentSuccess({
            userId,
            planId,
            provider: "stripe",
            transactionId,
            amount,
            currency,
            eventId,
            metadata: {
              stripeSubscriptionId: session.subscription,
              stripeCustomerId: session.customer
            }
          });
        } else {
          console.warn("[Stripe Webhook] Missing userId in session metadata.");
          await PaymentEngineService.markEventProcessed(eventId, "stripe", event.type, { warning: "missing_userId" });
        }
      } else if (event.type === "checkout.session.async_payment_failed") {
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.userId;
        const planId = session.metadata?.planId;

        if (!planId || !SERVER_PLANS[planId]) {
          await PaymentEngineService.markEventProcessed(eventId, "stripe", event.type, {
            error: "UNKNOWN_PLAN_ID",
            receivedPlanId: planId || null
          }, userId || undefined, "UNKNOWN_PLAN_ID");
          return { received: true, error: "UNKNOWN_PLAN_ID" };
        }

        const transactionId = session.payment_intent || session.id;
        const amount = session.amount_total ? session.amount_total / 100 : SERVER_PLANS[planId].amount;
        const currency = session.currency || "usd";

        if (userId) {
          await PaymentEngineService.handlePaymentFailure({
            userId,
            planId,
            provider: "stripe",
            transactionId: transactionId || `FAIL-${Date.now()}`,
            amount,
            currency,
            reason: "Async payment failed",
            eventId
          });
        } else {
          await PaymentEngineService.markEventProcessed(eventId, "stripe", event.type, { warning: "missing_userId" });
        }
      } else if (event.type === "invoice.paid") {
        const invoice = event.data.object;
        const invoiceId = invoice.id || invoice.payment_intent;
        const amount = invoice.amount_paid ? invoice.amount_paid / 100 : (invoice.amount_due ? invoice.amount_due / 100 : 0);
        const currency = invoice.currency || "usd";
        const customerId = invoice.customer || null;
        const subscriptionId = invoice.subscription || null;

        let userId: string | null = invoice.subscription_details?.metadata?.userId || invoice.lines?.data?.[0]?.metadata?.userId || invoice.metadata?.userId || null;

        if (!userId && dbAdmin && customerId) {
          const userSnap = await dbAdmin.collection("users").where("stripeCustomerId", "==", customerId).limit(1).get();
          if (!userSnap.empty) {
            userId = userSnap.docs[0].id;
          }
        }

        let planId: string | null = invoice.subscription_details?.metadata?.planId || invoice.lines?.data?.[0]?.metadata?.planId || invoice.metadata?.planId || null;
        if ((!planId || !SERVER_PLANS[planId]) && userId) {
          const userSnap = await safeGetDoc("users", userId);
          if (userSnap.exists && SERVER_PLANS[userSnap.data()?.subscriptionPlanId]) {
            planId = userSnap.data().subscriptionPlanId;
          }
        }

        if (!planId || !SERVER_PLANS[planId]) {
          console.warn(`[Stripe Webhook] Invoice com planId desconhecido '${planId}'. Registando como UNKNOWN_PLAN_ID.`);
          if (amount > 0 && userId) {
            await PaymentEngineService.recordPayment({
              paymentId: `stripe_${invoiceId}`,
              userId,
              provider: "stripe",
              providerTransactionId: invoice.payment_intent || invoiceId,
              providerSubscriptionId: subscriptionId,
              providerCustomerId: customerId,
              planId: planId || "UNKNOWN",
              amount,
              currency,
              status: "review_required",
              requiresReview: true,
              reviewReason: "UNKNOWN_PLAN_ID",
              transactionId: invoiceId,
              metadata: { invoiceId: invoice.id, error: "UNKNOWN_PLAN_ID" }
            });
          }
          await PaymentEngineService.markEventProcessed(eventId, "stripe", event.type, {
            error: "UNKNOWN_PLAN_ID",
            invoiceId: invoice.id
          }, userId || undefined, "UNKNOWN_PLAN_ID");
          return { received: true, error: "UNKNOWN_PLAN_ID" };
        }

        // Idempotency / Initial checkout check
        const canonicalInvoicePaymentId = `stripe_${invoiceId}`;
        const canonicalPiPaymentId = invoice.payment_intent ? `stripe_${invoice.payment_intent}` : null;

        const existingInvoicePaySnap = await safeGetDoc("pagamentos", canonicalInvoicePaymentId);
        if (existingInvoicePaySnap.exists && existingInvoicePaySnap.data()?.status === "paid") {
          console.log(`[Stripe Webhook] ℹ️ Invoice ${invoiceId} already processed as paid.`);
          await PaymentEngineService.markEventProcessed(eventId, "stripe", event.type, { invoiceId: invoice.id }, userId || undefined);
          return { received: true, idempotent: true };
        }

        if (invoice.billing_reason === "subscription_create" && canonicalPiPaymentId) {
          const existingPiPaySnap = await safeGetDoc("pagamentos", canonicalPiPaymentId);
          if (existingPiPaySnap.exists && existingPiPaySnap.data()?.status === "paid") {
            console.log(`[Stripe Webhook] ℹ️ Initial invoice already recorded via checkout.session.completed for PI ${invoice.payment_intent}.`);
            await PaymentEngineService.markEventProcessed(eventId, "stripe", event.type, { invoiceId: invoice.id, paymentIntent: invoice.payment_intent }, userId || undefined);
            return { received: true, idempotent: true };
          }
        }

        let paidUntil: string | undefined = undefined;
        const periodEndSec = invoice.lines?.data?.[0]?.period?.end || invoice.period_end;
        if (periodEndSec) {
          paidUntil = new Date(periodEndSec * 1000).toISOString();
        }

        if (userId) {
          await PaymentEngineService.handleSubscriptionRenewal({
            userId,
            planId,
            provider: "stripe",
            transactionId: invoiceId,
            amount,
            currency,
            paidUntil,
            providerSubscriptionId: subscriptionId,
            providerCustomerId: customerId,
            eventId,
            metadata: {
              invoiceId: invoice.id,
              paymentIntentId: invoice.payment_intent,
              stripeSubscriptionId: subscriptionId,
              stripeCustomerId: customerId,
              billingReason: invoice.billing_reason
            }
          });
        } else {
          await PaymentEngineService.markEventProcessed(eventId, "stripe", event.type, { warning: "missing_userId" });
        }
      } else if (event.type === "invoice.payment_failed") {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const transactionId = invoice.id || invoice.payment_intent;
        const amount = invoice.amount_due ? invoice.amount_due / 100 : 0;
        const currency = invoice.currency || "usd";

        let userId: string | null = invoice.subscription_details?.metadata?.userId || invoice.lines?.data?.[0]?.metadata?.userId || invoice.metadata?.userId || null;
        if (!userId && dbAdmin && customerId) {
          const userSnap = await dbAdmin.collection("users").where("stripeCustomerId", "==", customerId).limit(1).get();
          if (!userSnap.empty) {
            userId = userSnap.docs[0].id;
          }
        }

        let planId: string | null = invoice.subscription_details?.metadata?.planId || invoice.lines?.data?.[0]?.metadata?.planId || invoice.metadata?.planId || null;
        if ((!planId || !SERVER_PLANS[planId]) && userId) {
          const userSnap = await safeGetDoc("users", userId);
          if (userSnap.exists && SERVER_PLANS[userSnap.data()?.subscriptionPlanId]) {
            planId = userSnap.data().subscriptionPlanId;
          }
        }

        if (!planId || !SERVER_PLANS[planId]) {
          await PaymentEngineService.markEventProcessed(eventId, "stripe", event.type, {
            error: "UNKNOWN_PLAN_ID",
            invoiceId: invoice.id
          }, userId || undefined, "UNKNOWN_PLAN_ID");
          return { received: true, error: "UNKNOWN_PLAN_ID" };
        }

        const nextPaymentAttempt = invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000).toISOString() : null;
        const attemptCount = invoice.attempt_count || 1;

        if (userId) {
          await PaymentEngineService.handlePaymentFailure({
            userId,
            planId,
            provider: "stripe",
            transactionId: transactionId || `FAIL-${Date.now()}`,
            amount,
            currency,
            reason: invoice.billing_reason || "Payment failed",
            eventId,
            attemptCount,
            nextPaymentAttempt,
            providerSubscriptionId: invoice.subscription || null,
            providerCustomerId: customerId || null,
            metadata: {
              invoiceId: invoice.id,
              paymentIntent: invoice.payment_intent,
              stripeSubscriptionId: invoice.subscription,
              stripeCustomerId: customerId,
              billingReason: invoice.billing_reason
            }
          });
        } else {
          await PaymentEngineService.markEventProcessed(eventId, "stripe", event.type, { warning: "missing_userId" });
        }
      } else if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        let userId: string | null = subscription.metadata?.userId || null;

        if (!userId && dbAdmin && customerId) {
          const userSnap = await dbAdmin.collection("users").where("stripeCustomerId", "==", customerId).limit(1).get();
          if (!userSnap.empty) {
            userId = userSnap.docs[0].id;
          }
        }

        if (userId) {
          const effectiveDate = subscription.current_period_end 
            ? new Date(subscription.current_period_end * 1000).toISOString() 
            : undefined;
          const isFuture = subscription.current_period_end 
            ? (subscription.current_period_end * 1000 > Date.now()) 
            : false;

          await PaymentEngineService.cancelSubscription({
            userId,
            cancelAtPeriodEnd: isFuture,
            effectiveDate,
            reason: "Subscription deleted by Stripe webhook",
            cancelledBy: "stripe_webhook"
          });
          await PaymentEngineService.markEventProcessed(eventId, "stripe", event.type, { userId }, userId);
        } else {
          await PaymentEngineService.markEventProcessed(eventId, "stripe", event.type, { warning: "missing_userId" });
        }
      } else if (event.type === "customer.subscription.updated") {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        let userId: string | null = subscription.metadata?.userId || null;

        if (!userId && dbAdmin && customerId) {
          const userSnap = await dbAdmin.collection("users").where("stripeCustomerId", "==", customerId).limit(1).get();
          if (!userSnap.empty) {
            userId = userSnap.docs[0].id;
          }
        }

        if (userId) {
          if (subscription.status === "active" && !subscription.cancel_at_period_end) {
            await PaymentEngineService.reactivateSubscription(userId);
          } else if (subscription.cancel_at_period_end || subscription.status === "canceled") {
            const periodEndSec = subscription.current_period_end || subscription.cancel_at;
            const effectiveDate = periodEndSec ? new Date(periodEndSec * 1000).toISOString() : undefined;
            const isFuture = periodEndSec ? (periodEndSec * 1000 > Date.now()) : false;

            await PaymentEngineService.cancelSubscription({
              userId,
              cancelAtPeriodEnd: isFuture,
              effectiveDate,
              reason: subscription.cancel_at_period_end ? "Scheduled cancellation in Stripe" : "Subscription canceled in Stripe",
              cancelledBy: "stripe_webhook"
            });
          }
          await PaymentEngineService.markEventProcessed(eventId, "stripe", event.type, { userId, status: subscription.status }, userId);
        } else {
          await PaymentEngineService.markEventProcessed(eventId, "stripe", event.type, { warning: "missing_userId" });
        }
      } else {
        // Log other events safely
        await PaymentEngineService.markEventProcessed(eventId, "stripe", event.type, { id: event.data?.object?.id });
      }

      return { received: true };
    } catch (err: any) {
      console.error("[Stripe Webhook Handler Error]:", err.message);
      throw err;
    }
  }
}

