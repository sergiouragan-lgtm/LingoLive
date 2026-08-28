import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { paymentsLimiter } from "../middleware/rateLimit";
import {
  getWalletBalance,
  createBookingHold,
  settleBooking,
  releaseBookingHold,
  expireStaleHolds,
  createTutorStripeConnectAccount,
  requestTutorPayout,
  InsufficientBalanceError,
  LedgerStateError,
} from "../services/ledger.service";

const router = Router();

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
router.post("/wallet/bookings/:bookingId/hold", requireAuth, paymentsLimiter, async (req: any, res: any) => {
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
router.post("/wallet/holds/:holdId/release", requireAuth, paymentsLimiter, async (req: any, res: any) => {
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
router.post("/wallet/holds/:holdId/settle", requireAuth, paymentsLimiter, async (req: any, res: any) => {
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
router.post("/wallet/holds/expire-stale", async (req: any, res: any) => {
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
router.post("/wallet/tutor/connect-onboarding", requireAuth, paymentsLimiter, async (req: any, res: any) => {
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
router.post("/wallet/tutor/payout", requireAuth, paymentsLimiter, async (req: any, res: any) => {
  try {
    const { amountLc, lcToFiatRate, payoutFeeFixedLc, minPayoutAmountLc } = req.body || {};
    if (!amountLc || amountLc <= 0 || !lcToFiatRate || lcToFiatRate <= 0) {
      return res.status(400).json({ error: "amountLc e lcToFiatRate são obrigatórios e devem ser positivos." });
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
