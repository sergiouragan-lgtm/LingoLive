import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { paymentsLimiter } from "../middleware/rateLimit";
import { getStripeClient } from "../config/stripe";
import { SERVER_PLANS } from "../config/plans";
import { StripeService } from "../services/stripe.service";
import { PaymentEngineService } from "../services/paymentEngine.service";
import { mobileDeepLink } from "../config/env";
import { safeGetDoc, safeSetDoc } from "../services/firestoreSafe.service";

const router = Router();

/**
 * POST /api/mobile/billing/checkout-session
 * Cria uma sessão de checkout Stripe cujas URLs de retorno reentram na app
 * nativa. O `userId` vem sempre do token verificado.
 */
router.post("/checkout-session", requireAuth, paymentsLimiter, async (req: any, res) => {
  const { planId } = req.body || {};
  const userId = req.user.uid;

  if (!planId || !SERVER_PLANS[planId]) {
    return res.status(400).json({ error: "Plano de subscrição inválido." });
  }

  try {
    const session = await StripeService.createCheckoutSession(userId, planId, "mobile");

    // Guardamos a intenção para que o retorno no dispositivo possa ser
    // reconciliado mesmo que o webhook chegue primeiro (ou nunca chegue).
    await safeSetDoc("mobile_checkout_sessions", session.id, {
      sessionId: session.id,
      userId,
      planId,
      platform: "mobile",
      status: "created",
      createdAt: new Date().toISOString(),
    }, true);

    return res.json({
      sessionId: session.id,
      url: session.url,
      returnUrls: StripeService.buildReturnUrls("mobile"),
      deepLinkSuccess: mobileDeepLink("billing/success", { session_id: session.id }),
      deepLinkCancel: mobileDeepLink("billing/cancel"),
    });
  } catch (error: any) {
    console.error("[Mobile Billing] Falha ao criar sessão de checkout:", error);
    return res.status(500).json({ error: "MOBILE_CHECKOUT_CREATE_FAILED", message: error.message });
  }
});

/**
 * GET /api/mobile/billing/return
 * Ponte HTTPS → deep link. O Stripe redireciona para aqui no dispositivo real e
 * esta rota devolve o utilizador à app. Não concede acesso: a app tem de
 * confirmar o estado com /verify.
 */
router.get("/return", (req: any, res) => {
  const outcome = req.query.outcome === "success" ? "success" : "cancel";
  const sessionId = typeof req.query.session_id === "string" ? req.query.session_id : "";
  const target = outcome === "success"
    ? mobileDeepLink("billing/success", sessionId ? { session_id: sessionId } : {})
    : mobileDeepLink("billing/cancel");

  const escapedTarget = target.replace(/"/g, "&quot;");
  res.set("Content-Type", "text/html; charset=utf-8");
  return res.send(`<!doctype html>
<html lang="pt"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>A regressar à LingoLIVE</title>
<meta http-equiv="refresh" content="0;url=${escapedTarget}">
</head><body style="font-family:system-ui;padding:2rem;text-align:center">
<p>A regressar à aplicação LingoLIVE…</p>
<p><a href="${escapedTarget}">Toque aqui se a aplicação não abrir automaticamente.</a></p>
<script>window.location.replace(${JSON.stringify(target)});</script>
</body></html>`);
});

/**
 * GET /api/mobile/billing/verify/:sessionId
 * Verifica o estado REAL da sessão junto do Stripe quando a app volta ao
 * primeiro plano e reconcilia o acesso caso o webhook ainda não tenha chegado.
 * Nunca concede acesso a partir de um parâmetro enviado pelo cliente.
 */
router.get("/verify/:sessionId", requireAuth, paymentsLimiter, async (req: any, res) => {
  const { sessionId } = req.params;
  const userId = req.user.uid;

  const stripe = getStripeClient();
  if (!stripe) {
    return res.status(503).json({
      error: "STRIPE_NOT_CONFIGURED",
      message: "O verificador de pagamentos não está configurado neste ambiente.",
      retryable: true,
    });
  }

  try {
    const session: any = await stripe.checkout.sessions.retrieve(sessionId);

    const sessionUserId = session.client_reference_id || session.metadata?.userId;
    if (sessionUserId && sessionUserId !== userId) {
      return res.status(403).json({ error: "CHECKOUT_SESSION_FORBIDDEN" });
    }

    const planId = session.metadata?.planId;
    const paid = session.payment_status === "paid";

    await safeSetDoc("mobile_checkout_sessions", sessionId, {
      sessionId,
      userId,
      planId: planId || null,
      status: session.status || "unknown",
      paymentStatus: session.payment_status || "unknown",
      verifiedAt: new Date().toISOString(),
    }, true);

    if (paid && planId && SERVER_PLANS[planId]) {
      // Reconciliação idempotente: `handlePaymentSuccess` usa o transactionId
      // como chave, portanto uma segunda verificação não duplica a subscrição.
      await PaymentEngineService.handlePaymentSuccess({
        userId,
        planId,
        provider: "stripe",
        transactionId: session.payment_intent || session.id,
        amount: session.amount_total ? session.amount_total / 100 : SERVER_PLANS[planId].amount,
        currency: session.currency || "usd",
        eventId: `mobile_verify_${sessionId}`,
        metadata: {
          stripeSubscriptionId: session.subscription || null,
          stripeCustomerId: session.customer || null,
          reconciledFrom: "mobile_device_return",
        },
      });
    }

    const userSnapshot = await safeGetDoc("users", userId);
    const profile = userSnapshot.exists ? userSnapshot.data() : {};

    return res.json({
      sessionId,
      status: session.status || "unknown",
      paymentStatus: session.payment_status || "unknown",
      paid,
      planId: planId || null,
      entitlement: {
        subscriptionStatus: profile.subscriptionStatus || "none",
        subscriptionPlanId: profile.subscriptionPlanId || null,
        paidUntil: profile.paidUntil || null,
      },
      verifiedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error?.statusCode === 404 || error?.code === "resource_missing") {
      return res.status(404).json({ error: "CHECKOUT_SESSION_NOT_FOUND" });
    }
    console.error("[Mobile Billing] Falha ao verificar sessão:", error);
    return res.status(502).json({
      error: "CHECKOUT_VERIFICATION_FAILED",
      message: "Não foi possível confirmar o pagamento junto do Stripe.",
      retryable: true,
    });
  }
});

/**
 * GET /api/mobile/billing/entitlement
 * Estado de subscrição efetivo, lido do perfil persistido. É a fonte que a app
 * usa para desbloquear conteúdo — nunca o resultado do redirecionamento.
 */
router.get("/entitlement", requireAuth, async (req: any, res) => {
  try {
    const snapshot = await safeGetDoc("users", req.user.uid);
    const profile = snapshot.exists ? snapshot.data() : {};
    const paidUntil = profile.paidUntil ? Date.parse(profile.paidUntil) : NaN;
    const active = profile.subscriptionStatus === "active"
      && (!Number.isFinite(paidUntil) || paidUntil > Date.now());

    return res.json({
      active,
      subscriptionStatus: profile.subscriptionStatus || "none",
      subscriptionPlanId: profile.subscriptionPlanId || null,
      paidUntil: profile.paidUntil || null,
      checkedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Mobile Billing] Falha ao ler entitlement:", error);
    return res.status(503).json({ error: "ENTITLEMENT_UNAVAILABLE", retryable: true });
  }
});

export default router;
