import { describe, it, expect } from "vitest";
import {
  buildTutorSessionContext,
  extractGeoInputFromSmartProfile,
} from "./tutorSessionContextBuilder";
import { resolveGeoLinguisticProfile } from "../localization/geoLinguisticProfileResolver";
import { buildCulturalTutorContext } from "./culturalTutorContextBuilder";
import { SmartProfile } from "../../profile/types";
import { buildTutorProfileAdaptationPolicy } from "./tutorProfileAdaptationPolicyBuilder";

describe("Tutor Session Context Builder", () => {
  const createMockAttribute = <T>(value: T) => ({
    value,
    confidence: 1,
    source: "user",
    lastUpdated: "2026-07-22T00:00:00Z",
    validationStatus: "valid",
    version: "1.0",
  });

  const mockSmartProfile: Partial<SmartProfile> = {
    userId: "user-123",
    localization: {
      country: createMockAttribute("AO"),
      interfaceLanguage: createMockAttribute("pt-AO"),
      nativeLanguage: createMockAttribute("pt"),
      timezone: createMockAttribute("Africa/Luanda"),
    },
    learning: {
      cefrLevel: createMockAttribute("B2"),
      vocabularySize: createMockAttribute(2500),
      learningStyle: createMockAttribute("auditory"),
    },
    aiPersonalization: {
      preferredTutorPersonality: createMockAttribute("encouraging"),
      preferredCorrectionStyle: createMockAttribute("gentle"),
    },
  };

  it("1. Sessão recebe GeoLinguisticProfile", () => {
    const sessionContext = buildTutorSessionContext({
      smartProfile: mockSmartProfile,
    });

    expect(sessionContext.geoLinguisticProfile).toBeDefined();
    expect(sessionContext.geoLinguisticProfile.countryCode).toBe("AO");
    expect(sessionContext.geoLinguisticProfile.languageVariant).toBe("pt-AO");
  });

  it("2. Sessão recebe CulturalTutorContext", () => {
    const sessionContext = buildTutorSessionContext({
      smartProfile: mockSmartProfile,
    });

    expect(sessionContext.culturalContext).toBeDefined();
    expect(sessionContext.culturalContext.countryCode).toBe("AO");
    expect(sessionContext.culturalContext.personalizationLevel).toBe("high");
    expect(sessionContext.pedagogicalTone).toBe("warm");
    expect(sessionContext.culturalSafety.noStereotyping).toBe(true);
  });

  it("3. Ordem correcta da pipeline de transformação (SmartProfile -> GeoLinguisticProfile -> CulturalTutorContext -> TutorSessionContext)", () => {
    // 1. Extração
    const geoInput = extractGeoInputFromSmartProfile(mockSmartProfile);
    expect(geoInput.countryCode).toBe("AO");
    expect(geoInput.primaryLanguage).toBe("pt");

    // 2. Resolução GeoLingual
    const geoProfile = resolveGeoLinguisticProfile(geoInput);
    expect(geoProfile.confidence).toBe("high");

    // 3. Contexto Cultural
    const culturalContext = buildCulturalTutorContext(geoProfile);
    expect(culturalContext.communicationStyle.tone).toBe("warm");

    // 4. Contexto da Sessão
    const sessionContext = buildTutorSessionContext({
      geoProfile,
      culturalContext,
      targetLanguage: "en",
      sessionGoals: ["vocabulary_expansion"],
    });

    expect(sessionContext.geoLinguisticProfile).toBe(geoProfile);
    expect(sessionContext.culturalContext).toBe(culturalContext);
    expect(sessionContext.primaryLanguage).toBe("pt");
    expect(sessionContext.targetLanguage).toBe("en");
    expect(sessionContext.cefrLevel).toBe("A1"); // pre-built input default override
    expect(sessionContext.sessionGoals).toEqual(["vocabulary_expansion"]);
    expect(sessionContext.profileAdaptationPolicy).toBeDefined();
  });

  it("TESTE 1 — POLÍTICA SEMPRE PRESENTE", () => {
    const context = buildTutorSessionContext({});
    expect(context.profileAdaptationPolicy).toBeDefined();
    expect(context.profileAdaptationPolicy.resolvedLearningProfile).toBe("generic");
  });

  it("TESTE 2 — BUILDER REAL REUTILIZADO", () => {
    const input = {
      learningProfile: "child",
      sessionGoals: ["practice"],
    };
    const context = buildTutorSessionContext(input);
    const expectedPolicy = buildTutorProfileAdaptationPolicy({
      learningProfile: "child",
      cefrLevel: "A1",
      learningGoals: ["practice"],
    });

    expect(context.profileAdaptationPolicy.resolvedLearningProfile).toBe(expectedPolicy.resolvedLearningProfile);
    expect(context.profileAdaptationPolicy.communicationGuidance).toEqual(expectedPolicy.communicationGuidance);
  });

  it("TESTE 3 — CRIANÇA", () => {
    const context = buildTutorSessionContext({
      learningProfile: "child",
      ageGroup: "5-8 anos",
    });

    expect(context.profileAdaptationPolicy.resolvedLearningProfile).toBe("child");
    expect(context.profileAdaptationPolicy.safetyGuidance.some((g) => g.includes("segurança infantil"))).toBe(true);
  });

  it("TESTE 4 — ADOLESCENTE", () => {
    const context = buildTutorSessionContext({
      learningProfile: "teenager",
    });

    expect(context.profileAdaptationPolicy.resolvedLearningProfile).toBe("teenager");
    expect(context.profileAdaptationPolicy.communicationGuidance.some((g) => g.includes("não infantilizado"))).toBe(true);
  });

  it("TESTE 5 — ADULTO", () => {
    const context = buildTutorSessionContext({
      learningProfile: "adult",
    });

    expect(context.profileAdaptationPolicy.resolvedLearningProfile).toBe("adult");
    expect(context.profileAdaptationPolicy.communicationGuidance.some((g) => g.includes("madura"))).toBe(true);
  });

  it("TESTE 6 — PROFESSOR", () => {
    const context = buildTutorSessionContext({
      rbacRole: "TEACHER",
    });

    expect(context.profileAdaptationPolicy.resolvedLearningProfile).toBe("educator");
    expect(context.profileAdaptationPolicy.sessionMode).toBe("teacher_support");
  });

  it("TESTE 7 — ENCARREGADO", () => {
    const context = buildTutorSessionContext({
      rbacRole: "PARENT",
    });

    expect(context.profileAdaptationPolicy.resolvedLearningProfile).toBe("guardian_support");
    expect(context.profileAdaptationPolicy.resolvedLearningProfile).not.toBe("child");
  });

  it("TESTE 8 — ESCOLA", () => {
    const context = buildTutorSessionContext({
      rbacRole: "SCHOOL_ADMIN",
    });

    expect(context.profileAdaptationPolicy.resolvedLearningProfile).toBe("institutional");
    expect(context.profileAdaptationPolicy.prohibitedBehaviours.some((p) => p.includes("aluno individual"))).toBe(true);
  });

  it("TESTE 9 — EMBAIXADOR", () => {
    const context = buildTutorSessionContext({
      rbacRole: "AMBASSADOR",
    });

    expect(context.profileAdaptationPolicy.resolvedLearningProfile).toBe("language_ambassador");
    expect(context.profileAdaptationPolicy.prohibitedBehaviours.some((p) => p.includes("professor certificado"))).toBe(true);
  });

  it("TESTE 10 — STUDENT SEM IDADE", () => {
    const context = buildTutorSessionContext({
      rbacRole: "STUDENT",
    });

    expect(context.profileAdaptationPolicy.resolvedLearningProfile).toBe("generic");
    expect(context.profileAdaptationPolicy.resolvedLearningProfile).not.toBe("child");
    expect(context.profileAdaptationPolicy.resolvedLearningProfile).not.toBe("teenager");
  });

  it("TESTE 11 — CEFR NÃO DEFINE PERFIL", () => {
    const contextA1 = buildTutorSessionContext({ cefrLevel: "A1" });
    const contextC1 = buildTutorSessionContext({ cefrLevel: "C1" });

    expect(contextA1.profileAdaptationPolicy.resolvedLearningProfile).toBe("generic");
    expect(contextC1.profileAdaptationPolicy.resolvedLearningProfile).toBe("generic");
  });

  it("TESTE 12 — IDIOMA NÃO DEFINE PERFIL", () => {
    const context = buildTutorSessionContext({
      targetLanguage: "pt-AO",
    });

    expect(context.profileAdaptationPolicy.resolvedLearningProfile).toBe("generic");
  });

  it("TESTE 13 — PREFERRED CORRECTION STYLE", () => {
    const context = buildTutorSessionContext({
      smartProfile: mockSmartProfile, // preferredCorrectionStyle = "gentle"
    });

    expect(context.preferences.preferredCorrectionStyle).toBe("gentle");
    expect(context.profileAdaptationPolicy.teachingGuidance.some((g) => g.includes("suave"))).toBe(true);

    const geoValues = Object.values(context.geoLinguisticProfile);
    expect(geoValues).not.toContain("gentle");
  });

  it("TESTE 14 — HELP", () => {
    const context = buildTutorSessionContext({
      sessionMode: "help",
    });

    expect(context.profileAdaptationPolicy.sessionMode).toBe("help");
    expect(context.profileAdaptationPolicy.assistanceGuidance.some((g) => g.includes("Responder diretamente ao problema imediato"))).toBe(true);
  });

  it("TESTE 15 — SELF_HELP", () => {
    const context = buildTutorSessionContext({
      sessionMode: "self_help",
    });

    expect(context.profileAdaptationPolicy.sessionMode).toBe("self_help");
    expect(context.profileAdaptationPolicy.assistanceGuidance.some((g) => g.includes("autónoma"))).toBe(true);
  });

  it("TESTE 16 — CONFLITO", () => {
    const context = buildTutorSessionContext({
      rbacRole: "TEACHER",
      learningProfile: "child",
    });

    expect(context.profileAdaptationPolicy.resolvedLearningProfile).toBe("child");
    expect(context.profileAdaptationPolicy.sourceConfidence).toBe("partial");
  });

  it("TESTE 17 — SMARTPROFILE AUSENTE", () => {
    const context = buildTutorSessionContext({ smartProfile: null });

    expect(context.profileAdaptationPolicy.resolvedLearningProfile).toBe("generic");
    expect(context.profileAdaptationPolicy.fallbackApplied).toBe(true);
    expect(context.profileAdaptationPolicy.sourceConfidence).toBe("fallback");
  });

  it("TESTE 18 — ENTRADA PARCIAL", () => {
    expect(() => buildTutorSessionContext({ cefrLevel: "B1" })).not.toThrow();
  });

  it("TESTE 19 — IMUTABILIDADE", () => {
    const context = buildTutorSessionContext({
      learningProfile: "adult",
    });

    expect(Object.isFrozen(context)).toBe(true);
    expect(Object.isFrozen(context.profileAdaptationPolicy)).toBe(true);
    expect(Object.isFrozen(context.profileAdaptationPolicy.communicationGuidance)).toBe(true);
  });

  it("TESTE 20 — DETERMINISMO", () => {
    const input = { learningProfile: "teenager", cefrLevel: "B1" };
    const contextA = buildTutorSessionContext(input);
    const contextB = buildTutorSessionContext(input);

    expect(contextA).toEqual(contextB);
  });

  it("TESTE 21 — COMPATIBILIDADE ANTIGA", () => {
    const oldCallContext = buildTutorSessionContext({
      smartProfile: mockSmartProfile,
      targetLanguage: "en",
      sessionGoals: ["speaking"],
    });

    expect(oldCallContext.primaryLanguage).toBe("pt");
    expect(oldCallContext.targetLanguage).toBe("en");
    expect(oldCallContext.cefrLevel).toBe("B2");
    expect(oldCallContext.profileAdaptationPolicy).toBeDefined();
  });

  it("TESTE 22 — GEO PRESERVADO", () => {
    const context = buildTutorSessionContext({
      smartProfile: mockSmartProfile,
    });

    expect(context.geoLinguisticProfile.countryCode).toBe("AO");
    expect(context.geoLinguisticProfile.languageVariant).toBe("pt-AO");
  });

  it("TESTE 23 — CULTURA PRESERVADA", () => {
    const context = buildTutorSessionContext({
      smartProfile: mockSmartProfile,
    });

    expect(context.culturalContext.countryCode).toBe("AO");
    expect(context.culturalContext.communicationStyle.tone).toBe("warm");
  });

  it("TESTE 24 — SEM GEMINI OU REDE", () => {
    const start = performance.now();
    const context = buildTutorSessionContext({
      learningProfile: "child",
    });
    const duration = performance.now() - start;

    expect(context).toBeDefined();
    expect(duration).toBeLessThan(50);
  });

  it("TESTE 25 — SEM ALTERAÇÃO RBAC", () => {
    const context = buildTutorSessionContext({
      rbacRole: "TEACHER",
    });

    const contextRecord = context as unknown as Record<string, unknown>;
    expect(contextRecord.grantedPermissions).toBeUndefined();
    expect(contextRecord.assignedRole).toBeUndefined();
    expect(context.profileAdaptationPolicy.prohibitedBehaviours.some((p) => p.includes("does not change account permissions"))).toBe(true);
  });

  it("TESTE 26 — LEARNING LANGUAGES PREENCHIDO", () => {
    const mockSmartProfileWithLanguages: Partial<SmartProfile> = {
      ...mockSmartProfile,
      learning: {
        ...mockSmartProfile.learning!,
        targetLanguages: createMockAttribute(["pt", "en", "fr"]),
      },
    };

    const context = buildTutorSessionContext({
      smartProfile: mockSmartProfileWithLanguages,
    });

    expect(context.learningLanguages).toEqual(["pt", "en", "fr"]);
    expect(Object.isFrozen(context.learningLanguages)).toBe(true);
  });

  it("TESTE 27 — LEARNING LANGUAGES FALLBACK", () => {
    const context = buildTutorSessionContext({
      smartProfile: mockSmartProfile, // No targetLanguages
      targetLanguage: "es",
    });

    expect(context.learningLanguages).toEqual(["es"]);
  });
});
