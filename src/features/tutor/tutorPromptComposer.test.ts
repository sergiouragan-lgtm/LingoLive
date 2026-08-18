import { describe, it, expect } from "vitest";
import {
  composeTutorSystemInstruction,
  CULTURAL_SECTION_HEADER,
  CULTURAL_SECTION_FOOTER,
} from "./tutorPromptComposer";
import {
  buildTutorSessionContext,
  TutorSessionContext,
} from "./tutorSessionContextBuilder";
import { buildTutorCulturalInstructions } from "./tutorCulturalInstructionsBuilder";
import { SmartProfile } from "../../profile/types";

describe("tutorPromptComposer — Suíte de Testes da Composição de Prompts da Sessão Gemini", () => {
  const BASE_PROMPT_MOCK = `You are Zephyr, the LingoLIVE AI language tutor. You provide conversational language practice with culturally respectful, pedagogically appropriate guidance.
You are having a real-time conversational voice session with a student learning Portuguese at an A1 level.

IDENTITY & BIOGRAPHY BOUNDARIES:
1. You are an AI language tutor created by LingoLIVE. You must NEVER claim human identity, physical city residency, or a personal biography, birthplace, nationality, family, or memories.
2. If asked about your personal life, nationality, or residence, briefly clarify that you are an AI tutor, then naturally redirect back to language learning.
3. You can model natural language usage and explain cultural or linguistic facts without claiming personal lived experiences.

Scenario/Roleplay Context:
"Casual Chat in Luanda"
During roleplay, portray the scenario role as a pedagogical simulation without claiming real personal biography, nationality, or residence.

Your strict conversational guidelines:
1. SPEAK ONLY IN THE TARGET LANGUAGE: Portuguese.
2. Response Length: Maximum 2 sentences.
<analytics>
{ "detected_error": "none" }
</analytics>`;

  const createMockAttribute = <T>(value: T) => ({
    value,
    confidence: 1,
    source: "user",
    lastUpdated: "2026-07-22T00:00:00Z",
    validationStatus: "valid",
    version: "1.0",
  });

  const angolanProfile: Partial<SmartProfile> = {
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

  it("TESTE 1 — IDENTIDADE DE TUTOR IA", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    expect(result.startsWith(BASE_PROMPT_MOCK)).toBe(true);
    expect(result).toContain("You are Zephyr, the LingoLIVE AI language tutor");
    expect(result).toContain("<analytics>");
  });

  it("TESTE 2 — SEM LOCAL RESIDENT AUTOBIOGRÁFICO", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    expect(result.toLowerCase()).not.toContain("you are a local resident");
    expect(result.toLowerCase()).not.toContain("act as a local resident");
  });

  it("TESTE 3 — SEM NATIVIDADE AUTOBIOGRÁFICA", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    expect(result.toLowerCase()).not.toContain("you are a native speaker");
    expect(result.toLowerCase()).not.toContain("as a native speaker");
    expect(result.toLowerCase()).not.toContain("na minha língua nativa");
  });

  it("TESTE 4 — SEM NACIONALIDADE INVENTADA", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    expect(result.toLowerCase()).not.toContain("you are from angola");
    expect(result.toLowerCase()).not.toContain("your hometown");
    expect(result.toLowerCase()).not.toContain("born in");
  });

  it("TESTE 5 — SEM EXPERIÊNCIAS PESSOAIS INVENTADAS", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    expect(result.toLowerCase()).not.toContain("your personal experience");
    expect(result.toLowerCase()).not.toContain("grew up speaking");
    expect(result.toLowerCase()).not.toContain("you have lived in");
  });

  it("TESTE 6 — ROLEPLAY PRESERVADO", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    expect(result).toContain("Scenario/Roleplay Context:");
    expect(result).toContain("Casual Chat in Luanda");
  });

  it("TESTE 7 — PAPEL NÃO É IDENTIDADE", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    expect(result).toContain("portray the scenario role as a pedagogical simulation without claiming real personal biography");
  });

  it("TESTE 8 — CONTEXTO ANGOLANO SEM FALSA IDENTIDADE", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    expect(result).toContain("Português de Angola");
    expect(result).not.toContain("You are from Angola");
    expect(result).not.toContain("cresceu em Angola");
  });

  it("TESTE 9 — PROMPT BASE PRESERVADO", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    expect(result).toContain("SPEAK ONLY IN THE TARGET LANGUAGE");
    expect(result).toContain("Response Length: Maximum 2 sentences");
    expect(result).toContain("<analytics>");
  });

  it("TESTE 10 — SECÇÃO CULTURAL PRESERVADA", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    expect(result).toContain(CULTURAL_SECTION_HEADER);
    expect(result).toContain(CULTURAL_SECTION_FOOTER);
  });

  it("TESTE 11 — SEM CONTRADIÇÃO", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    expect(result).toContain("NEVER claim human identity");
    expect(result).not.toContain("a friendly local resident and native speaker");
  });

  it("TESTE 12 — RESPOSTA A PERGUNTA BIOGRÁFICA", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    expect(result).toContain("If asked about your personal life, nationality, or residence, briefly clarify that you are an AI tutor");
  });

  it("TESTE 13 — DETERMINISMO", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const res1 = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    const res2 = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    expect(res1).toBe(res2);
  });

  it("TESTE 14 — PROMPT LIMPO", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    expect(result).not.toContain("undefined");
    expect(result).not.toContain("[object Object]");
    expect(result).not.toContain("null");
  });

  it("TESTE 15 — SEM REGRESSÃO DE CENÁRIO", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    expect(result).toContain("Casual Chat in Luanda");
    expect(result).toContain("Portuguese");
    expect(result).toContain("A1");
  });

  it("TESTE 16 — SEM CHAMADA GEMINI", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const t0 = performance.now();
    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });
    const t1 = performance.now();

    expect(result).toBeDefined();
    expect(t1 - t0).toBeLessThan(50);
  });

  it("TESTE 17 — PESQUISA DE EXPRESSÕES PROIBIDAS", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    const FORBIDDEN = [
      "local resident",
      "native speaker",
      "you live in",
      "you are from angola",
      "as someone from",
      "your hometown",
      "your personal experience",
      "you grew up speaking",
      "you have lived in",
      "act as a real person",
    ];

    for (const phrase of FORBIDDEN) {
      expect(result.toLowerCase()).not.toContain(phrase);
    }
  });

  it("TESTE 2 — CONTEXTO CULTURAL ANEXADO", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    expect(result).toContain(CULTURAL_SECTION_HEADER);
    expect(result).toContain(CULTURAL_SECTION_FOOTER);
    expect(result.split(CULTURAL_SECTION_HEADER).length - 1).toBe(1);
  });

  it("TESTE 3 — CONTEXTO AUSENTE", () => {
    const resultNoContext = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: null,
    });

    expect(resultNoContext).toBe(BASE_PROMPT_MOCK);
    expect(resultNoContext).not.toContain(CULTURAL_SECTION_HEADER);
  });

  it("TESTE 4 — CONTEXTO ANGOLANO", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    expect(result).toContain("Português de Angola");
    expect(result).toContain("Não corrija nem substitua automaticamente");
  });

  it("TESTE 5 — FALLBACK ACTIVO", () => {
    const context = buildTutorSessionContext({
      smartProfile: null,
      targetLanguage: "en",
      cefrLevel: "A1",
    });

    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    expect(result).toContain("ATENÇÃO - FALLBACK ACTIVO");
    expect(result).toContain("É estritamente proibido utilizar frases como 'na tua cultura'");
    expect(result).toContain("Nível de personalização básico");
  });

  it("TESTE 6 — SEM VARIANTE", () => {
    const context = buildTutorSessionContext({
      smartProfile: null,
      targetLanguage: "ja",
      cefrLevel: "A1",
    });

    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    expect(result).not.toContain("undefined");
    expect(result).toContain("Não invente uma variante regional específica");
  });

  it("TESTE 7 — PROMPT LIMPO", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    expect(result).not.toContain("undefined");
    expect(result).not.toContain("[object Object]");
    expect(result).not.toContain("null");
  });

  it("TESTE 8 — DETERMINISMO", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const res1 = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    const res2 = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    expect(res1).toBe(res2);
  });

  it("TESTE 9 — NÃO MUTAÇÃO", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const contextSnapshot = JSON.stringify(context);
    composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    expect(JSON.stringify(context)).toBe(contextSnapshot);
  });

  it("TESTE 10 — SEM CHAMADA GEMINI", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const t0 = performance.now();
    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });
    const t1 = performance.now();

    expect(result).toBeDefined();
    expect(t1 - t0).toBeLessThan(50);
  });

  it("TESTE 11 — INICIALIZAÇÃO ÚNICA", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const instructions = buildTutorCulturalInstructions(context);

    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      culturalInstructions: instructions,
    });

    expect(result).toContain(CULTURAL_SECTION_HEADER);
    expect(result).toContain(instructions.serializedInstructions);
  });

  it("TESTE 12 — COMPATIBILIDADE DO CHAMADOR", () => {
    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
    });

    expect(result).toBe(BASE_PROMPT_MOCK);
  });

  it("TESTE 13 — REGRAS TÉCNICAS PRESERVADAS", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    expect(result).toContain("SPEAK ONLY IN THE TARGET LANGUAGE");
    expect(result).toContain("Response Length: Maximum 2 sentences");
    expect(result).toContain("<analytics>");
  });

  it("TESTE 14 — SEM DUPLICAÇÃO DE DADOS", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    expect(result).not.toContain('"userId": "user-angola-01"');
    expect(result).not.toContain("smartProfile");
    expect(result).not.toContain("confidence");
  });

  it("TESTE 15 — ORDEM DAS SECÇÕES", () => {
    const context = buildTutorSessionContext({
      smartProfile: angolanProfile,
      targetLanguage: "pt",
      cefrLevel: "A1",
    });

    const result = composeTutorSystemInstruction({
      baseInstruction: BASE_PROMPT_MOCK,
      sessionContext: context,
    });

    const baseIndex = result.indexOf(BASE_PROMPT_MOCK);
    const culturalIndex = result.indexOf(CULTURAL_SECTION_HEADER);

    expect(baseIndex).toBe(0);
    expect(culturalIndex).toBeGreaterThan(baseIndex);
  });
});
