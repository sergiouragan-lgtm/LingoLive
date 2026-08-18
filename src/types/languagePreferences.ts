export type InterfaceLanguageSource =
  | "browser"
  | "region"
  | "user"
  | "account-default"
  | "fallback";

export type RegionalLanguageKind =
  | "official"
  | "national"
  | "regional"
  | "indigenous"
  | "dialect";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export interface RegionalVariantOption {
  code: string;
  languageCode: string;
  countryCode?: string;
  name: string;
  nativeName: string;
}

export interface NativeDialectOption {
  id: string;
  name: string;
  nativeName?: string;
  countryCodes: string[];
  languageCode?: string;
  kind: RegionalLanguageKind;
}

export interface LanguagePreferences {
  interfaceLanguage: string;
  interfaceLanguageSource: InterfaceLanguageSource;
  nativeLanguage: string | null;
  learningLanguage: string | null;
  regionalVariant: string | null;
  nativeDialect: string | null;
}

export const normalizeLanguageCode = (
  value: string | null | undefined
): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed === "") {
    return null;
  }

  const parts = trimmed
    .split(/[-_]/)
    .filter(Boolean);

  if (parts.length === 0) {
    return null;
  }

  return parts
    .map((part, index) => {
      if (index === 0) {
        return part.toLowerCase();
      }

      if (/^[A-Za-z]{4}$/.test(part)) {
        return (
          part.charAt(0).toUpperCase() +
          part.slice(1).toLowerCase()
        );
      }

      if (/^[A-Za-z]{2}$/.test(part)) {
        return part.toUpperCase();
      }

      if (/^\d{3}$/.test(part)) {
        return part;
      }

      return part.toLowerCase();
    })
    .join("-");
};

export const DEFAULT_LANGUAGE_PREFERENCES: Readonly<LanguagePreferences> = Object.freeze({
  interfaceLanguage: "en",
  interfaceLanguageSource: "fallback",
  nativeLanguage: null,
  learningLanguage: null,
  regionalVariant: null,
  nativeDialect: null,
});

export const createLanguagePreferences = (
  input?: Partial<LanguagePreferences>
): LanguagePreferences => {
  const sourceInput = input ? { ...input } : {};

  const normalizedInterface = normalizeLanguageCode(sourceInput.interfaceLanguage);
  const interfaceLanguage = normalizedInterface || DEFAULT_LANGUAGE_PREFERENCES.interfaceLanguage;

  const interfaceLanguageSource =
    sourceInput.interfaceLanguageSource || DEFAULT_LANGUAGE_PREFERENCES.interfaceLanguageSource;

  const nativeLanguage =
    sourceInput.nativeLanguage !== undefined && sourceInput.nativeLanguage !== null
      ? normalizeLanguageCode(sourceInput.nativeLanguage) || sourceInput.nativeLanguage.trim() || null
      : DEFAULT_LANGUAGE_PREFERENCES.nativeLanguage;

  const learningLanguage =
    sourceInput.learningLanguage !== undefined && sourceInput.learningLanguage !== null
      ? normalizeLanguageCode(sourceInput.learningLanguage) || sourceInput.learningLanguage.trim() || null
      : DEFAULT_LANGUAGE_PREFERENCES.learningLanguage;

  const regionalVariant =
    sourceInput.regionalVariant !== undefined && sourceInput.regionalVariant !== null
      ? normalizeLanguageCode(sourceInput.regionalVariant) || sourceInput.regionalVariant.trim() || null
      : DEFAULT_LANGUAGE_PREFERENCES.regionalVariant;

  const nativeDialect =
    sourceInput.nativeDialect !== undefined && sourceInput.nativeDialect !== null
      ? typeof sourceInput.nativeDialect === "string"
        ? sourceInput.nativeDialect.trim() || null
        : null
      : DEFAULT_LANGUAGE_PREFERENCES.nativeDialect;

  return {
    interfaceLanguage,
    interfaceLanguageSource,
    nativeLanguage,
    learningLanguage,
    regionalVariant,
    nativeDialect,
  };
};
