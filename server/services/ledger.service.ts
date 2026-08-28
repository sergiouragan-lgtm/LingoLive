import { dbAdmin } from "../config/firebaseAdmin";
import { getStripeClient } from "../config/stripe";
import { getMonetizationConfig } from "../config/monetization";
import { safeGetDoc } from "./firestoreSafe.service";

// Ver nota equivalente em stripe.service.ts / firestoreSafe.service.ts: evita
// chamadas reais e lentas ao Firestore durante testes automatizados.
const isRunningUnderTests = process.env.VITEST === "true" || process.env.NODE_ENV === "test";

export type WalletOwnerType = "STUDENT" | "TUTOR" | "PLATFORM";

export type LedgerReason =
  | "TOPUP_PADDLE"
  | "BOOKING_HOLD"
  | "BOOKING_RELEASE"
  | "BOOKING_SETTLE"
  | "REFUND_TO_STUDENT"
  | "TUTOR_PAYOUT_HOLD"
  | "TUTOR_PAYOUT_SETTLE"
  | "TUTOR_PAYOUT_FAILED"
  | "BONUS_GRANT"
  | "COIN_EXPIRY"
  | "ADMIN_ADJUSTMENT";

export interface Wallet {
  id: string;
  ownerId: string;
  ownerType: WalletOwnerType;
  balance: number;
  pendingHold: number;
  currency: "LC";
  status: "ACTIVE" | "FROZEN" | "CLOSED";
  kycStatus?: "NONE" | "PENDING" | "VERIFIED" | "REJECTED";
  stripeConnectAccountId?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface Hold {
  id: string;
  walletId: string;
  amount: number;
  bookingId: string;
  status: "ACTIVE" | "RELEASED" | "SETTLED" | "EXPIRED";
  expiresAt: string;
  createdAt: string;
}

export interface PayoutRequest {
  id: string;
  tutorWalletId: string;
  amountLc: number;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  stripeTransferId?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Wallets especiais fixas da plataforma (ver docs/LEDGER_LINGOCOINS_DESIGN.md secção 2.1)
export const PLATFORM_WALLET_IDS = {
  REVENUE: "wallet_platform_revenue",
  LIABILITY: "wallet_platform_liability",
  EXPIRED: "wallet_platform_expired",
} as const;

const WALLETS_COLLECTION = "wallets";
const LEDGER_ENTRIES_COLLECTION = "ledger_entries";
const HOLDS_COLLECTION = "holds";
const TRANSACTIONS_COLLECTION = "ledger_transactions";
const PAYOUT_REQUESTS_COLLECTION = "payout_requests";

export class InsufficientBalanceError extends Error {
  constructor(message = "Saldo insuficiente de LingoCoins.") {
    super(message);
    this.name = "InsufficientBalanceError";
  }
}

export class LedgerStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LedgerStateError";
  }
}

// --- Modo sandbox (testes/dev sem Firestore real) ---------------------------
// Espelha o padrão já usado em firestoreSafe.service.ts / paymentEngine.service.ts:
// mantém o comportamento correto (invariantes do double-entry) sem depender de
// rede, para que a suite de testes não fique bloqueada nem oculte regressões
// de lógica de negócio.
const sandboxWallets = new Map<string, Wallet>();
const sandboxHolds = new Map<string, Hold>();
const sandboxPayouts = new Map<string, PayoutRequest>();
let sandboxEntrySeq = 0;
let sandboxHoldSeq = 0;
let sandboxTxnSeq = 0;
let sandboxPayoutSeq = 0;

function nowIso() {
  return new Date().toISOString();
}

function useSandbox(): boolean {
  return !dbAdmin || isRunningUnderTests;
}

function walletIdFor(ownerId: string, ownerType: WalletOwnerType): string {
  if (ownerType === "PLATFORM") return ownerId; // ownerId já é o id fixo (ver PLATFORM_WALLET_IDS)
  return `${ownerType.toLowerCase()}_${ownerId}`;
}

function newWallet(walletId: string, ownerId: string, ownerType: WalletOwnerType): Wallet {
  const ts = nowIso();
  return {
    id: walletId,
    ownerId,
    ownerType,
    balance: 0,
    pendingHold: 0,
    currency: "LC",
    status: "ACTIVE",
    ...(ownerType === "TUTOR" ? { kycStatus: "NONE" as const } : {}),
    createdAt: ts,
    updatedAt: ts,
    version: 0,
  };
}

/**
 * Escreve N ledger_entries (double-entry) atomicamente e atualiza os saldos
 * das wallets envolvidas dentro da mesma transação Firestore.
 * `mutate` recebe o snapshot atual das wallets e devolve as entries a criar
 * mais os deltas de balance/pendingHold a aplicar — nunca escreve fora da tx.
 */
async function runLedgerTransaction<T>(
  walletIds: string[],
  mutate: (wallets: Record<string, Wallet>) => {
    entries: Array<Omit<LedgerEntryDoc, "id" | "balanceAfter" | "createdAt" | "transactionId">>;
    balanceDeltas: Record<string, { balance?: number; pendingHold?: number }>;
    transactionType: LedgerReason;
    result: T;
  }
): Promise<T> {
  if (useSandbox()) {
    return runLedgerTransactionSandbox(walletIds, mutate);
  }

  return dbAdmin.runTransaction(async (tx: any) => {
    const uniqueIds = Array.from(new Set(walletIds));
    const refs = uniqueIds.map((id) => dbAdmin.collection(WALLETS_COLLECTION).doc(id));
    const snaps = await Promise.all(refs.map((ref: any) => tx.get(ref)));

    const wallets: Record<string, Wallet> = {};
    snaps.forEach((snap: any, i: number) => {
      const id = uniqueIds[i];
      wallets[id] = snap.exists ? ({ id, ...(snap.data() as any) } as Wallet) : newWallet(id, id, "PLATFORM");
    });

    const { entries, balanceDeltas, transactionType, result } = mutate(wallets);

    const txnRef = dbAdmin.collection(TRANSACTIONS_COLLECTION).doc();
    const entryIds: string[] = [];
    const ts = nowIso();

    for (const entry of entries) {
      const wallet = wallets[entry.walletId];
      const delta = entry.direction === "CREDIT" ? entry.amount : -entry.amount;
      const balanceAfter = (wallet?.balance || 0) + (balanceDeltas[entry.walletId]?.balance !== undefined ? 0 : 0);
      const entryRef = dbAdmin.collection(LEDGER_ENTRIES_COLLECTION).doc();
      entryIds.push(entryRef.id);
      tx.set(entryRef, {
        ...entry,
        id: entryRef.id,
        transactionId: txnRef.id,
        balanceAfter: (wallet?.balance || 0) + delta,
        createdAt: ts,
      });
    }

    for (const [walletId, delta] of Object.entries(balanceDeltas)) {
      const ref = dbAdmin.collection(WALLETS_COLLECTION).doc(walletId);
      const current = wallets[walletId] || newWallet(walletId, walletId, "PLATFORM");
      const next: Wallet = {
        ...current,
        balance: current.balance + (delta.balance || 0),
        pendingHold: current.pendingHold + (delta.pendingHold || 0),
        updatedAt: ts,
        version: (current.version || 0) + 1,
      };
      tx.set(ref, next, { merge: true });
    }

    tx.set(txnRef, {
      id: txnRef.id,
      type: transactionType,
      status: "COMPLETED",
      entryIds,
      createdAt: ts,
    });

    return result;
  });
}

interface LedgerEntryDoc {
  id: string;
  transactionId: string;
  walletId: string;
  direction: "DEBIT" | "CREDIT";
  amount: number;
  balanceAfter: number;
  reason: LedgerReason;
  refType?: "BOOKING" | "TOPUP" | "PAYOUT" | "REFUND" | "ADJUSTMENT" | "EXPIRY";
  refId?: string;
  externalEventId?: string;
  createdAt: string;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

function runLedgerTransactionSandbox<T>(
  walletIds: string[],
  mutate: (wallets: Record<string, Wallet>) => {
    entries: Array<Omit<LedgerEntryDoc, "id" | "balanceAfter" | "createdAt" | "transactionId">>;
    balanceDeltas: Record<string, { balance?: number; pendingHold?: number }>;
    transactionType: LedgerReason;
    result: T;
  }
): T {
  const uniqueIds = Array.from(new Set(walletIds));
  const wallets: Record<string, Wallet> = {};
  uniqueIds.forEach((id) => {
    wallets[id] = sandboxWallets.get(id) || newWallet(id, id, "PLATFORM");
  });

  const { balanceDeltas, result } = mutate(wallets);

  for (const [walletId, delta] of Object.entries(balanceDeltas)) {
    const current = wallets[walletId] || sandboxWallets.get(walletId) || newWallet(walletId, walletId, "PLATFORM");
    const next: Wallet = {
      ...current,
      balance: current.balance + (delta.balance || 0),
      pendingHold: current.pendingHold + (delta.pendingHold || 0),
      updatedAt: nowIso(),
      version: (current.version || 0) + 1,
    };
    sandboxWallets.set(walletId, next);
  }

  sandboxEntrySeq += 1;
  sandboxTxnSeq += 1;
  return result;
}

// --- API pública -------------------------------------------------------------

export async function getOrCreateWallet(ownerId: string, ownerType: WalletOwnerType): Promise<Wallet> {
  const walletId = walletIdFor(ownerId, ownerType);

  if (useSandbox()) {
    let wallet = sandboxWallets.get(walletId);
    if (!wallet) {
      wallet = newWallet(walletId, ownerId, ownerType);
      sandboxWallets.set(walletId, wallet);
    }
    return wallet;
  }

  const snap = await safeGetDoc(WALLETS_COLLECTION, walletId);
  if (snap.exists) {
    return { id: walletId, ...(snap.data() as any) } as Wallet;
  }
  const wallet = newWallet(walletId, ownerId, ownerType);
  await dbAdmin.collection(WALLETS_COLLECTION).doc(walletId).set(wallet);
  return wallet;
}

export async function getWalletBalance(ownerId: string, ownerType: WalletOwnerType) {
  const wallet = await getOrCreateWallet(ownerId, ownerType);
  return {
    balance: wallet.balance,
    pendingHold: wallet.pendingHold,
    available: wallet.balance - wallet.pendingHold,
    currency: wallet.currency,
  };
}

/**
 * Fase 1 (dependência de Fase 2/3): credita LC numa wallet de aluno a partir
 * de um top-up fiat já confirmado (ex. webhook Paddle). Idempotente por
 * externalEventId — repetir a mesma chamada com o mesmo evento é um no-op.
 */
export async function creditTopup(params: {
  studentId: string;
  amountLc: number;
  externalEventId: string;
  createdBy?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ transactionId: string | null; alreadyProcessed: boolean }> {
  const { studentId, amountLc, externalEventId, createdBy = "system", metadata } = params;
  if (amountLc <= 0) throw new LedgerStateError("amountLc deve ser positivo.");

  const studentWalletId = walletIdFor(studentId, "STUDENT");

  // Idempotência: se já existe uma entry com este externalEventId, não duplicar.
  if (!useSandbox()) {
    const existing = await dbAdmin
      .collection(LEDGER_ENTRIES_COLLECTION)
      .where("externalEventId", "==", externalEventId)
      .limit(1)
      .get();
    if (!existing.empty) {
      return { transactionId: existing.docs[0].data().transactionId, alreadyProcessed: true };
    }
  }

  return runLedgerTransaction([studentWalletId, PLATFORM_WALLET_IDS.LIABILITY], (wallets) => ({
    transactionType: "TOPUP_PADDLE",
    entries: [
      {
        walletId: studentWalletId,
        direction: "CREDIT",
        amount: amountLc,
        reason: "TOPUP_PADDLE",
        refType: "TOPUP",
        refId: externalEventId,
        externalEventId,
        createdBy,
        metadata,
      },
      {
        walletId: PLATFORM_WALLET_IDS.LIABILITY,
        direction: "DEBIT",
        amount: amountLc,
        reason: "TOPUP_PADDLE",
        refType: "TOPUP",
        refId: externalEventId,
        externalEventId,
        createdBy,
        metadata,
      },
    ],
    balanceDeltas: {
      [studentWalletId]: { balance: amountLc },
      [PLATFORM_WALLET_IDS.LIABILITY]: { balance: -amountLc },
    },
    result: { transactionId: null as string | null, alreadyProcessed: false },
  })).then((r) => r);
}

/**
 * Fase 2 — Reserva LC do aluno ao confirmar a marcação de uma aula.
 * Não move saldo entre carteiras: só marca `pendingHold`, reduzindo o
 * disponível (`balance - pendingHold`) sem debitar a wallet ainda.
 */
export async function createBookingHold(params: {
  studentId: string;
  bookingId: string;
  amountLc: number;
  holdExpiryHours?: number;
}): Promise<Hold> {
  const { studentId, bookingId, amountLc, holdExpiryHours = getMonetizationConfig().holdExpiryHours } = params;
  if (amountLc <= 0) throw new LedgerStateError("amountLc deve ser positivo.");

  const studentWalletId = walletIdFor(studentId, "STUDENT");
  const expiresAt = new Date(Date.now() + holdExpiryHours * 3600 * 1000).toISOString();
  const holdId = useSandbox() ? `hold_sandbox_${++sandboxHoldSeq}` : dbAdmin.collection(HOLDS_COLLECTION).doc().id;

  return runLedgerTransaction([studentWalletId], (wallets) => {
    const wallet = wallets[studentWalletId];
    const available = wallet.balance - wallet.pendingHold;
    if (available < amountLc) {
      throw new InsufficientBalanceError();
    }

    const hold: Hold = {
      id: holdId,
      walletId: studentWalletId,
      amount: amountLc,
      bookingId,
      status: "ACTIVE",
      expiresAt,
      createdAt: nowIso(),
    };

    return {
      transactionType: "BOOKING_HOLD",
      entries: [
        {
          walletId: studentWalletId,
          direction: "DEBIT",
          amount: 0, // informativo: hold não move saldo real, só reserva
          reason: "BOOKING_HOLD",
          refType: "BOOKING",
          refId: bookingId,
          createdBy: studentId,
          metadata: { holdId, amountLc },
        },
      ],
      balanceDeltas: {
        [studentWalletId]: { pendingHold: amountLc },
      },
      result: hold,
    };
  }).then(async (hold) => {
    if (useSandbox()) {
      sandboxHolds.set(hold.id, hold);
    } else {
      await dbAdmin.collection(HOLDS_COLLECTION).doc(hold.id).set(hold);
    }
    return hold;
  });
}

async function getHold(holdId: string): Promise<Hold | null> {
  if (useSandbox()) return sandboxHolds.get(holdId) || null;
  const snap = await safeGetDoc(HOLDS_COLLECTION, holdId);
  return snap.exists ? ({ id: holdId, ...(snap.data() as any) } as Hold) : null;
}

async function saveHold(hold: Hold): Promise<void> {
  if (useSandbox()) {
    sandboxHolds.set(hold.id, hold);
    return;
  }
  await dbAdmin.collection(HOLDS_COLLECTION).doc(hold.id).set(hold, { merge: true });
}

/**
 * Liberta um hold sem consumo (aula cancelada antes de confirmar, ou
 * expirado automaticamente). LC nunca saíram da wallet — só a reserva
 * (`pendingHold`) é revertida.
 */
export async function releaseBookingHold(holdId: string, opts: { autoExpired?: boolean } = {}): Promise<Hold> {
  const hold = await getHold(holdId);
  if (!hold) throw new LedgerStateError(`Hold ${holdId} não encontrado.`);
  if (hold.status !== "ACTIVE") return hold; // idempotente

  const nextStatus = opts.autoExpired ? "EXPIRED" : "RELEASED";

  await runLedgerTransaction([hold.walletId], () => ({
    transactionType: "BOOKING_RELEASE",
    entries: [
      {
        walletId: hold.walletId,
        direction: "CREDIT",
        amount: 0,
        reason: "BOOKING_RELEASE",
        refType: "BOOKING",
        refId: hold.bookingId,
        createdBy: "system",
        metadata: { holdId, autoExpired: !!opts.autoExpired },
      },
    ],
    balanceDeltas: {
      [hold.walletId]: { pendingHold: -hold.amount },
    },
    result: null,
  }));

  const updated: Hold = { ...hold, status: nextStatus };
  await saveHold(updated);
  return updated;
}

/**
 * Fase 2 — Confirma a aula: debita o aluno, credita o tutor (menos comissão),
 * credita a comissão à wallet de receita da plataforma. Fecha o hold.
 */
export async function settleBooking(params: {
  holdId: string;
  tutorId: string;
  commissionRate?: number;
}): Promise<{ platformFee: number; tutorAmount: number }> {
  const { holdId, tutorId, commissionRate = getMonetizationConfig().commissionRate } = params;
  const hold = await getHold(holdId);
  if (!hold) throw new LedgerStateError(`Hold ${holdId} não encontrado.`);
  if (hold.status !== "ACTIVE") {
    throw new LedgerStateError(`Hold ${holdId} não está ACTIVE (estado atual: ${hold.status}).`);
  }

  const tutorWalletId = walletIdFor(tutorId, "TUTOR");
  const platformFee = Math.round(hold.amount * commissionRate);
  const tutorAmount = hold.amount - platformFee;

  const result = await runLedgerTransaction(
    [hold.walletId, tutorWalletId, PLATFORM_WALLET_IDS.REVENUE],
    () => ({
      transactionType: "BOOKING_SETTLE",
      entries: [
        {
          walletId: hold.walletId,
          direction: "DEBIT",
          amount: hold.amount,
          reason: "BOOKING_SETTLE",
          refType: "BOOKING",
          refId: hold.bookingId,
          createdBy: "system",
          metadata: { holdId, tutorId },
        },
        {
          walletId: tutorWalletId,
          direction: "CREDIT",
          amount: tutorAmount,
          reason: "BOOKING_SETTLE",
          refType: "BOOKING",
          refId: hold.bookingId,
          createdBy: "system",
          metadata: { holdId, platformFee },
        },
        {
          walletId: PLATFORM_WALLET_IDS.REVENUE,
          direction: "CREDIT",
          amount: platformFee,
          reason: "BOOKING_SETTLE",
          refType: "BOOKING",
          refId: hold.bookingId,
          createdBy: "system",
          metadata: { holdId, tutorId },
        },
      ],
      balanceDeltas: {
        [hold.walletId]: { balance: -hold.amount, pendingHold: -hold.amount },
        [tutorWalletId]: { balance: tutorAmount },
        [PLATFORM_WALLET_IDS.REVENUE]: { balance: platformFee },
      },
      result: { platformFee, tutorAmount },
    })
  );

  await saveHold({ ...hold, status: "SETTLED" });
  return result;
}

/**
 * Cron/job periódico (ver docs/LEDGER_LINGOCOINS_DESIGN.md 3.5): liberta
 * automaticamente holds ativos cujo prazo expirou sem a aula ter sido
 * confirmada.
 */
export async function expireStaleHolds(): Promise<{ expired: number }> {
  const nowTs = Date.now();
  let expired = 0;

  if (useSandbox()) {
    for (const hold of sandboxHolds.values()) {
      if (hold.status === "ACTIVE" && new Date(hold.expiresAt).getTime() < nowTs) {
        await releaseBookingHold(hold.id, { autoExpired: true });
        expired += 1;
      }
    }
    return { expired };
  }

  const staleSnap = await dbAdmin
    .collection(HOLDS_COLLECTION)
    .where("status", "==", "ACTIVE")
    .where("expiresAt", "<", new Date(nowTs).toISOString())
    .get();

  for (const doc of staleSnap.docs) {
    await releaseBookingHold(doc.id, { autoExpired: true });
    expired += 1;
  }
  return { expired };
}

// --- Fase 3 — Payout de tutores via Stripe Connect --------------------------

export async function createTutorStripeConnectAccount(tutorId: string, email: string): Promise<{ accountId: string; onboardingUrl: string }> {
  const stripe = getStripeClient();
  if (!stripe) throw new Error("Stripe não está configurado neste ambiente.");

  const wallet = await getOrCreateWallet(tutorId, "TUTOR");
  let accountId = wallet.stripeConnectAccountId;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email,
      capabilities: { transfers: { requested: true } },
      metadata: { tutorId, lingoliveWalletId: wallet.id },
    });
    accountId = account.id;

    if (useSandbox()) {
      sandboxWallets.set(wallet.id, { ...wallet, stripeConnectAccountId: accountId, kycStatus: "PENDING" });
    } else {
      await dbAdmin.collection(WALLETS_COLLECTION).doc(wallet.id).set(
        { stripeConnectAccountId: accountId, kycStatus: "PENDING", updatedAt: nowIso() },
        { merge: true }
      );
    }
  }

  const { appBaseUrl } = await import("../config/env");
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appBaseUrl}/tutor/payouts/onboarding-refresh`,
    return_url: `${appBaseUrl}/tutor/payouts/onboarding-complete`,
    type: "account_onboarding",
  });

  return { accountId: accountId as string, onboardingUrl: link.url };
}

export async function markTutorKycVerified(tutorId: string): Promise<void> {
  const wallet = await getOrCreateWallet(tutorId, "TUTOR");
  if (useSandbox()) {
    sandboxWallets.set(wallet.id, { ...wallet, kycStatus: "VERIFIED" });
    return;
  }
  await dbAdmin.collection(WALLETS_COLLECTION).doc(wallet.id).set({ kycStatus: "VERIFIED", updatedAt: nowIso() }, { merge: true });
}

/**
 * Tutor pede levantamento. LC saem já da wallet do tutor (hold), mas o
 * passivo da plataforma reabre até a transferência Stripe ser confirmada
 * (ver TUTOR_PAYOUT_SETTLE / TUTOR_PAYOUT_FAILED).
 */
export async function requestTutorPayout(params: {
  tutorId: string;
  amountLc: number;
  /** Sobrepõe a taxa de saída configurada (LC por unidade monetária). Opcional. */
  lcToFiatRate?: number;
  payoutFeeFixedLc?: number;
  minPayoutAmountLc?: number;
}): Promise<PayoutRequest> {
  const config = getMonetizationConfig();
  const {
    tutorId,
    amountLc,
    lcToFiatRate = config.lcToFiatRate,
    payoutFeeFixedLc = config.payoutFeeFixedLc,
    minPayoutAmountLc = config.minPayoutAmountLc,
  } = params;

  if (amountLc < minPayoutAmountLc) {
    throw new LedgerStateError(`Valor abaixo do mínimo de levantamento (${minPayoutAmountLc} LC).`);
  }

  const wallet = await getOrCreateWallet(tutorId, "TUTOR");
  if (wallet.kycStatus !== "VERIFIED" || !wallet.stripeConnectAccountId) {
    throw new LedgerStateError("Tutor sem verificação KYC/Stripe Connect concluída — payout não permitido.");
  }

  const netAmountLc = amountLc - payoutFeeFixedLc;
  if (netAmountLc <= 0) throw new LedgerStateError("Valor líquido após taxa de payout é inválido.");

  const payoutId = useSandbox() ? `payout_sandbox_${++sandboxPayoutSeq}` : dbAdmin.collection(PAYOUT_REQUESTS_COLLECTION).doc().id;

  await runLedgerTransaction([wallet.id, PLATFORM_WALLET_IDS.LIABILITY, PLATFORM_WALLET_IDS.REVENUE], (wallets) => {
    const w = wallets[wallet.id];
    const available = w.balance - w.pendingHold;
    if (available < amountLc) throw new InsufficientBalanceError();

    return {
      transactionType: "TUTOR_PAYOUT_HOLD",
      entries: [
        {
          walletId: wallet.id,
          direction: "DEBIT",
          amount: amountLc,
          reason: "TUTOR_PAYOUT_HOLD",
          refType: "PAYOUT",
          refId: payoutId,
          createdBy: tutorId,
        },
        {
          walletId: PLATFORM_WALLET_IDS.LIABILITY,
          direction: "CREDIT",
          amount: netAmountLc,
          reason: "TUTOR_PAYOUT_HOLD",
          refType: "PAYOUT",
          refId: payoutId,
          createdBy: tutorId,
        },
        ...(payoutFeeFixedLc > 0
          ? [
              {
                walletId: PLATFORM_WALLET_IDS.REVENUE,
                direction: "CREDIT" as const,
                amount: payoutFeeFixedLc,
                reason: "TUTOR_PAYOUT_HOLD" as LedgerReason,
                refType: "PAYOUT" as const,
                refId: payoutId,
                createdBy: tutorId,
              },
            ]
          : []),
      ],
      balanceDeltas: {
        [wallet.id]: { balance: -amountLc },
        [PLATFORM_WALLET_IDS.LIABILITY]: { balance: netAmountLc },
        [PLATFORM_WALLET_IDS.REVENUE]: { balance: payoutFeeFixedLc },
      },
      result: null,
    };
  });

  const payoutRequest: PayoutRequest = {
    id: payoutId,
    tutorWalletId: wallet.id,
    amountLc,
    status: "PROCESSING",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  if (useSandbox()) {
    sandboxPayouts.set(payoutId, payoutRequest);
  } else {
    await dbAdmin.collection(PAYOUT_REQUESTS_COLLECTION).doc(payoutId).set(payoutRequest);
  }

  // Dispara a transferência real no Stripe Connect. O valor fiat é calculado
  // a partir da taxa de saída configurada (config/monetization, ver design doc).
  const stripe = getStripeClient();
  if (stripe && !useSandbox()) {
    const fiatAmountCents = Math.round((netAmountLc / lcToFiatRate) * 100);
    try {
      const transfer = await stripe.transfers.create({
        amount: fiatAmountCents,
        currency: "eur",
        destination: wallet.stripeConnectAccountId!,
        metadata: { payoutRequestId: payoutId, tutorId },
      });
      await dbAdmin
        .collection(PAYOUT_REQUESTS_COLLECTION)
        .doc(payoutId)
        .set({ stripeTransferId: transfer.id, updatedAt: nowIso() }, { merge: true });
    } catch (err: any) {
      await failTutorPayout(payoutId, err.message || "Erro ao criar transferência Stripe.");
      throw err;
    }
  }

  return payoutRequest;
}

async function getPayoutRequest(payoutId: string): Promise<PayoutRequest | null> {
  if (useSandbox()) return sandboxPayouts.get(payoutId) || null;
  const snap = await safeGetDoc(PAYOUT_REQUESTS_COLLECTION, payoutId);
  return snap.exists ? ({ id: payoutId, ...(snap.data() as any) } as PayoutRequest) : null;
}

/**
 * Chamado pelo webhook Stripe `transfer.paid` (ou equivalente de sucesso
 * confirmado do lado do Connect). Fecha o passivo — o dinheiro saiu de facto.
 */
export async function confirmTutorPayout(payoutId: string): Promise<PayoutRequest> {
  const payout = await getPayoutRequest(payoutId);
  if (!payout) throw new LedgerStateError(`Payout ${payoutId} não encontrado.`);
  if (payout.status !== "PROCESSING") return payout; // idempotente

  await runLedgerTransaction([PLATFORM_WALLET_IDS.LIABILITY], () => ({
    transactionType: "TUTOR_PAYOUT_SETTLE",
    entries: [
      {
        walletId: PLATFORM_WALLET_IDS.LIABILITY,
        direction: "DEBIT",
        amount: payout.amountLc,
        reason: "TUTOR_PAYOUT_SETTLE",
        refType: "PAYOUT",
        refId: payoutId,
        createdBy: "system",
      },
    ],
    balanceDeltas: {
      [PLATFORM_WALLET_IDS.LIABILITY]: { balance: -payout.amountLc },
    },
    result: null,
  }));

  const updated: PayoutRequest = { ...payout, status: "COMPLETED", updatedAt: nowIso() };
  if (useSandbox()) sandboxPayouts.set(payoutId, updated);
  else await dbAdmin.collection(PAYOUT_REQUESTS_COLLECTION).doc(payoutId).set(updated, { merge: true });
  return updated;
}

/**
 * Chamado pelo webhook Stripe em caso de falha da transferência (ou
 * diretamente por requestTutorPayout se o Stripe rejeitar de imediato).
 * Reverte o LC para a wallet do tutor.
 */
export async function failTutorPayout(payoutId: string, reason: string): Promise<PayoutRequest> {
  const payout = await getPayoutRequest(payoutId);
  if (!payout) throw new LedgerStateError(`Payout ${payoutId} não encontrado.`);
  if (payout.status !== "PROCESSING") return payout; // idempotente

  await runLedgerTransaction([payout.tutorWalletId, PLATFORM_WALLET_IDS.LIABILITY], () => ({
    transactionType: "TUTOR_PAYOUT_FAILED",
    entries: [
      {
        walletId: payout.tutorWalletId,
        direction: "CREDIT",
        amount: payout.amountLc,
        reason: "TUTOR_PAYOUT_FAILED",
        refType: "PAYOUT",
        refId: payoutId,
        createdBy: "system",
        metadata: { reason },
      },
      {
        walletId: PLATFORM_WALLET_IDS.LIABILITY,
        direction: "DEBIT",
        amount: payout.amountLc,
        reason: "TUTOR_PAYOUT_FAILED",
        refType: "PAYOUT",
        refId: payoutId,
        createdBy: "system",
        metadata: { reason },
      },
    ],
    balanceDeltas: {
      [payout.tutorWalletId]: { balance: payout.amountLc },
      [PLATFORM_WALLET_IDS.LIABILITY]: { balance: -payout.amountLc },
    },
    result: null,
  }));

  const updated: PayoutRequest = { ...payout, status: "FAILED", failureReason: reason, updatedAt: nowIso() };
  if (useSandbox()) sandboxPayouts.set(payoutId, updated);
  else await dbAdmin.collection(PAYOUT_REQUESTS_COLLECTION).doc(payoutId).set(updated, { merge: true });
  return updated;
}

// Exposto só para testes: limpa o estado em memória entre casos de teste.
export function __resetSandboxStateForTests() {
  sandboxWallets.clear();
  sandboxHolds.clear();
  sandboxPayouts.clear();
  sandboxEntrySeq = 0;
  sandboxHoldSeq = 0;
  sandboxTxnSeq = 0;
  sandboxPayoutSeq = 0;
}
