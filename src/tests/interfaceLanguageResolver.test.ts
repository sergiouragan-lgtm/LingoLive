import { describe, it, expect } from "vitest";
import {
  resolveInterfaceLanguage,
  InterfaceLanguageResolutionInput,
} from "../services/interfaceLanguageResolver";
import { REGIONAL_LANGUAGE_CATALOG } from "../data/regionalLanguageCatalog";

describe("Interface Language Resolver", () => {
  it("CASO 1: userPreference takes highest priority", () => {
    const res = resolveInterfaceLanguage({
      userPreference: "fr-FR",
      accountDefault: "pt-AO",
      countryCode: "AO",
      browserLanguages: ["en-US"],
      fallbackLanguage: "en",
    });
    expect(res).toEqual({
      language: "fr-FR",
      source: "user",
      matchedInput: "fr-FR",
    });
  });

  it("CASO 2: accountDefault takes priority over countryCode and browserLanguages", () => {
    const res = resolveInterfaceLanguage({
      accountDefault: "pt-AO",
      countryCode: "FR",
      browserLanguages: ["en-US"],
    });
    expect(res).toEqual({
      language: "pt-AO",
      source: "account-default",
      matchedInput: "pt-AO",
    });
  });

  it("CASO 3: countryCode 'AO' resolves to 'pt-AO' with source 'region'", () => {
    const res = resolveInterfaceLanguage({
      countryCode: "AO",
    });
    expect(res).toEqual({
      language: "pt-AO",
      source: "region",
      matchedInput: "pt-AO",
    });
  });

  it("CASO 4: countryCode 'FR' resolves to 'fr-FR' with source 'region'", () => {
    const res = resolveInterfaceLanguage({
      countryCode: "FR",
    });
    expect(res).toEqual({
      language: "fr-FR",
      source: "region",
      matchedInput: "fr-FR",
    });
  });

  it("CASO 5: countryCode 'JP' resolves to 'ja-JP' with source 'region'", () => {
    const res = resolveInterfaceLanguage({
      countryCode: "JP",
    });
    expect(res).toEqual({
      language: "ja-JP",
      source: "region",
      matchedInput: "ja-JP",
    });
  });

  it("CASO 6: unknown countryCode 'ZZ' falls back to browserLanguages", () => {
    const res = resolveInterfaceLanguage({
      countryCode: "ZZ",
      browserLanguages: ["es-MX", "en-US"],
    });
    expect(res).toEqual({
      language: "es-MX",
      source: "browser",
      matchedInput: "es-MX",
    });
  });

  it("CASO 7: browserLanguages order is respected", () => {
    const res = resolveInterfaceLanguage({
      browserLanguages: ["fr-CA", "en-US"],
    });
    expect(res).toEqual({
      language: "fr-CA",
      source: "browser",
      matchedInput: "fr-CA",
    });
  });

  it("CASO 8: empty input defaults to 'en' with source 'fallback'", () => {
    const res = resolveInterfaceLanguage({});
    expect(res).toEqual({
      language: "en",
      source: "fallback",
      matchedInput: "en",
    });
  });

  it("CASO 9: matches primary language when exact regional variant is not in supported list", () => {
    const res = resolveInterfaceLanguage({
      countryCode: "AO",
      supportedInterfaceLanguages: ["pt", "en"],
    });
    expect(res).toEqual({
      language: "pt",
      source: "region",
      matchedInput: "pt-AO",
    });
  });

  it("CASO 10: exact match is preferred when supported list contains regional variant", () => {
    const res = resolveInterfaceLanguage({
      countryCode: "AO",
      supportedInterfaceLanguages: ["pt-AO", "pt-BR", "en"],
    });
    expect(res).toEqual({
      language: "pt-AO",
      source: "region",
      matchedInput: "pt-AO",
    });
  });

  it("CASO 11: skips unsupported regional language and falls back to browser language", () => {
    const res = resolveInterfaceLanguage({
      countryCode: "JP",
      browserLanguages: ["fr-FR", "en-US"],
      supportedInterfaceLanguages: ["fr", "en"],
    });
    expect(res).toEqual({
      language: "fr",
      source: "browser",
      matchedInput: "fr-FR",
    });
  });

  it("CASO 12: fallback to first supported language when no candidate matches supported list", () => {
    const res = resolveInterfaceLanguage({
      fallbackLanguage: "de-DE",
      supportedInterfaceLanguages: ["pt", "fr"],
    });
    expect(res).toEqual({
      language: "pt",
      source: "fallback",
      matchedInput: "pt",
    });
  });

  it("CASO 13: normalizes underscores in inputs", () => {
    const res = resolveInterfaceLanguage({
      userPreference: "pt_AO",
    });
    expect(res).toEqual({
      language: "pt-AO",
      source: "user",
      matchedInput: "pt-AO",
    });
  });

  it("CASO 14: invalid or blank inputs are ignored safely", () => {
    const res = resolveInterfaceLanguage({
      userPreference: "   ",
      accountDefault: "",
      countryCode: "123",
      browserLanguages: ["", "   "],
      fallbackLanguage: null,
    });
    expect(res).toEqual({
      language: "en",
      source: "fallback",
      matchedInput: "en",
    });
  });

  it("guarantees input immutability and does not mutate arrays or external catalog", () => {
    const input: InterfaceLanguageResolutionInput = {
      userPreference: "PT_ao",
      browserLanguages: ["FR_fr", "EN_us"],
      supportedInterfaceLanguages: ["pt", "fr", "en"],
    };

    const snapshot = JSON.stringify(input);
    const catalogIsFrozenBefore = Object.isFrozen(REGIONAL_LANGUAGE_CATALOG);

    resolveInterfaceLanguage(input);

    expect(JSON.stringify(input)).toBe(snapshot);
    expect(input.browserLanguages).toEqual(["FR_fr", "EN_us"]);
    expect(input.supportedInterfaceLanguages).toEqual(["pt", "fr", "en"]);
    expect(Object.isFrozen(REGIONAL_LANGUAGE_CATALOG)).toBe(catalogIsFrozenBefore);
  });
});
