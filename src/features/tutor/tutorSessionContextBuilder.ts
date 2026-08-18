import {
  GeoLinguisticProfile,
  GeoLinguisticProfileInput,
  resolveGeoLinguisticProfile,
} from "../localization/geoLinguisticProfileResolver";
import {
  CulturalTutorContext,
  CulturalSafety,
  buildCulturalTutorContext,
} from "./culturalTutorContextBuilder";
import { SmartProfile } from "../../profile/types";
import {
  TutorProfileAdaptationPolicy,
  buildTutorProfileAdaptationPolicy,
} from "./tutorProfileAdaptationPolicyBuilder";

export interface TutorSessionInput {
  smartProfile?: SmartProfile | Partial<SmartProfile> | null;
  geoInput?: GeoLinguisticProfileInput | null;
  geoProfile?: GeoLinguisticProfile | null;
  culturalContext?: CulturalTutorContext | null;
  targetLanguage?: string | null;
  cefrLevel?: string | null;
  sessionGoals?: readonly string[] | null;
  preferences?: Record<string, unknown> | null;
  rbacRole?: string | null;
  learningProfile?: string | null;
  ageGroup?: string | null;
  sessionMode?: string | null;
  autonomyPreference?: string | null;
  accessibilityNeeds?: readonly string[] | null;
}

export interface TutorSessionContext {
  readonly geoLinguisticProfile: GeoLinguisticProfile;
  readonly culturalContext: CulturalTutorContext;
  readonly primaryLanguage: string;
  readonly targetLanguage: string;
  readonly regionalVariant: string | null;
  readonly cefrLevel: string;
  readonly pedagogicalTone: "warm" | "neutral" | "formal";
  readonly culturalRules: CulturalSafety;
  readonly personalizationLevel: "high" | "medium" | "basic";
  readonly sessionGoals: readonly string[];
  readonly preferences: Readonly<Record<string, unknown>>;
  readonly culturalSafety: CulturalSafety;
  readonly profileAdaptationPolicy: TutorProfileAdaptationPolicy;
  readonly fallbackApplied: boolean;
  readonly learningLanguages: readonly string[];
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

export function extractGeoInputFromSmartProfile(
  profile?: SmartProfile | Partial<SmartProfile> | null
): GeoLinguisticProfileInput {
  if (!profile) return {};

  const localization = profile.localization;

  return {
    countryCode: localization?.country?.value ?? null,
    country: localization?.country?.value ?? null,
    primaryLanguage: localization?.nativeLanguage?.value ?? null,
    interfaceLanguage: localization?.interfaceLanguage?.value ?? null,
    preferredInterfaceLanguage: localization?.interfaceLanguage?.value ?? null,
  };
}

export function buildTutorSessionContext(
  input: TutorSessionInput = {}
): TutorSessionContext {
  const profileGeoInput = extractGeoInputFromSmartProfile(input.smartProfile);

  const mergedGeoInput: GeoLinguisticProfileInput = {
    ...profileGeoInput,
    ...(input.geoInput || {}),
  };

  const geoLinguisticProfile =
    input.geoProfile || resolveGeoLinguisticProfile(mergedGeoInput);

  const culturalContext =
    input.culturalContext || buildCulturalTutorContext(geoLinguisticProfile);

  const primaryLanguage = geoLinguisticProfile.primaryLanguage;

  const targetLanguage =
    input.targetLanguage && typeof input.targetLanguage === "string" && input.targetLanguage.trim()
      ? input.targetLanguage.trim()
      : primaryLanguage === "pt"
      ? "en"
      : "pt";

  const targetLanguagesField = input.smartProfile?.learning?.targetLanguages;
  const targetLanguagesFromProfile = (targetLanguagesField && typeof targetLanguagesField === 'object' && 'value' in targetLanguagesField)
    ? (targetLanguagesField as { value: string[] }).value
    : (Array.isArray(targetLanguagesField) ? targetLanguagesField : null);

  const learningLanguages = Array.isArray(targetLanguagesFromProfile) && targetLanguagesFromProfile.length > 0
    ? Object.freeze([...targetLanguagesFromProfile])
    : Object.freeze([targetLanguage]);

  const extractedCefr =
    input.cefrLevel || input.smartProfile?.learning?.cefrLevel?.value || "A1";

  const cefrLevel = typeof extractedCefr === "string" && extractedCefr.trim()
    ? extractedCefr.trim().toUpperCase()
    : "A1";

  const regionalVariant = culturalContext.regionalVariant;
  const pedagogicalTone = culturalContext.communicationStyle.tone;
  const culturalRules = culturalContext.culturalSafety;
  const culturalSafety = culturalContext.culturalSafety;
  const personalizationLevel = culturalContext.personalizationLevel;

  const rawGoals = input.sessionGoals || [];
  const sessionGoals = Object.freeze(
    rawGoals.filter((g): g is string => typeof g === "string" && Boolean(g.trim()))
  );

  const rawPreferences = {
    ...(input.smartProfile?.aiPersonalization
      ? {
          preferredTutorPersonality:
            input.smartProfile.aiPersonalization.preferredTutorPersonality?.value,
          preferredCorrectionStyle:
            input.smartProfile.aiPersonalization.preferredCorrectionStyle?.value,
        }
      : {}),
    ...(input.preferences || {}),
  };

  const preferences = Object.freeze(rawPreferences);

  const preferredCorrectionStyle =
    typeof rawPreferences.preferredCorrectionStyle === "string"
      ? rawPreferences.preferredCorrectionStyle
      : null;

  const profileAdaptationPolicy = buildTutorProfileAdaptationPolicy({
    rbacRole: input.rbacRole ?? input.smartProfile?.account?.role?.value ?? null,
    learningProfile: input.learningProfile ?? null,
    ageGroup: input.ageGroup ?? null,
    sessionMode: input.sessionMode ?? null,
    cefrLevel,
    preferredCorrectionStyle,
    autonomyPreference: input.autonomyPreference ?? null,
    accessibilityNeeds: input.accessibilityNeeds ?? null,
    learningGoals: sessionGoals,
  });

  const fallbackApplied =
    geoLinguisticProfile.fallbackApplied || culturalContext.fallbackApplied;

  const sessionContext: TutorSessionContext = {
    geoLinguisticProfile,
    culturalContext,
    primaryLanguage,
    targetLanguage,
    learningLanguages,
    regionalVariant,
    cefrLevel,
    pedagogicalTone,
    culturalRules,
    personalizationLevel,
    sessionGoals,
    preferences,
    culturalSafety,
    profileAdaptationPolicy,
    fallbackApplied,
  };

  return deepFreeze(sessionContext);
}
