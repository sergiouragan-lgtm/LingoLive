/**
 * Algoritmo de repetição espaçada SM-2 executado no servidor.
 *
 * O cliente mobile envia apenas a qualidade da resposta (0..5). Intervalos,
 * fator de facilidade e data da próxima revisão são sempre calculados aqui,
 * para que web e mobile partilhem exactamente o mesmo agendamento.
 */
export interface SrsState {
  easeFactor: number;
  interval: number;
  repetitionCount: number;
}

export interface SrsResult extends SrsState {
  nextReviewAt: string;
  lapsed: boolean;
}

export const DEFAULT_EASE_FACTOR = 2.5;
export const MIN_EASE_FACTOR = 1.3;

export function normalizeQuality(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(5, Math.round(parsed)));
}

export function reviewCard(state: Partial<SrsState>, quality: number, now = new Date()): SrsResult {
  const q = normalizeQuality(quality);
  const previousEase = Number.isFinite(Number(state.easeFactor))
    ? Number(state.easeFactor) : DEFAULT_EASE_FACTOR;
  const previousInterval = Number.isFinite(Number(state.interval)) ? Number(state.interval) : 0;
  const previousRepetitions = Number.isFinite(Number(state.repetitionCount))
    ? Number(state.repetitionCount) : 0;

  const easeFactor = Math.max(
    MIN_EASE_FACTOR,
    previousEase + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  );

  let repetitionCount: number;
  let interval: number;
  const lapsed = q < 3;

  if (lapsed) {
    // Resposta falhada: a carta volta ao início do ciclo e é revista amanhã.
    repetitionCount = 0;
    interval = 1;
  } else {
    repetitionCount = previousRepetitions + 1;
    if (repetitionCount === 1) interval = 1;
    else if (repetitionCount === 2) interval = 6;
    else interval = Math.round(Math.max(1, previousInterval) * easeFactor);
  }

  const nextReview = new Date(now.getTime());
  nextReview.setUTCDate(nextReview.getUTCDate() + interval);

  return {
    easeFactor: Math.round(easeFactor * 1000) / 1000,
    interval,
    repetitionCount,
    nextReviewAt: nextReview.toISOString(),
    lapsed,
  };
}

/** Converte a qualidade SM-2 (0..5) numa percentagem de desempenho (0..100). */
export function qualityToScore(quality: number): number {
  return Math.round((normalizeQuality(quality) / 5) * 100);
}
