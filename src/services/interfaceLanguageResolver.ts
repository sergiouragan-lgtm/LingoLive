import {
  InterfaceLanguageSource,
  normalizeLanguageCode,
} from "../types/languagePreferences";
import { getDefaultInterfaceLanguageForCountry } from "../data/regionalLanguageCatalog";

export interface InterfaceLanguageResolutionInput {
  userPreference?: string | null;
  accountDefault?: string | null;
  countryCode?: string | null;
  browserLanguages?: readonly string[] | null;
  supportedInterfaceLanguages?: readonly string[] | null;
  fallbackLanguage?: string | null;
}

export interface InterfaceLanguageResolution {
  language: string;
  source: InterfaceLanguageSource;
  matchedInput: string | null;
}

const matchSupportedInterfaceLanguage = (
  candidate: string | null | undefined,
  supportedLanguages?: readonly string[] | null
): string | null => {
  if (candidate === null || candidate === undefined) {
    return null;
  }
  const normCandidate = normalizeLanguageCode(candidate);
  if (normCandidate === null) {
    return null;
  }

  if (supportedLanguages === null || supportedLanguages === undefined) {
    return normCandidate;
  }

  const normSupported: string[] = [];
  for (const item of supportedLanguages) {
    const normItem = normalizeLanguageCode(item);
    if (normItem !== null && !normSupported.includes(normItem)) {
      normSupported.push(normItem);
    }
  }

  if (normSupported.length === 0) {
    return null;
  }

  if (normSupported.includes(normCandidate)) {
    return normCandidate;
  }

  const primaryCandidate = normCandidate.split("-")[0];

  if (normSupported.includes(primaryCandidate)) {
    return primaryCandidate;
  }

  const variantMatch = normSupported.find(
    (item) => item.split("-")[0] === primaryCandidate
  );
  if (variantMatch !== undefined) {
    return variantMatch;
  }

  return null;
};

export const resolveInterfaceLanguage = (
  input: InterfaceLanguageResolutionInput = {}
): InterfaceLanguageResolution => {
  // 1. userPreference
  if (input.userPreference !== undefined && input.userPreference !== null) {
    const matched = matchSupportedInterfaceLanguage(
      input.userPreference,
      input.supportedInterfaceLanguages
    );
    if (matched !== null) {
      return {
        language: matched,
        source: "user",
        matchedInput: normalizeLanguageCode(input.userPreference),
      };
    }
  }

  // 2. accountDefault
  if (input.accountDefault !== undefined && input.accountDefault !== null) {
    const matched = matchSupportedInterfaceLanguage(
      input.accountDefault,
      input.supportedInterfaceLanguages
    );
    if (matched !== null) {
      return {
        language: matched,
        source: "account-default",
        matchedInput: normalizeLanguageCode(input.accountDefault),
      };
    }
  }

  // 3. countryCode
  if (input.countryCode !== undefined && input.countryCode !== null) {
    const regionalLang = getDefaultInterfaceLanguageForCountry(
      input.countryCode
    );
    if (regionalLang !== null) {
      const matched = matchSupportedInterfaceLanguage(
        regionalLang,
        input.supportedInterfaceLanguages
      );
      if (matched !== null) {
        return {
          language: matched,
          source: "region",
          matchedInput: normalizeLanguageCode(regionalLang),
        };
      }
    }
  }

  // 4. browserLanguages
  if (
    input.browserLanguages !== undefined &&
    input.browserLanguages !== null &&
    Array.isArray(input.browserLanguages)
  ) {
    for (const bLang of input.browserLanguages) {
      if (bLang === null || bLang === undefined) continue;
      const normBLang = normalizeLanguageCode(bLang);
      if (normBLang === null) continue;
      const matched = matchSupportedInterfaceLanguage(
        bLang,
        input.supportedInterfaceLanguages
      );
      if (matched !== null) {
        return {
          language: matched,
          source: "browser",
          matchedInput: normBLang,
        };
      }
    }
  }

  // 5. fallbackLanguage
  if (input.fallbackLanguage !== undefined && input.fallbackLanguage !== null) {
    const normFallback = normalizeLanguageCode(input.fallbackLanguage);
    if (normFallback !== null) {
      const matched = matchSupportedInterfaceLanguage(
        input.fallbackLanguage,
        input.supportedInterfaceLanguages
      );
      if (matched !== null) {
        return {
          language: matched,
          source: "fallback",
          matchedInput: normFallback,
        };
      }
    }
  }

  // 6. Internal fallback "en"
  const matchedEn = matchSupportedInterfaceLanguage(
    "en",
    input.supportedInterfaceLanguages
  );
  if (matchedEn !== null) {
    return {
      language: matchedEn,
      source: "fallback",
      matchedInput: "en",
    };
  }

  // 7. First supported language
  if (
    input.supportedInterfaceLanguages !== undefined &&
    input.supportedInterfaceLanguages !== null
  ) {
    for (const item of input.supportedInterfaceLanguages) {
      const normItem = normalizeLanguageCode(item);
      if (normItem !== null) {
        return {
          language: normItem,
          source: "fallback",
          matchedInput: normItem,
        };
      }
    }
  }

  // 8. Final safety fallback
  return {
    language: "en",
    source: "fallback",
    matchedInput: "en",
  };
};
