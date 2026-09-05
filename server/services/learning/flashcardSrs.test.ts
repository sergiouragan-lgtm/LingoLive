import { describe, expect, it } from "vitest";
import { DEFAULT_EASE_FACTOR, MIN_EASE_FACTOR, normalizeQuality, qualityToScore, reviewCard } from "./flashcardSrs.service";

const NOW = new Date("2026-01-01T00:00:00.000Z");

describe("SM-2 no servidor", () => {
  it("agenda a primeira revisão bem-sucedida para o dia seguinte", () => {
    const result = reviewCard({}, 5, NOW);
    expect(result.repetitionCount).toBe(1);
    expect(result.interval).toBe(1);
    expect(result.nextReviewAt).toBe("2026-01-02T00:00:00.000Z");
    expect(result.lapsed).toBe(false);
  });

  it("usa seis dias na segunda repetição consecutiva", () => {
    const result = reviewCard({ repetitionCount: 1, interval: 1, easeFactor: DEFAULT_EASE_FACTOR }, 4, NOW);
    expect(result.repetitionCount).toBe(2);
    expect(result.interval).toBe(6);
  });

  it("multiplica o intervalo pelo fator de facilidade a partir da terceira", () => {
    const result = reviewCard({ repetitionCount: 2, interval: 6, easeFactor: 2.5 }, 5, NOW);
    expect(result.repetitionCount).toBe(3);
    expect(result.interval).toBe(Math.round(6 * result.easeFactor));
  });

  it("reinicia o ciclo quando a resposta falha", () => {
    const result = reviewCard({ repetitionCount: 7, interval: 40, easeFactor: 2.4 }, 1, NOW);
    expect(result.lapsed).toBe(true);
    expect(result.repetitionCount).toBe(0);
    expect(result.interval).toBe(1);
  });

  it("nunca deixa o fator de facilidade cair abaixo do mínimo", () => {
    let state = { repetitionCount: 0, interval: 0, easeFactor: DEFAULT_EASE_FACTOR };
    for (let i = 0; i < 12; i += 1) {
      const result = reviewCard(state, 0, NOW);
      state = {
        repetitionCount: result.repetitionCount,
        interval: result.interval,
        easeFactor: result.easeFactor,
      };
    }
    expect(state.easeFactor).toBeGreaterThanOrEqual(MIN_EASE_FACTOR);
  });

  it("normaliza qualidades fora da escala em vez de propagar lixo", () => {
    expect(normalizeQuality(9)).toBe(5);
    expect(normalizeQuality(-3)).toBe(0);
    expect(normalizeQuality("abc")).toBe(0);
    expect(qualityToScore(5)).toBe(100);
    expect(qualityToScore(3)).toBe(60);
  });
});
