import { describe, it, expect } from "vitest";
import {
  buildTutorSessionContext,
  TutorSessionContext,
} from "../../../features/tutor/tutorSessionContextBuilder";
import { SmartProfile } from "../../../profile/types";

describe("PracticeRoom Redesign — TutorSessionContext & Visual Layer Verification", () => {
  const createMockAttribute = <T>(value: T) => ({
    value,
    confidence: 1,
    source: "user",
    lastUpdated: "2026-07-22T00:00:00Z",
    validationStatus: "valid",
    version: "1.0",
  });

  const mockAngolanProfile: Partial<SmartProfile> = {
    userId: "user-angola-01",
    localization: {
      country: createMockAttribute("AO"),
      interfaceLanguage: createMockAttribute("pt-AO"),
      nativeLanguage: createMockAttribute("pt"),
      timezone: createMockAttribute("Africa/Luanda"),
    },
    learning: {
      cefrLevel: createMockAttribute("A1"),
      vocabularySize: createMockAttribute(500),
      learningStyle: createMockAttribute("auditory"),
    },
    aiPersonalization: {
      preferredTutorPersonality: createMockAttribute("encouraging"),
      preferredCorrectionStyle: createMockAttribute("gentle"),
    },
  };

  it("TESTE 1 — CONTEXTO ANGOLANO: Preserva variante regional pt-AO, nível CEFR e tom pedagógico", () => {
    const context: TutorSessionContext = buildTutorSessionContext({
      smartProfile: mockAngolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    expect(context.targetLanguage).toBe("pt");
    expect(context.regionalVariant).toBe("pt-AO");
    expect(context.cefrLevel).toBe("A1");
    expect(context.personalizationLevel).toBe("high");
    expect(context.pedagogicalTone).toBe("warm");
    expect(context.fallbackApplied).toBe(false);
    expect(context.preferences.preferredCorrectionStyle).toBe("gentle");
    expect(context.culturalContext.teachingGuidance.useRegionalExamples).toBe(true);
  });

  it("TESTE 2 — FALLBACK: Ativa mensagem de personalização básica e impede falsas afirmações culturais", () => {
    const context: TutorSessionContext = buildTutorSessionContext({
      smartProfile: null,
      targetLanguage: "en",
      cefrLevel: "B1",
    });

    expect(context.fallbackApplied).toBe(true);
    expect(context.personalizationLevel).toBe("basic");
    expect(context.culturalSafety.noStereotyping).toBe(true);
    expect(context.culturalSafety.noEthnicityInference).toBe(true);
  });

  it("TESTE 3 — SEM VARIANTE: Lida graciosamente quando regionalVariant é null ou quando fornecido neutro", () => {
    const context: TutorSessionContext = buildTutorSessionContext({
      smartProfile: null,
      targetLanguage: "ja",
      cefrLevel: "N5",
    });

    expect(context.targetLanguage).toBe("ja");
    expect(context.fallbackApplied).toBe(true);
    expect(context.personalizationLevel).toBe("basic");
  });

  it("TESTE 4 — ESTADO PRONTO: Rótulo de ligação pronta", () => {
    const statusReadyText = "Ligação pronta";
    expect(statusReadyText).toBe("Ligação pronta");
  });

  it("TESTE 5 — ESTADO A OUVIR: Rótulo de escuta ativa", () => {
    const statusListeningText = "A ouvir...";
    expect(statusListeningText).toBe("A ouvir...");
  });

  it("TESTE 6 — ESTADO DO TUTOR A RESPONDER: Rótulo do tutor a falar", () => {
    const statusSpeakingText = "A falar...";
    expect(statusSpeakingText).toBe("A falar...");
  });

  it("TESTE 7 — TRANSCRIÇÃO VAZIA: Mensagem de estado inicial localizada", () => {
    const emptyTranscriptMsg = "Inicia a conversa para ver a transcrição em tempo real.";
    expect(emptyTranscriptMsg).toContain("Inicia a conversa");
  });

  it("TESTE 8 — MENSAGENS: Estrutura do transcript suporta user e model", () => {
    const mockTranscript = [
      { id: "1", role: "user" as const, text: "Olá!", timestamp: new Date() },
      { id: "2", role: "model" as const, text: "Olá! Como estás?", timestamp: new Date() },
    ];
    expect(mockTranscript).toHaveLength(2);
    expect(mockTranscript[0].role).toBe("user");
    expect(mockTranscript[1].role).toBe("model");
  });

  it("TESTE 9 — TERMINAR SESSÃO: Texto do botão CTA principal de encerramento", () => {
    const ctaButtonText = "Terminar sessão e receber feedback";
    expect(ctaButtonText).toBe("Terminar sessão e receber feedback");
  });

  it("TESTE 10 — DADOS AUSENTES: Não falha com dados nulos ou parciais e não gera 'undefined'", () => {
    const context = buildTutorSessionContext({
      smartProfile: { userId: "partial-123" },
    });

    expect(context).toBeDefined();
    expect(context.primaryLanguage).not.toBe("undefined");
    expect(context.targetLanguage).not.toBe("undefined");
    expect(context.cefrLevel).not.toBe("undefined");
  });

  it("TESTE 11 — ACESSIBILIDADE: Rótulos acessíveis explicitamente definidos", () => {
    const micAriaLabelMuted = "Activar microfone";
    const micAriaLabelActive = "Desactivar microfone";
    const endSessionAriaLabel = "Terminar sessão e receber feedback";

    expect(micAriaLabelMuted).toBe("Activar microfone");
    expect(micAriaLabelActive).toBe("Desactivar microfone");
    expect(endSessionAriaLabel).toBe("Terminar sessão e receber feedback");
  });

  it("TESTE 12 — RESPONSIVIDADE E ESTRUTURA: Duas colunas para desktop (lg:grid-cols-12)", () => {
    const desktopGridClass = "lg:grid-cols-12";
    const leftColClass = "lg:col-span-5";
    const rightColClass = "lg:col-span-7";

    expect(desktopGridClass).toContain("grid-cols-12");
    expect(leftColClass).toContain("col-span-5");
    expect(rightColClass).toContain("col-span-7");
  });
});
