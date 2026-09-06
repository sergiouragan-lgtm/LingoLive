import express, { Router } from "express";
import crypto from "crypto";
import { requireAuth } from "../middleware/requireAuth";
import { paymentsLimiter } from "../middleware/rateLimit";
import { getMonetizationConfig } from "../config/monetization";
import {
  getWalletBalance,
  createBookingHold,
  settleBooking,
  releaseBookingHold,
  expireStaleHolds,
  createTutorStripeConnectAccount,
  requestTutorPayout,
  creditTopup,
  InsufficientBalanceError,
  LedgerStateError,
} from "../services/ledger.service";

const router = Router();

/**
 * Valida a assinatura do webhook Paddle Billing (header `paddle-signature`,
 * formato `ts=<epoch>;h1=<hmac-sha256 hex>` sobre `${ts}:${rawBody}`).
 * Ver https://developer.paddle.com/webhooks/signature-verification
 */
function verifyPaddleSignature(rawBody: Buffer, signatureHeader: string | undefined, secret: string): boolean {
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(";").map((p) => {
      const [k, v] = p.split("=");
      return [k, v];
    })
  );
  const { ts, h1 } = parts as { ts?: string; h1?: string };
  if (!ts || !h1) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${ts}:${rawBody.toString("utf8")}`).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(h1, "hex"));
  } catch {
    return false;
  }
}

/**
 * POST /api/wallet/topup/paddle-webhook
 * Fase 1 do plano de monetização: aluno compra LingoCoins via Paddle
 * (venda B2C direta de créditos, fora do modelo de marketplace que o
 * Paddle recusa). Este endpoint credita o LC correspondente na wallet do
 * aluno assim que o Paddle confirma o pagamento.
 *
 * NOTA: assinatura verificada com PADDLE_WEBHOOK_SECRET (ver
 * verifyPaddleSignature acima). Requer configuração real do produto/preços
 * no Paddle e mapeamento priceId → amountLc antes de ir para produção —
 * ver docs/LEDGER_LINGOCOINS_DESIGN.md secção 3.1.
 */
router.post("/wallet/topup/paddle-webhook", express.raw({ type: "*/*" }), async (req: any, res: any) => {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("PADDLE_WEBHOOK_SECRET não está configurado no ambiente.");
    return res.status(500).json({ error: "Paddle webhook secret is missing" });
  }

  const signature = req.headers["paddle-signature"];
  if (!verifyPaddleSignature(req.body, signature, secret)) {
    return res.status(400).json({ error: "Assinatura Paddle inválida." });
  }

  let event: any;
  try {
    event = JSON.parse(req.body.toString("utf8"));
  } catch {
    return res.status(400).json({ error: "Payload inválido." });
  }

  try {
    if (event.event_type === "transaction.completed" || event.event_type === "transaction.paid") {
      const data = event.data || {};
      const studentId = data.custom_data?.userId;
      const amountLc = Number(data.custom_data?.amountLc);
      if (!studentId || !amountLc || amountLc <= 0) {
        console.warn("[Paddle Webhook] Evento sem userId/amountLc em custom_data.", { eventId: event.event_id });
        return res.status(200).json({ received: true, warning: "missing_custom_data" });
      }
      await creditTopup({
        studentId,
        amountLc,
        externalEventId: event.event_id || data.id,
        metadata: { paddleTransactionId: data.id },
      });
    }
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("[Paddle Webhook Error]:", error);
    res.status(500).json({ error: "Erro interno ao processar o webhook Paddle." });
  }
});

function handleLedgerError(res: any, error: any) {
  if (error instanceof InsufficientBalanceError) {
    return res.status(422).json({ error: error.message, code: "INSUFFICIENT_BALANCE" });
  }
  if (error instanceof LedgerStateError) {
    return res.status(409).json({ error: error.message, code: "LEDGER_STATE_ERROR" });
  }
  console.error("[Wallet Route Error]:", error);
  return res.status(500).json({ error: "Erro interno ao processar a carteira." });
}

/**
 * GET /api/wallet/balance
 * Saldo da carteira LingoCoins do utilizador autenticado (aluno ou tutor).
 */
router.get("/wallet/balance", requireAuth, async (req: any, res: any) => {
  try {
    const ownerType = req.query.role === "tutor" ? "TUTOR" : "STUDENT";
    const balance = await getWalletBalance(req.user.uid, ownerType);
    res.json(balance);
  } catch (error: any) {
    handleLedgerError(res, error);
  }
});

/**
 * POST /api/wallet/bookings/:bookingId/hold
 * Reserva LC do aluno ao confirmar a marcação de uma aula. Body: { amountLc }
 */
router.post("/wallet/bookings/:bookingId/hold", express.json(), requireAuth, paymentsLimiter, async (req: any, res: any) => {
  try {
    const { amountLc } = req.body || {};
    if (!amountLc || amountLc <= 0) {
      return res.status(400).json({ error: "amountLc é obrigatório e deve ser positivo." });
    }
    const hold = await createBookingHold({
      studentId: req.user.uid,
      bookingId: req.params.bookingId,
      amountLc,
    });
    res.status(201).json(hold);
  } catch (error: any) {
    handleLedgerError(res, error);
  }
});

/**
 * POST /api/wallet/holds/:holdId/release
 * Liberta um hold ativo sem consumo (ex. aula cancelada antes de confirmar).
 */
router.post("/wallet/holds/:holdId/release", express.json(), requireAuth, paymentsLimiter, async (req: any, res: any) => {
  try {
    const hold = await releaseBookingHold(req.params.holdId);
    res.json(hold);
  } catch (error: any) {
    handleLedgerError(res, error);
  }
});

/**
 * POST /api/wallet/holds/:holdId/settle
 * Confirma a prestação da aula: debita o aluno, credita o tutor e a
 * comissão da plataforma. Endpoint interno/administrativo — chamado pelo
 * fluxo de confirmação de aula, não diretamente pelo cliente do aluno.
 */
router.post("/wallet/holds/:holdId/settle", express.json(), requireAuth, paymentsLimiter, async (req: any, res: any) => {
  try {
    const { tutorId, commissionRate } = req.body || {};
    if (!tutorId) {
      return res.status(400).json({ error: "tutorId é obrigatório." });
    }
    const result = await settleBooking({ holdId: req.params.holdId, tutorId, commissionRate });
    res.json(result);
  } catch (error: any) {
    handleLedgerError(res, error);
  }
});

/**
 * POST /api/wallet/holds/expire-stale
 * Ponto de entrada para o cron/scheduler que liberta holds cujo prazo
 * expirou sem confirmação da aula (ver docs/LEDGER_LINGOCOINS_DESIGN.md 3.5).
 * Protegido por chave partilhada do scheduler, não por sessão de utilizador.
 */
router.post("/wallet/holds/expire-stale", express.json(), async (req: any, res: any) => {
  const schedulerKey = req.headers["x-scheduler-key"];
  if (!process.env.SCHEDULER_SHARED_KEY || schedulerKey !== process.env.SCHEDULER_SHARED_KEY) {
    return res.status(401).json({ error: "Não autorizado." });
  }
  try {
    const result = await expireStaleHolds();
    res.json(result);
  } catch (error: any) {
    handleLedgerError(res, error);
  }
});

/**
 * POST /api/wallet/tutor/connect-onboarding
 * Cria (ou reutiliza) a conta Stripe Connect Express do tutor e devolve o
 * link de onboarding/KYC a apresentar na app.
 */
router.post("/wallet/tutor/connect-onboarding", express.json(), requireAuth, paymentsLimiter, async (req: any, res: any) => {
  try {
    const email = req.user.email || req.body?.email;
    if (!email) {
      return res.status(400).json({ error: "Email do tutor é necessário para o onboarding Stripe Connect." });
    }
    const result = await createTutorStripeConnectAccount(req.user.uid, email);
    res.json(result);
  } catch (error: any) {
    handleLedgerError(res, error);
  }
});

/**
 * POST /api/wallet/tutor/payout
 * Pedido de levantamento de saldo LC do tutor, convertido e transferido via
 * Stripe Connect. Body: { amountLc, lcToFiatRate }
 */
router.post("/wallet/tutor/payout", express.json(), requireAuth, paymentsLimiter, async (req: any, res: any) => {
  try {
    const { amountLc, lcToFiatRate, payoutFeeFixedLc, minPayoutAmountLc } = req.body || {};
    if (!amountLc || amountLc <= 0) {
      return res.status(400).json({ error: "amountLc é obrigatório e deve ser positivo." });
    }
    const payout = await requestTutorPayout({
      tutorId: req.user.uid,
      amountLc,
      lcToFiatRate,
      payoutFeeFixedLc,
      minPayoutAmountLc,
    });
    res.status(202).json(payout);
  } catch (error: any) {
    handleLedgerError(res, error);
  }
});

export default router;
