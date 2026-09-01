import express, { Router } from "express";
import { StripeService } from "../services/stripe.service";
import { getStripeClient } from "../config/stripe";
import { requireAuth } from "../middleware/requireAuth";
import { paymentsLimiter } from "../middleware/rateLimit";
import { SERVER_PLANS } from "../config/plans";

const router = Router();

// Stripe Webhook Endpoint (requires raw body before global express.json() is applied)
router.post("/stripe-webhook", express.raw({ type: "*/*" }), async (req: any, res: any) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET não está configurado no ambiente.");
    return res.status(500).json({ error: "Stripe webhook secret is missing" });
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    console.error("Cabeçalho stripe-signature ausente.");
    return res.status(400).json({ error: "Stripe signature missing" });
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return res.status(500).json({ error: "Stripe not configured" });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("Erro na validação do webhook do Stripe:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const result = await StripeService.handleWebhookEvent(event);
    res.json(result || { received: true });
  } catch (error: any) {
    console.error("Erro ao processar evento do Stripe:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

router.post("/create-checkout-session", express.json(), requireAuth, paymentsLimiter, async (req: any, res: any) => {
  const { planId, client } = req.body;
  const userId = req.user.uid;

  if (!planId) {
    return res.status(400).json({ error: "planId é obrigatório" });
  }

  if (!SERVER_PLANS[planId]) {
    return res.status(400).json({ error: "Plano de subscrição inválido." });
  }

  console.log(`[Payment Route] Creating checkout session for userId: ${userId}, planId: ${planId}`);

  try {
    const session = await StripeService.createCheckoutSession(userId, planId, { mobile: client === "mobile" });
    console.log(`[Payment Route] Session created, URL: ${session.url}`);
    res.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating stripe checkout session:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/create-bank-transfer-reference
 * Create bank transfer reference and register pending payment intention in /pagamentos/bank_{reference}
 */
router.post("/create-bank-transfer-reference", express.json(), requireAuth, paymentsLimiter, async (req: any, res: any) => {
  try {
    const { planId } = req.body;
    const userId = req.user.uid;

    if (!planId || !SERVER_PLANS[planId]) {
      return res.status(400).json({ error: "Plano de subscrição inválido." });
    }

    const plan = SERVER_PLANS[planId];
    const reference = `BANK-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const paymentId = `bank_${reference}`;

    const PaymentEngineModule = await import("../services/paymentEngine.service");
    
    await PaymentEngineModule.PaymentEngineService.recordPayment({
      paymentId,
      userId,
      provider: "bank_transfer",
      providerTransactionId: reference,
      planId,
      paymentType: "bank_transfer",
      amount: plan.amount,
      currency: (plan.currency || "USD").toUpperCase(),
      status: "pending",
      requiresReview: false,
      environment: process.env.NODE_ENV === "production" ? "production" : "sandbox",
      metadata: {
        instructionsReference: `REF-${reference}`,
        bankName: "Banco Angolano de Investimentos (BAI) / Millennium Atlântico",
        ibanProxy: "AO06.0000.0000.0000.0000.0"
      }
    });

    res.status(200).json({
      success: true,
      reference,
      paymentId,
      amount: plan.amount,
      currency: (plan.currency || "USD").toUpperCase(),
      status: "pending",
      message: "Instruções de transferência bancária geradas com sucesso. O pagamento ficará pendente até confirmação financeira."
    });
  } catch (error: any) {
    console.error("Error creating Bank Transfer Reference:", error);
    res.status(500).json({ error: "Erro ao gerar referência de transferência bancária." });
  }
});

export default router;
