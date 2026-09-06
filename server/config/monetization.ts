// Configuração de negócio do sistema de LingoCoins (moeda interna).
// Ver docs/LEDGER_LINGOCOINS_DESIGN.md, secção 4 — nunca hardcode taxas
// dentro dos serviços; tudo o que envolve dinheiro real lê deste módulo.
//
// TODO (produto/financeiro): mover para um documento Firestore
// (`config/monetization`) editável por admin, com histórico de alterações,
// assim que o painel de administração existir. Por agora, variáveis de
// ambiente com fallback para os valores acordados no plano de monetização.

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export interface MonetizationConfig {
  /** Quantos LC por unidade monetária num top-up (ex.: 100 → 1€ = 100 LC). */
  fiatToLcRate: number;
  /** Quantos LC por unidade monetária num payout de tutor (pode ter spread vs. entrada). */
  lcToFiatRate: number;
  /** Percentagem retida pela plataforma em cada aula liquidada (0-1). */
  commissionRate: number;
  /** Horas até um hold de reserva de aula expirar automaticamente. */
  holdExpiryHours: number;
  /** Meses de validade de LC comprados antes de caducarem (ver T&Cs). */
  coinValidityMonths: number;
  /** Valor mínimo de levantamento, em LC. */
  minPayoutAmountLc: number;
  /** Taxa fixa cobrada por pedido de payout, em LC. */
  payoutFeeFixedLc: number;
}

export function getMonetizationConfig(): MonetizationConfig {
  return {
    fiatToLcRate: envNumber("LC_FIAT_TO_LC_RATE", 100),
    lcToFiatRate: envNumber("LC_TO_FIAT_RATE", 100),
    commissionRate: envNumber("LC_COMMISSION_RATE", 0.18),
    holdExpiryHours: envNumber("LC_HOLD_EXPIRY_HOURS", 48),
    coinValidityMonths: envNumber("LC_COIN_VALIDITY_MONTHS", 24),
    minPayoutAmountLc: envNumber("LC_MIN_PAYOUT_AMOUNT_LC", 2000),
    payoutFeeFixedLc: envNumber("LC_PAYOUT_FEE_FIXED_LC", 50),
  };
}
