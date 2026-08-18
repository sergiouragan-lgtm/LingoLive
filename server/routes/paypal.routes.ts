import { Router } from "express";
import { PaypalService } from "../services/paypal.service";
import { requireAuth } from "../middleware/requireAuth";
import { paymentsLimiter } from "../middleware/rateLimit";
import { SERVER_PLANS } from "../config/plans";

const router = Router();

router.post("/create-order", requireAuth, paymentsLimiter, async (req: any, res: any) => {
  const { planId } = req.body;
  const userId = req.user.uid;

  if (!planId) {
    return res.status(400).json({ error: "planId é obrigatório" });
  }

  let normalizedPlanId = planId;
  if (planId === "trial-starter") normalizedPlanId = "trial_starter";
  else if (planId === "premium-plan") normalizedPlanId = "monthly";
  else if (planId === "family-plan") normalizedPlanId = "quarterly";

  if (!SERVER_PLANS[normalizedPlanId]) {
    return res.status(400).json({ error: "Plano de subscrição inválido." });
  }

  try {
    const orderData = await PaypalService.createOrder(userId, planId);
    res.json(orderData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/capture-order", requireAuth, paymentsLimiter, async (req: any, res: any) => {
  const { orderId } = req.body;
  const userId = req.user.uid;

  if (!orderId) {
    return res.status(400).json({ error: "orderId é obrigatório" });
  }

  try {
    const captureResult = await PaypalService.captureOrder(userId, orderId);
    res.json({
      success: true,
      message: "Pagamento capturado com sucesso",
      subscriptionStatus: captureResult.subscriptionStatus,
      paymentRecord: captureResult.paymentRecord
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/webhook", async (req: any, res: any) => {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!webhookId || !clientId || !clientSecret) {
    console.error("Credenciais do webhook PayPal ausentes.");
    return res.status(500).json({ error: "Configuração do PayPal incompleta." });
  }

  const transmissionId = req.headers["paypal-transmission-id"] || req.headers["PAYPAL-TRANSMISSION-ID"];
  const transmissionTime = req.headers["paypal-transmission-time"] || req.headers["PAYPAL-TRANSMISSION-TIME"];
  const certUrl = req.headers["paypal-cert-url"] || req.headers["PAYPAL-CERT-URL"];
  const authAlgo = req.headers["paypal-auth-algo"] || req.headers["PAYPAL-AUTH-ALGO"];
  const transmissionSig = req.headers["paypal-transmission-sig"] || req.headers["PAYPAL-TRANSMISSION-SIG"];

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return res.status(400).json({ error: "Cabeçalhos oficiais da assinatura PayPal ausentes" });
  }

  try {
    const isValid = await PaypalService.verifyWebhookSignature(req.body, req.headers);
    if (!isValid) {
      return res.status(400).json({ error: "Assinatura do webhook PayPal inválida" });
    }
    const result = await PaypalService.handleWebhookEvent(req.body, req.headers);
    res.json(result);
  } catch (error: any) {
    console.error("Erro no processamento do webhook do PayPal:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
