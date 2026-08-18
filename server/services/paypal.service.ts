import { safeGetDoc, safeSetDoc } from "./firestoreSafe.service";
import { SERVER_PLANS } from "../config/plans";
import { PaymentEngineService } from "./paymentEngine.service";

export class PaypalService {
  static async createOrder(userId: string, planId: string) {
    let normalizedPlanId = planId;
    if (planId === "trial-starter") normalizedPlanId = "trial_starter";
    else if (planId === "premium-plan") normalizedPlanId = "monthly";
    else if (planId === "family-plan") normalizedPlanId = "quarterly";

    const plan = SERVER_PLANS[normalizedPlanId];
    if (!plan) {
      throw new Error("Plano inválido");
    }

    const orderId = "PAY-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    const orderData = {
      orderId,
      userId,
      planId: normalizedPlanId,
      expectedAmount: plan.amount,
      currency: plan.currency.toUpperCase(),
      status: "created",
      createdAt: new Date().toISOString()
    };

    await safeSetDoc("pendingPaypalOrders", orderId, orderData);
    return orderData;
  }

  static async captureOrder(userId: string, orderId: string) {
    const orderSnap = await safeGetDoc("pendingPaypalOrders", orderId);
    if (!orderSnap.exists) {
      throw new Error("Ordem do PayPal não encontrada");
    }

    const order = orderSnap.data();
    if (!order) {
      throw new Error("Dados da ordem não encontrados");
    }

    // 1. Confirm user authorization
    if (order.userId !== userId) {
      throw new Error("Utilizador não autorizado para capturar esta ordem");
    }

    // 2. Validate plan, amount & status
    const plan = SERVER_PLANS[order.planId];
    if (!plan) {
      throw new Error("Plano associado à ordem é inválido");
    }

    if (order.expectedAmount !== plan.amount) {
      throw new Error("Valor incorreto ou alterado");
    }

    if (order.currency.toUpperCase() !== plan.currency.toUpperCase()) {
      throw new Error("Moeda incorreta ou alterada");
    }

    if (order.status !== "created") {
      throw new Error(`Esta ordem está num estado inválido para captura: ${order.status}`);
    }

    // 3. Process payment via central PaymentEngine (Idempotent, records transaction to /payments and updates user)
    const result = await PaymentEngineService.handlePaymentSuccess({
      userId,
      planId: order.planId,
      provider: "paypal",
      transactionId: orderId,
      amount: order.expectedAmount,
      currency: order.currency,
      eventId: `paypal_order_${orderId}`,
      metadata: { paypalOrderId: orderId }
    });

    const updatedOrder = {
      ...order,
      status: "completed",
      updatedAt: new Date().toISOString()
    };
    await safeSetDoc("pendingPaypalOrders", orderId, updatedOrder, true);

    return {
      success: true,
      subscriptionStatus: result.paymentRecord.status === "completed" ? "active" : "failed",
      paymentRecord: result.paymentRecord
    };
  }

  /**
   * Verify PayPal Webhook Signature using official PayPal API verification endpoint.
   * Fail-Closed: returns false if credentials or signature headers are missing or signature is invalid.
   */
  static async verifyWebhookSignature(eventBody: any, headers: Record<string, any>): Promise<boolean> {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const paypalMode = process.env.PAYPAL_MODE || "sandbox";

    if (!webhookId || !clientId || !clientSecret) {
      console.error("[PayPal Webhook] Credenciais do PayPal ausentes no ambiente.");
      return false;
    }

    if (!headers) {
      return false;
    }

    const transmissionId = headers["paypal-transmission-id"] || headers["PAYPAL-TRANSMISSION-ID"];
    const transmissionTime = headers["paypal-transmission-time"] || headers["PAYPAL-TRANSMISSION-TIME"];
    const certUrl = headers["paypal-cert-url"] || headers["PAYPAL-CERT-URL"];
    const authAlgo = headers["paypal-auth-algo"] || headers["PAYPAL-AUTH-ALGO"];
    const transmissionSig = headers["paypal-transmission-sig"] || headers["PAYPAL-TRANSMISSION-SIG"];

    if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
      console.warn("[PayPal Webhook] Cabeçalhos oficiais da assinatura PayPal ausentes.");
      return false;
    }

    try {
      const baseUrl = (paypalMode === "live" || paypalMode === "production") 
        ? "https://api-m.paypal.com" 
        : "https://api-m.sandbox.paypal.com";

      // 1. Obtain PayPal REST API access token
      const authString = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${authString}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials",
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!tokenRes.ok) {
        console.error("[PayPal Webhook] Falha ao obter access_token para verificação de assinatura.");
        return false;
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      // 2. Call PayPal Webhook Signature Verification endpoint
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 10000);

      const verifyRes = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          transmission_id: transmissionId,
          transmission_time: transmissionTime,
          cert_url: certUrl,
          auth_algo: authAlgo,
          transmission_sig: transmissionSig,
          webhook_id: webhookId,
          webhook_event: eventBody
        }),
        signal: controller2.signal
      });
      clearTimeout(timeoutId2);

      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        return verifyData.verification_status === "SUCCESS";
      }
      return false;
    } catch (err: any) {
      console.error("[PayPal Webhook Verification Error]:", err.message);
      return false;
    }
  }

  /**
   * Handle PayPal Webhooks.
   * Validates webhook event payload & signature, ensuring idempotency.
   */
  static async handleWebhookEvent(event: any, headers?: any) {
    if (headers && !(await this.verifyWebhookSignature(event, headers))) {
      console.warn("[PayPal Webhook] ❌ Webhook verification failed. Rejection enforced.");
      throw new Error("Assinatura do webhook do PayPal é inválida ou não verificada.");
    }

    const eventId = event.id || event.event_id || `paypal_evt_${Date.now()}`;
    const eventType = event.event_type || event.type || "PAYMENT.CAPTURE.COMPLETED";

    // Atomic Idempotency Check via PaymentEngineService
    const lock = await PaymentEngineService.acquireEventLock(eventId, "paypal", eventType);
    if (!lock.acquired) {
      console.log(`[PayPal Webhook] 🔒 Event [${eventId}] already processed or in-flight (status: ${lock.status}). Skipping duplicate.`);
      return { received: true, idempotent: true };
    }

    console.log(`[PayPal Webhook Event] Processing event: ${eventType} (ID: ${eventId})`);

    const resource = event.resource || {};
    const customId = resource.custom_id || resource.invoice_id || resource.custom;
    
    // Parse userId and planId from custom_id if provided (e.g. "user123:monthly")
    let userId: string | null = customId;
    let planId: string | null = null;
    if (customId && customId.includes(":")) {
      const parts = customId.split(":");
      userId = parts[0];
      planId = parts[1];
    }

    const transactionId = resource.id || eventId;
    const amount = resource.amount?.value ? parseFloat(resource.amount.value) : (planId && SERVER_PLANS[planId] ? SERVER_PLANS[planId].amount : 0);
    const currency = resource.amount?.currency_code || "USD";

    if (eventType === "CHECKOUT.ORDER.APPROVED") {
      // Intermediate order approval; payment capture completes on PAYMENT.CAPTURE.COMPLETED.
      if (userId) {
        await PaymentEngineService.recordPayment({
          paymentId: `paypal_ord_${resource.id || transactionId}`,
          userId,
          provider: "paypal",
          providerTransactionId: resource.id || transactionId,
          planId: planId || "monthly",
          amount,
          currency,
          status: "pending",
          requiresReview: false,
          eventId,
          eventType: "CHECKOUT.ORDER.APPROVED",
          metadata: { resourceId: resource.id, status: "APPROVED" }
        });
      }
      await PaymentEngineService.markEventProcessed(eventId, "paypal", eventType, { id: resource.id, status: "APPROVED" });
      return { received: true, note: "Order approved, awaiting capture completion" };
    } else if (eventType === "PAYMENT.CAPTURE.COMPLETED" || eventType === "PAYMENT.SALE.COMPLETED" || eventType === "BILLING.SUBSCRIPTION.PAYMENT.COMPLETED") {
      const captureId = resource.id || eventId;
      const subscriptionId = resource.billing_agreement_id || resource.subscription_id || null;
      const nextBillingTime = resource.billing_info?.next_billing_time || resource.next_payment_exec_time;
      const paidUntil = nextBillingTime ? new Date(nextBillingTime).toISOString() : undefined;

      if (!planId || !SERVER_PLANS[planId]) {
        console.warn(`[PayPal Webhook] Plan ID desconhecido '${planId}'. Registando como UNKNOWN_PLAN_ID sem conceder acesso.`);
        if (amount > 0 && userId) {
          await PaymentEngineService.recordPayment({
            paymentId: `paypal_${captureId}`,
            userId,
            provider: "paypal",
            providerTransactionId: captureId,
            providerSubscriptionId: subscriptionId,
            planId: planId || "UNKNOWN",
            amount,
            currency,
            status: "review_required",
            requiresReview: true,
            reviewReason: "UNKNOWN_PLAN_ID",
            transactionId: captureId,
            metadata: { resourceId: resource.id, error: "UNKNOWN_PLAN_ID" }
          });
        }
        await PaymentEngineService.markEventProcessed(eventId, "paypal", eventType, {
          error: "UNKNOWN_PLAN_ID",
          receivedPlanId: planId || null,
          resourceId: resource.id
        }, userId || undefined, "UNKNOWN_PLAN_ID");
        return { received: true, error: "UNKNOWN_PLAN_ID" };
      }

      if (userId) {
        await PaymentEngineService.handleSubscriptionRenewal({
          userId,
          planId,
          provider: "paypal",
          transactionId: captureId,
          amount,
          currency,
          paidUntil,
          providerSubscriptionId: subscriptionId,
          eventId,
          metadata: {
            paypalCaptureId: captureId,
            paypalSubscriptionId: subscriptionId,
            customId: resource.custom_id
          }
        });
      } else {
        await PaymentEngineService.markEventProcessed(eventId, "paypal", eventType, { warning: "missing_userId" });
      }
    } else if (eventType === "PAYMENT.CAPTURE.DENIED" || eventType === "BILLING.SUBSCRIPTION.PAYMENT.FAILED" || eventType === "BILLING.SUBSCRIPTION.SUSPENDED") {
      if (!planId || !SERVER_PLANS[planId]) {
        await PaymentEngineService.markEventProcessed(eventId, "paypal", eventType, {
          error: "UNKNOWN_PLAN_ID",
          receivedPlanId: planId || null
        }, userId || undefined, "UNKNOWN_PLAN_ID");
        return { received: true, error: "UNKNOWN_PLAN_ID" };
      }

      const subscriptionId = resource.billing_agreement_id || resource.subscription_id || null;
      const nextBillingTime = resource.billing_info?.next_billing_time || resource.next_payment_exec_time;
      const nextPaymentAttempt = nextBillingTime ? new Date(nextBillingTime).toISOString() : null;
      const attemptCount = resource.billing_info?.failed_payments_count ? parseInt(String(resource.billing_info.failed_payments_count), 10) : 1;

      if (userId) {
        await PaymentEngineService.handlePaymentFailure({
          userId,
          planId,
          provider: "paypal",
          transactionId,
          amount,
          currency,
          reason: resource.status_details?.reason || eventType || "PayPal Payment Failed",
          eventId,
          attemptCount,
          nextPaymentAttempt,
          providerSubscriptionId: subscriptionId,
          metadata: {
            paypalSubscriptionId: subscriptionId,
            eventType,
            status: resource.status
          }
        });
      } else {
        await PaymentEngineService.markEventProcessed(eventId, "paypal", eventType, { warning: "missing_userId" });
      }
    } else if (eventType === "PAYMENT.CAPTURE.REFUNDED" || eventType === "PAYMENT.CAPTURE.REVERSED") {
      if (userId) {
        await PaymentEngineService.processRefund({
          paymentId: transactionId,
          reason: resource.status_details?.reason || "Estorno/Reembolso PayPal",
          operatorId: "paypal_webhook"
        });
        await PaymentEngineService.markEventProcessed(eventId, "paypal", eventType, { userId }, userId);
      } else {
        await PaymentEngineService.markEventProcessed(eventId, "paypal", eventType, { warning: "missing_userId" });
      }
    } else if (eventType === "BILLING.SUBSCRIPTION.ACTIVATED") {
      if (userId) {
        await PaymentEngineService.reactivateSubscription(userId);
        await PaymentEngineService.markEventProcessed(eventId, "paypal", eventType, { userId }, userId);
      } else {
        await PaymentEngineService.markEventProcessed(eventId, "paypal", eventType, { warning: "missing_userId" });
      }
    } else if (eventType === "BILLING.SUBSCRIPTION.UPDATED") {
      if (userId) {
        await PaymentEngineService.markEventProcessed(eventId, "paypal", eventType, { userId, status: resource.status }, userId);
      } else {
        await PaymentEngineService.markEventProcessed(eventId, "paypal", eventType, { warning: "missing_userId" });
      }
    } else if (eventType === "BILLING.SUBSCRIPTION.SUSPENDED") {
      if (userId) {
        await safeSetDoc("users", userId, {
          accountStatus: {
            paymentStatus: "GRACE_PERIOD",
            subscriptionStatus: "suspended",
            updatedAt: new Date().toISOString()
          },
          updatedAt: new Date().toISOString()
        }, true);
        await PaymentEngineService.markEventProcessed(eventId, "paypal", eventType, { userId, status: "SUSPENDED" }, userId);
      } else {
        await PaymentEngineService.markEventProcessed(eventId, "paypal", eventType, { warning: "missing_userId" });
      }
    } else if (eventType === "BILLING.SUBSCRIPTION.CANCELLED") {
      if (userId) {
        let effectiveDate: string | undefined = undefined;
        if (resource.billing_info?.next_billing_time) {
          effectiveDate = resource.billing_info.next_billing_time;
        } else if (resource.status_update_time) {
          effectiveDate = resource.status_update_time;
        }
        const isFuture = effectiveDate ? (new Date(effectiveDate).getTime() > Date.now()) : false;

        await PaymentEngineService.cancelSubscription({
          userId,
          cancelAtPeriodEnd: isFuture,
          effectiveDate,
          reason: "Assinatura Cancelada no PayPal",
          cancelledBy: "paypal_webhook"
        });
        await PaymentEngineService.markEventProcessed(eventId, "paypal", eventType, { userId }, userId);
      } else {
        await PaymentEngineService.markEventProcessed(eventId, "paypal", eventType, { warning: "missing_userId" });
      }
    } else {
      await PaymentEngineService.markEventProcessed(eventId, "paypal", eventType, { id: resource.id });
    }

    return { received: true };
  }
}

