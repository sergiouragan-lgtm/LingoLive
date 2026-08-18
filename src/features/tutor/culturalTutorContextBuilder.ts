import { GeoLinguisticProfile } from "../localization/geoLinguisticProfileResolver";

export interface CommunicationStyle {
  readonly tone: "warm" | "neutral" | "formal";
  readonly directness: "gentle" | "balanced" | "direct";
  readonly encouragementLevel: "standard" | "high";
}

export interface TeachingGuidance {
  readonly explainInLearnerLanguage: boolean;
  readonly preserveTargetLanguageExposure: boolean;
  readonly useRegionalExamples: boolean;
  readonly avoidUnsupportedCulturalClaims: boolean;
  readonly askBeforeUsingSensitiveContext: boolean;
}

export interface VocabularyGuidance {
  readonly preferredVariant: string | null;
  readonly acknowledgeAlternativeVariants: boolean;
  readonly avoidMarkingValidRegionalFormsAsWrong: boolean;
}

export interface CulturalSafety {
  readonly noEthnicityInference: true;
  readonly noReligionInference: true;
  readonly noPoliticalInference: true;
  readonly noEconomicStatusInference: true;
  readonly noStereotyping: true;
}

export interface CulturalTutorContext {
  readonly locale: string;
  readonly learnerLanguage: string;
  readonly interfaceLanguage: string;
  readonly regionalVariant: string | null;
  readonly countryCode: string | null;
  readonly regionCode: string | null;
  readonly secondaryLanguages: readonly string[];

  readonly communicationStyle: CommunicationStyle;
  readonly teachingGuidance: TeachingGuidance;
  readonly vocabularyGuidance: VocabularyGuidance;
  readonly culturalSafety: CulturalSafety;

  readonly personalizationLevel: "high" | "medium" | "basic";
  readonly fallbackApplied: boolean;
}

const deepFreeze = <T>(obj: T): Readonly<T> => {
  if (obj === null || typeof obj !== "object") {
    return obj as Readonly<T>;
  }
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = (obj as Record<string, unknown>)[prop];
    if (
      value !== null &&
      (typeof value === "object" || typeof value === "function") &&
      !Object.isFrozen(value)
    ) {
      deepFreeze(value);
    }
  });
  return obj as Readonly<T>;
};

export function buildCulturalTutorContext(
  profile: GeoLinguisticProfile
): CulturalTutorContext {
  const isAngolaContext =
    profile.countryCode === "AO" || profile.languageVariant === "pt-AO";

  let personalizationLevel: "high" | "medium" | "basic";
  if (profile.confidence === "high" && !profile.fallbackApplied) {
    personalizationLevel = "high";
  } else if (profile.confidence === "medium" && !profile.fallbackApplied) {
    personalizationLevel = "medium";
  } else {
    personalizationLevel = "basic";
  }

  let tone: "warm" | "neutral" | "formal" = "neutral";
  let directness: "gentle" | "balanced" | "direct" = "balanced";
  let encouragementLevel: "standard" | "high" = "standard";

  if (personalizationLevel === "high") {
    tone = "warm";
    directness = "gentle";
    encouragementLevel = "high";
  } else if (personalizationLevel === "medium") {
    tone = isAngolaContext ? "warm" : "neutral";
    directness = "gentle";
    encouragementLevel = isAngolaContext ? "high" : "standard";
  } else {
    tone = "neutral";
    directness = "balanced";
    encouragementLevel = "standard";
  }

  const useRegionalExamples =
    personalizationLevel !== "basic" &&
    !profile.fallbackApplied &&
    Boolean(profile.countryCode);

  const avoidUnsupportedCulturalClaims =
    profile.fallbackApplied || personalizationLevel !== "high";

  const askBeforeUsingSensitiveContext =
    profile.fallbackApplied || personalizationLevel === "basic";

  const explainInLearnerLanguage = Boolean(
    profile.primaryLanguage &&
      profile.interfaceLanguage &&
      profile.primaryLanguage.toLowerCase() !==
        profile.interfaceLanguage.toLowerCase()
  );

  const teachingGuidance: TeachingGuidance = {
    explainInLearnerLanguage,
    preserveTargetLanguageExposure: true,
    useRegionalExamples,
    avoidUnsupportedCulturalClaims,
    askBeforeUsingSensitiveContext,
  };

  const preferredVariant = profile.languageVariant || null;
  const avoidMarkingValidRegionalFormsAsWrong = Boolean(
    preferredVariant || isAngolaContext
  );

  const vocabularyGuidance: VocabularyGuidance = {
    preferredVariant,
    acknowledgeAlternativeVariants: true,
    avoidMarkingValidRegionalFormsAsWrong,
  };

  const culturalSafety: CulturalSafety = {
    noEthnicityInference: true,
    noReligionInference: true,
    noPoliticalInference: true,
    noEconomicStatusInference: true,
    noStereotyping: true,
  };

  const communicationStyle: CommunicationStyle = {
    tone,
    directness,
    encouragementLevel,
  };

  const secondaryLanguages = Object.freeze([
    ...(profile.secondaryLanguages || []),
  ]);

  const context: CulturalTutorContext = {
    locale: profile.locale,
    learnerLanguage: profile.primaryLanguage,
    interfaceLanguage: profile.interfaceLanguage,
    regionalVariant: preferredVariant,
    countryCode: profile.countryCode,
    regionCode: profile.regionCode,
    secondaryLanguages,

    communicationStyle,
    teachingGuidance,
    vocabularyGuidance,
    culturalSafety,

    personalizationLevel,
    fallbackApplied: profile.fallbackApplied,
  };

  return deepFreeze(context);
}
