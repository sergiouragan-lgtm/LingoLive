import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { PaymentEngineService, maskPhone } from "../services/paymentEngine.service";
import { SERVER_PLANS } from "../config/plans";
import { paymentsLimiter } from "../middleware/rateLimit";

const router = Router();

router.post("/create-multicaixa-reference", requireAuth, paymentsLimiter, async (req: any, res) => {
  console.log("Multicaixa request:", req.body);
  res.json({ reference: "123456789" });
});

router.post("/create-multicaixa-reference-v2", requireAuth, paymentsLimiter, async (req: any, res: any) => {
  try {
    const { planId, phone } = req.body;
    const userId = req.user.uid;

    if (!phone) {
      return res.status(400).json({ error: "Telemóvel é obrigatório para Multicaixa Express." });
    }

    if (planId && !SERVER_PLANS[planId]) {
      return res.status(400).json({ error: "Plano de subscrição inválido." });
    }

    let amountInAoa = 10000;
    let planName = "Plano Inicial";
    if (planId === "premium-plan" || planId === "monthly") {
      amountInAoa = 16915;
      planName = "Premium VIP";
    } else if (planId === "family-plan" || planId === "quarterly") {
      amountInAoa = 29665;
      planName = "Plano Familiar";
    } else if (planId && SERVER_PLANS[planId]) {
      amountInAoa = SERVER_PLANS[planId].amount;
      planName = SERVER_PLANS[planId].name || planId;
    }

    const reference = Math.floor(100000000 + Math.random() * 900000000).toString();
    const entity = "40251";
    const paymentId = `multicaixa_${reference}`;

    const masked = maskPhone(phone);

    await PaymentEngineService.recordPayment({
      paymentId,
      userId,
      provider: "multicaixa",
      providerTransactionId: reference,
      planId: planId || "monthly",
      paymentType: "multicaixa",
      amount: amountInAoa,
      currency: "AOA",
      status: "pending",
      requiresReview: false,
      environment: process.env.NODE_ENV === "production" ? "production" : "sandbox",
      metadata: {
        entity,
        phoneMasked: masked,
        planName
      }
    });

    res.status(200).json({
      entity,
      reference,
      amount: amountInAoa,
      currency: "AOA",
      status: "pending",
      phone: masked,
      message: "Referência gerada com sucesso! Aguardando confirmação no seu Multicaixa Express."
    });
  } catch (error: any) {
    console.error("Error creating Multicaixa Reference V2:", error);
    res.status(500).json({ error: "Erro ao gerar referência Multicaixa." });
  }
});

export default router;
