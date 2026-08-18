import { describe, it, expect } from "vitest";
import {
  DEFAULT_LANGUAGE_PREFERENCES,
  createLanguagePreferences,
  normalizeLanguageCode,
  LanguagePreferences,
} from "../types/languagePreferences";

describe("Language Preferences Central Model", () => {
  it("DEFAULT_LANGUAGE_PREFERENCES has all required fields with default values", () => {
    expect(DEFAULT_LANGUAGE_PREFERENCES.interfaceLanguage).toBe("en");
    expect(DEFAULT_LANGUAGE_PREFERENCES.interfaceLanguageSource).toBe("fallback");
    expect(DEFAULT_LANGUAGE_PREFERENCES.nativeLanguage).toBeNull();
    expect(DEFAULT_LANGUAGE_PREFERENCES.learningLanguage).toBeNull();
    expect(DEFAULT_LANGUAGE_PREFERENCES.regionalVariant).toBeNull();
    expect(DEFAULT_LANGUAGE_PREFERENCES.nativeDialect).toBeNull();
  });

  it("normalizeLanguageCode handles required examples correctly", () => {
    expect(normalizeLanguageCode("PT")).toBe("pt");
    expect(normalizeLanguageCode("pt-ao")).toBe("pt-AO");
    expect(normalizeLanguageCode("EN-us")).toBe("en-US");
    expect(normalizeLanguageCode(" es-MX ")).toBe("es-MX");
    expect(normalizeLanguageCode("")).toBeNull();
    expect(normalizeLanguageCode(null)).toBeNull();
    expect(normalizeLanguageCode(undefined)).toBeNull();

    // BCP 47 subtags: script, region, numeric, underscore, variant
    expect(normalizeLanguageCode("zh-hans-cn")).toBe("zh-Hans-CN");
    expect(normalizeLanguageCode("zh-Hant-TW")).toBe("zh-Hant-TW");
    expect(normalizeLanguageCode("sr-latn-rs")).toBe("sr-Latn-RS");
    expect(normalizeLanguageCode("sr_Cyrl_RS")).toBe("sr-Cyrl-RS");
    expect(normalizeLanguageCode("es-419")).toBe("es-419");
    expect(normalizeLanguageCode("en-latn-us-posix")).toBe("en-Latn-US-posix");
    expect(normalizeLanguageCode("de-DE-1996")).toBe("de-DE-1996");
  });

  it("createLanguagePreferences handles Case A", () => {
    const preferences = createLanguagePreferences({
      interfaceLanguage: "pt-AO",
      learningLanguage: "es",
      nativeLanguage: "pt",
      nativeDialect: "umbundu",
    });

    expect(preferences.interfaceLanguage).toBe("pt-AO");
    expect(preferences.learningLanguage).toBe("es");
    expect(preferences.nativeLanguage).toBe("pt");
    expect(preferences.nativeDialect).toBe("umbundu");
    expect(preferences.regionalVariant).toBeNull();
  });

  it("createLanguagePreferences handles Case B", () => {
    const preferences = createLanguagePreferences({
      interfaceLanguage: "fr-FR",
      learningLanguage: "en",
      nativeLanguage: "wolof",
      nativeDialect: null,
    });

    expect(preferences.interfaceLanguage).toBe("fr-FR");
    expect(preferences.learningLanguage).toBe("en");
    expect(preferences.nativeLanguage).toBe("wolof");
    expect(preferences.nativeDialect).toBeNull();
  });

  it("createLanguagePreferences handles Case C", () => {
    const preferences = createLanguagePreferences({
      interfaceLanguage: "ja-JP",
      learningLanguage: null,
    });

    expect(preferences.interfaceLanguage).toBe("ja-JP");
    expect(preferences.learningLanguage).toBeNull();
  });

  it("createLanguagePreferences handles Case D (absent interface language uses fallback 'en')", () => {
    const preferences = createLanguagePreferences({
      nativeLanguage: "pt",
      learningLanguage: "es",
    });

    expect(preferences.interfaceLanguage).toBe("en");
    expect(preferences.interfaceLanguageSource).toBe("fallback");
    expect(preferences.nativeLanguage).toBe("pt");
    expect(preferences.learningLanguage).toBe("es");
    expect(preferences.nativeDialect).toBeNull();
  });

  it("createLanguagePreferences does not mutate the input object", () => {
    const input: Partial<LanguagePreferences> = {
      interfaceLanguage: "pt",
      learningLanguage: "en",
    };
    const inputCopy = { ...input };

    createLanguagePreferences(input);

    expect(input).toEqual(inputCopy);
  });
});
