import { describe, it, expect } from "vitest";
import { buildCulturalTutorContext } from "./culturalTutorContextBuilder";
import {
  GeoLinguisticProfile,
  resolveGeoLinguisticProfile,
} from "../localization/geoLinguisticProfileResolver";

describe("Cultural Tutor Context Builder", () => {
  it("TESTE 1 — PERFIL ANGOLANO DE ALTA CONFIANÇA", () => {
    const profile: GeoLinguisticProfile = resolveGeoLinguisticProfile({
      countryCode: "AO",
      regionCode: "LUA",
      primaryLanguage: "pt",
      interfaceLanguage: "pt-AO",
      languageVariant: "pt-AO",
    });

    const context = buildCulturalTutorContext(profile);

    expect(context.personalizationLevel).toBe("high");
    expect(context.regionalVariant).toBe("pt-AO");
    expect(context.countryCode).toBe("AO");
    expect(context.teachingGuidance.useRegionalExamples).toBe(true);
    expect(context.communicationStyle.tone).toBe("warm");
    expect(context.culturalSafety.noEthnicityInference).toBe(true);
    expect(context.culturalSafety.noReligionInference).toBe(true);
    expect(context.culturalSafety.noPoliticalInference).toBe(true);
    expect(context.culturalSafety.noEconomicStatusInference).toBe(true);
  });

  it("TESTE 2 — PORTUGUÊS ANGOLANO NÃO É TRATADO COMO ERRO", () => {
    const profile: GeoLinguisticProfile = resolveGeoLinguisticProfile({
      countryCode: "AO",
      primaryLanguage: "pt",
      languageVariant: "pt-AO",
    });

    const context = buildCulturalTutorContext(profile);

    expect(context.vocabularyGuidance.preferredVariant).toBe("pt-AO");
    expect(
      context.vocabularyGuidance.avoidMarkingValidRegionalFormsAsWrong
    ).toBe(true);
    expect(context.vocabularyGuidance.acknowledgeAlternativeVariants).toBe(true);
  });

  it("TESTE 3 — CONFIANÇA MÉDIA", () => {
    const profile: GeoLinguisticProfile = resolveGeoLinguisticProfile({
      countryCode: "AO",
    });

    const context = buildCulturalTutorContext(profile);

    expect(context.personalizationLevel).toBe("medium");
    expect(context.teachingGuidance.avoidUnsupportedCulturalClaims).toBe(true);
    expect(context.teachingGuidance.useRegionalExamples).toBe(true);
  });

  it("TESTE 4 — CONFIANÇA BAIXA", () => {
    const profile: GeoLinguisticProfile = resolveGeoLinguisticProfile({});

    const context = buildCulturalTutorContext(profile);

    expect(context.personalizationLevel).toBe("basic");
    expect(context.communicationStyle.tone).toBe("neutral");
    expect(context.teachingGuidance.useRegionalExamples).toBe(false);
  });

  it("TESTE 5 — FALLBACK ACTIVO", () => {
    const profile: GeoLinguisticProfile = resolveGeoLinguisticProfile({
      countryCode: "INVALID_COUNTRY_999",
    });

    const context = buildCulturalTutorContext(profile);

    expect(context.fallbackApplied).toBe(true);
    expect(context.teachingGuidance.useRegionalExamples).toBe(false);
    expect(context.teachingGuidance.avoidUnsupportedCulturalClaims).toBe(true);
    expect(context.teachingGuidance.askBeforeUsingSensitiveContext).toBe(true);
    expect(context.culturalSafety.noStereotyping).toBe(true);
  });

  it("TESTE 6 — SEM PAÍS", () => {
    const profile: GeoLinguisticProfile = resolveGeoLinguisticProfile({
      primaryLanguage: "es",
    });

    const context = buildCulturalTutorContext(profile);

    expect(context.countryCode).toBeNull();
    expect(context.teachingGuidance.useRegionalExamples).toBe(false);
    expect(context.learnerLanguage).toBe("es");
  });

  it("TESTE 7 — SEM VARIANTE", () => {
    const profile: GeoLinguisticProfile = resolveGeoLinguisticProfile({
      primaryLanguage: "en",
    });

    const context = buildCulturalTutorContext(profile);

    expect(context.regionalVariant).toBeNull();
    expect(context.vocabularyGuidance.preferredVariant).toBeNull();
    expect(context.vocabularyGuidance.acknowledgeAlternativeVariants).toBe(true);
  });

  it("TESTE 8 — IDIOMA DIFERENTE DA INTERFACE", () => {
    const profile: GeoLinguisticProfile = resolveGeoLinguisticProfile({
      primaryLanguage: "en",
      interfaceLanguage: "pt-AO",
      countryCode: "AO",
    });

    const context = buildCulturalTutorContext(profile);

    expect(context.learnerLanguage).toBe("en");
    expect(context.interfaceLanguage).toBe("pt-AO");
    expect(context.teachingGuidance.explainInLearnerLanguage).toBe(true);
    expect(context.teachingGuidance.preserveTargetLanguageExposure).toBe(true);
  });

  it("TESTE 9 — SEGURANÇA CULTURAL", () => {
    const profile: GeoLinguisticProfile = resolveGeoLinguisticProfile({
      countryCode: "AO",
      primaryLanguage: "pt",
    });

    const context = buildCulturalTutorContext(profile);

    expect(context.culturalSafety).toEqual({
      noEthnicityInference: true,
      noReligionInference: true,
      noPoliticalInference: true,
      noEconomicStatusInference: true,
      noStereotyping: true,
    });
  });

  it("TESTE 10 — CORRECÇÃO RESPEITOSA", () => {
    const profile: GeoLinguisticProfile = resolveGeoLinguisticProfile({
      countryCode: "AO",
      primaryLanguage: "pt",
      languageVariant: "pt-AO",
    });

    const context = buildCulturalTutorContext(profile);

    expect(context.communicationStyle.encouragementLevel).toBe("high");
    expect(context.communicationStyle.directness).toBe("gentle");
    expect(
      context.vocabularyGuidance.avoidMarkingValidRegionalFormsAsWrong
    ).toBe(true);
  });

  it("TESTE 11 — IMUTABILIDADE DA ENTRADA", () => {
    const profile = resolveGeoLinguisticProfile({
      countryCode: "AO",
      primaryLanguage: "pt",
      secondaryLanguages: ["umbundu"],
    });

    expect(Object.isFrozen(profile)).toBe(true);

    const context = buildCulturalTutorContext(profile);

    expect(context).toBeDefined();
    expect(profile.countryCode).toBe("AO");
    expect(profile.secondaryLanguages).toEqual(["umbundu"]);
  });

  it("TESTE 12 — IMUTABILIDADE DA SAÍDA", () => {
    const profile = resolveGeoLinguisticProfile({
      countryCode: "AO",
      primaryLanguage: "pt",
    });

    const context = buildCulturalTutorContext(profile);

    expect(Object.isFrozen(context)).toBe(true);
    expect(Object.isFrozen(context.communicationStyle)).toBe(true);
    expect(Object.isFrozen(context.teachingGuidance)).toBe(true);
    expect(Object.isFrozen(context.vocabularyGuidance)).toBe(true);
    expect(Object.isFrozen(context.culturalSafety)).toBe(true);
    expect(Object.isFrozen(context.secondaryLanguages)).toBe(true);
  });

  it("TESTE 13 — DETERMINISMO", () => {
    const profile = resolveGeoLinguisticProfile({
      countryCode: "AO",
      primaryLanguage: "pt",
      languageVariant: "pt-AO",
    });

    const context1 = buildCulturalTutorContext(profile);
    const context2 = buildCulturalTutorContext(profile);

    expect(context1).toEqual(context2);
  });

  it("TESTE 14 — AUSÊNCIA DE REDE E GEMINI", () => {
    const profile = resolveGeoLinguisticProfile({
      countryCode: "AO",
      primaryLanguage: "pt",
    });

    const startTime = performance.now();
    const context = buildCulturalTutorContext(profile);
    const duration = performance.now() - startTime;

    expect(context).toBeDefined();
    expect(duration).toBeLessThan(50);
  });

  it("TESTE 15 — PERFIL NÃO ANGOLANO", () => {
    const profile = resolveGeoLinguisticProfile({
      countryCode: "FR",
      primaryLanguage: "fr",
      interfaceLanguage: "fr-FR",
      languageVariant: "fr-FR",
    });

    const context = buildCulturalTutorContext(profile);

    expect(context.countryCode).toBe("FR");
    expect(context.learnerLanguage).toBe("fr");
    expect(context.regionalVariant).toBe("fr-FR");
    expect(context.culturalSafety.noStereotyping).toBe(true);
    expect(context.regionalVariant).not.toBe("pt-AO");
  });

  it("TESTE 16 — IDIOMAS SECUNDÁRIOS", () => {
    const profile = resolveGeoLinguisticProfile({
      countryCode: "AO",
      primaryLanguage: "pt",
      secondaryLanguages: ["umbundu", "kimbundu"],
    });

    const context = buildCulturalTutorContext(profile);

    expect(context.secondaryLanguages).toEqual(["umbundu", "kimbundu"]);
    expect(Object.isFrozen(context.secondaryLanguages)).toBe(true);
  });
});
