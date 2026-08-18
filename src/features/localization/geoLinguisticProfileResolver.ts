import { normalizeLanguageCode } from "../../types/languagePreferences";
import {
  normalizeCountryCode,
  REGIONAL_LANGUAGE_CATALOG,
} from "../../data/regionalLanguageCatalog";

export type ResolutionSource =
  | "explicit-preference"
  | "stored-profile"
  | "authorized-location"
  | "country-default"
  | "system-default";

export type ResolutionConfidence = "high" | "medium" | "low";

export interface CulturalContext {
  readonly countryCode: string | null;
  readonly regionCode: string | null;
  readonly language: string;
  readonly variant: string | null;
}

export interface GeoLinguisticProfile {
  readonly countryCode: string | null;
  readonly regionCode: string | null;
  readonly primaryLanguage: string;
  readonly interfaceLanguage: string;
  readonly languageVariant: string | null;
  readonly secondaryLanguages: readonly string[];
  readonly locale: string;
  readonly culturalContext: CulturalContext;
  readonly resolutionSource: ResolutionSource;
  readonly confidence: ResolutionConfidence;
  readonly fallbackApplied: boolean;
}

export interface LocationDataInput {
  countryCode?: string | null;
  regionCode?: string | null;
}

export interface StoredProfileInput {
  countryCode?: string | null;
  regionCode?: string | null;
  primaryLanguage?: string | null;
  interfaceLanguage?: string | null;
  languageVariant?: string | null;
  secondaryLanguages?: readonly string[] | null;
}

export interface GeoLinguisticProfileInput {
  country?: string | null;
  countryCode?: string | null;
  province?: string | null;
  region?: string | null;
  regionCode?: string | null;
  primaryLanguage?: string | null;
  interfaceLanguage?: string | null;
  preferredInterfaceLanguage?: string | null;
  languageVariant?: string | null;
  variant?: string | null;
  secondaryLanguages?: readonly string[] | null;
  declaredOrigin?: string | null;
  authorizedLocation?: LocationDataInput | null;
  locationData?: LocationDataInput | null;
  storedPreferences?: StoredProfileInput | null;
  userPreference?: string | null;
}

const COUNTRY_NAME_MAP: Readonly<Record<string, string>> = Object.freeze({
  angola: "AO",
  mozambique: "MZ",
  moçambique: "MZ",
  "south africa": "ZA",
  "áfrica do sul": "ZA",
  france: "FR",
  frança: "FR",
  brazil: "BR",
  brasil: "BR",
  portugal: "PT",
});

const DEFAULT_FALLBACK_PROFILE = Object.freeze({
  primaryLanguage: "pt",
  interfaceLanguage: "pt-AO",
  countryCode: "AO",
  languageVariant: "pt-AO",
});

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

const resolveCountryCodeFromCandidates = (
  candidates: readonly (string | null | undefined)[]
): string | null => {
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "string") {
      continue;
    }
    const normalized = normalizeCountryCode(candidate);
    if (normalized && REGIONAL_LANGUAGE_CATALOG[normalized]) {
      return normalized;
    }
    const trimmed = candidate.trim().toLowerCase();
    if (COUNTRY_NAME_MAP[trimmed]) {
      return COUNTRY_NAME_MAP[trimmed];
    }
  }
  return null;
};

const resolveRegionCodeFromCandidates = (
  candidates: readonly (string | null | undefined)[]
): string | null => {
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "string") {
      continue;
    }
    const trimmed = candidate.trim().toUpperCase();
    if (/^[A-Z0-9_-]{1,10}$/.test(trimmed)) {
      return trimmed;
    }
  }
  return null;
};

const extractPrimaryCode = (lang: string | null | undefined): string | null => {
  if (!lang || typeof lang !== "string") return null;
  const norm = normalizeLanguageCode(lang);
  if (!norm) return null;
  const code = norm.split("-")[0].toLowerCase();
  if (!/^[a-z]{2,3}$/.test(code)) {
    return null;
  }
  return code;
};

const isKnownVariant = (
  variant: string | null | undefined,
  primaryLang: string,
  countryCode: string | null
): boolean => {
  if (!variant || typeof variant !== "string") return false;
  const trimmed = variant.trim();
  if (!trimmed) return false;

  if (countryCode && REGIONAL_LANGUAGE_CATALOG[countryCode]) {
    const catalog = REGIONAL_LANGUAGE_CATALOG[countryCode];
    if (
      catalog.defaultInterfaceLanguage.toLowerCase() ===
      trimmed.toLowerCase()
    ) {
      return true;
    }
    const foundRegional = catalog.regionalOptions.some(
      (opt) => opt.id.toLowerCase() === trimmed.toLowerCase()
    );
    if (foundRegional) return true;
  }

  if (/^[a-z]{2,3}-[A-Za-z]{2,4}$/.test(trimmed)) {
    const norm = normalizeLanguageCode(trimmed);
    if (norm && norm.toLowerCase().startsWith(primaryLang.toLowerCase())) {
      return true;
    }
  }

  const knownDialects = [
    "umbundu",
    "kimbundu",
    "kikongo",
    "cokwe",
    "kwanyama",
    "ngangela",
    "fiote",
    "nhaneka",
    "luvale",
    "makhuwa",
    "xitsonga",
    "sena",
  ];
  if (knownDialects.includes(trimmed.toLowerCase())) {
    return true;
  }

  return false;
};

export const resolveGeoLinguisticProfile = (
  input: GeoLinguisticProfileInput = {}
): GeoLinguisticProfile => {
  let fallbackApplied = false;

  const hasExplicitPreference = Boolean(
    (input.primaryLanguage && typeof input.primaryLanguage === "string" && input.primaryLanguage.trim()) ||
    (input.interfaceLanguage && typeof input.interfaceLanguage === "string" && input.interfaceLanguage.trim()) ||
    (input.preferredInterfaceLanguage && typeof input.preferredInterfaceLanguage === "string" && input.preferredInterfaceLanguage.trim()) ||
    (input.userPreference && typeof input.userPreference === "string" && input.userPreference.trim()) ||
    (input.languageVariant && typeof input.languageVariant === "string" && input.languageVariant.trim()) ||
    (input.variant && typeof input.variant === "string" && input.variant.trim())
  );

  const hasStoredProfile = Boolean(
    input.storedPreferences &&
    (input.storedPreferences.primaryLanguage ||
      input.storedPreferences.interfaceLanguage ||
      input.storedPreferences.countryCode)
  );

  const hasAuthorizedLocation = Boolean(
    (input.authorizedLocation && input.authorizedLocation.countryCode) ||
    (input.locationData && input.locationData.countryCode)
  );

  const resolvedCountryCode = resolveCountryCodeFromCandidates([
    input.countryCode,
    input.country,
    input.storedPreferences?.countryCode,
    input.authorizedLocation?.countryCode,
    input.locationData?.countryCode,
    input.declaredOrigin,
  ]);

  const rawCountryInput =
    input.countryCode ||
    input.country ||
    input.storedPreferences?.countryCode ||
    input.authorizedLocation?.countryCode ||
    input.locationData?.countryCode ||
    input.declaredOrigin;

  if (rawCountryInput && !resolvedCountryCode) {
    fallbackApplied = true;
  }

  const resolvedRegionCode = resolveRegionCodeFromCandidates([
    input.regionCode,
    input.region,
    input.province,
    input.storedPreferences?.regionCode,
    input.authorizedLocation?.regionCode,
    input.locationData?.regionCode,
  ]);

  let rawPrimary =
    input.primaryLanguage ||
    input.storedPreferences?.primaryLanguage ||
    input.interfaceLanguage ||
    input.preferredInterfaceLanguage ||
    input.userPreference ||
    input.storedPreferences?.interfaceLanguage;

  let resolvedPrimaryLanguage: string | null = null;
  if (rawPrimary && typeof rawPrimary === "string") {
    resolvedPrimaryLanguage = extractPrimaryCode(rawPrimary);
    if (!resolvedPrimaryLanguage) {
      fallbackApplied = true;
    }
  }

  if (!resolvedPrimaryLanguage && resolvedCountryCode && REGIONAL_LANGUAGE_CATALOG[resolvedCountryCode]) {
    const catalog = REGIONAL_LANGUAGE_CATALOG[resolvedCountryCode];
    resolvedPrimaryLanguage = catalog.officialLanguages[0]?.code || "pt";
  }

  if (!resolvedPrimaryLanguage) {
    resolvedPrimaryLanguage = DEFAULT_FALLBACK_PROFILE.primaryLanguage;
    fallbackApplied = true;
  }

  let rawInterface =
    input.interfaceLanguage ||
    input.preferredInterfaceLanguage ||
    input.userPreference ||
    input.storedPreferences?.interfaceLanguage;

  let resolvedInterfaceLanguage: string | null = null;
  if (rawInterface && typeof rawInterface === "string") {
    resolvedInterfaceLanguage = normalizeLanguageCode(rawInterface);
  }

  if (!resolvedInterfaceLanguage && resolvedCountryCode && REGIONAL_LANGUAGE_CATALOG[resolvedCountryCode]) {
    resolvedInterfaceLanguage = REGIONAL_LANGUAGE_CATALOG[resolvedCountryCode].defaultInterfaceLanguage;
  }

  if (!resolvedInterfaceLanguage) {
    if (resolvedCountryCode === "AO") {
      resolvedInterfaceLanguage = "pt-AO";
    } else {
      resolvedInterfaceLanguage = resolvedPrimaryLanguage;
    }
    fallbackApplied = true;
  }

  let rawVariant =
    input.languageVariant ||
    input.variant ||
    input.storedPreferences?.languageVariant;

  let resolvedVariant: string | null = null;

  if (rawVariant && typeof rawVariant === "string" && rawVariant.trim()) {
    const trimmed = rawVariant.trim();
    if (isKnownVariant(trimmed, resolvedPrimaryLanguage, resolvedCountryCode)) {
      resolvedVariant = trimmed.includes("-") ? (normalizeLanguageCode(trimmed) || trimmed) : trimmed;
    } else {
      fallbackApplied = true;
    }
  }

  if (!resolvedVariant) {
    if (resolvedInterfaceLanguage.includes("-")) {
      resolvedVariant = resolvedInterfaceLanguage;
    } else if (resolvedCountryCode === "AO" && resolvedPrimaryLanguage === "pt") {
      resolvedVariant = "pt-AO";
    }
  }

  const rawSecondary = [
    ...(input.secondaryLanguages || []),
    ...(input.storedPreferences?.secondaryLanguages || []),
  ];

  const processedSecondary: string[] = [];
  for (const item of rawSecondary) {
    if (!item || typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    const norm = normalizeLanguageCode(trimmed) || trimmed.toLowerCase();

    if (
      norm.toLowerCase() === resolvedPrimaryLanguage.toLowerCase() ||
      norm.toLowerCase().split("-")[0] === resolvedPrimaryLanguage.toLowerCase()
    ) {
      continue;
    }

    if (!processedSecondary.includes(norm)) {
      processedSecondary.push(norm);
    }
  }

  let resolutionSource: ResolutionSource;
  let confidence: ResolutionConfidence;

  if (hasExplicitPreference) {
    resolutionSource = "explicit-preference";
    confidence = "high";
  } else if (hasStoredProfile) {
    resolutionSource = "stored-profile";
    confidence = "high";
  } else if (hasAuthorizedLocation) {
    resolutionSource = "authorized-location";
    confidence = "medium";
  } else if (resolvedCountryCode && REGIONAL_LANGUAGE_CATALOG[resolvedCountryCode]) {
    resolutionSource = "country-default";
    confidence = "medium";
  } else {
    resolutionSource = "system-default";
    confidence = "low";
    fallbackApplied = true;
  }

  const locale = resolvedCountryCode
    ? `${resolvedPrimaryLanguage}_${resolvedCountryCode}`
    : resolvedPrimaryLanguage;

  const culturalContext: CulturalContext = {
    countryCode: resolvedCountryCode,
    regionCode: resolvedRegionCode,
    language: resolvedPrimaryLanguage,
    variant: resolvedVariant,
  };

  const profile: GeoLinguisticProfile = {
    countryCode: resolvedCountryCode,
    regionCode: resolvedRegionCode,
    primaryLanguage: resolvedPrimaryLanguage,
    interfaceLanguage: resolvedInterfaceLanguage,
    languageVariant: resolvedVariant,
    secondaryLanguages: processedSecondary,
    locale,
    culturalContext,
    resolutionSource,
    confidence,
    fallbackApplied,
  };

  return deepFreeze(profile);
};
