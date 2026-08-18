import { describe, it, expect } from "vitest";
import {
  resolveGeoLinguisticProfile,
  GeoLinguisticProfileInput,
} from "./geoLinguisticProfileResolver";
import { REGIONAL_LANGUAGE_CATALOG } from "../../data/regionalLanguageCatalog";

describe("GeoLinguistic Profile Resolver", () => {
  it("TESTE 1 — PREFERÊNCIA EXPLÍCITA COMPLETA", () => {
    const input: GeoLinguisticProfileInput = {
      countryCode: "AO",
      regionCode: "LUA",
      primaryLanguage: "pt",
      interfaceLanguage: "pt-AO",
      languageVariant: "pt-AO",
    };

    const result = resolveGeoLinguisticProfile(input);

    expect(result.countryCode).toBe("AO");
    expect(result.regionCode).toBe("LUA");
    expect(result.primaryLanguage).toBe("pt");
    expect(result.interfaceLanguage).toBe("pt-AO");
    expect(result.languageVariant).toBe("pt-AO");
    expect(result.resolutionSource).toBe("explicit-preference");
    expect(result.confidence).toBe("high");
    expect(result.fallbackApplied).toBe(false);
  });

  it("TESTE 2 — PERFIL ANGOLANO", () => {
    const input: GeoLinguisticProfileInput = {
      countryCode: "AO",
      primaryLanguage: "pt",
      languageVariant: "pt-AO",
    };

    const result = resolveGeoLinguisticProfile(input);

    expect(result.countryCode).toBe("AO");
    expect(result.primaryLanguage).toBe("pt");
    expect(result.locale).toBe("pt_AO");
    expect(result.culturalContext).toEqual({
      countryCode: "AO",
      regionCode: null,
      language: "pt",
      variant: "pt-AO",
    });
    expect(["high", "medium"]).toContain(result.confidence);
    expect(result.fallbackApplied).toBe(false);
  });

  it("TESTE 3 — PREFERÊNCIA EXPLÍCITA VENCE LOCALIZAÇÃO", () => {
    const input: GeoLinguisticProfileInput = {
      primaryLanguage: "fr",
      interfaceLanguage: "fr-FR",
      authorizedLocation: {
        countryCode: "AO",
        regionCode: "LUA",
      },
    };

    const result = resolveGeoLinguisticProfile(input);

    expect(result.primaryLanguage).toBe("fr");
    expect(result.interfaceLanguage).toBe("fr-FR");
    expect(result.resolutionSource).toBe("explicit-preference");
    expect(result.countryCode).toBe("AO");
  });

  it("TESTE 4 — PERFIL GUARDADO VENCE PADRÃO DO PAÍS", () => {
    const input: GeoLinguisticProfileInput = {
      storedPreferences: {
        primaryLanguage: "en",
        interfaceLanguage: "en-US",
        countryCode: "AO",
      },
    };

    const result = resolveGeoLinguisticProfile(input);

    expect(result.primaryLanguage).toBe("en");
    expect(result.interfaceLanguage).toBe("en-US");
    expect(result.resolutionSource).toBe("stored-profile");
    expect(result.confidence).toBe("high");
  });

  it("TESTE 5 — APENAS PAÍS", () => {
    const input: GeoLinguisticProfileInput = {
      countryCode: "AO",
    };

    const result = resolveGeoLinguisticProfile(input);

    expect(result.countryCode).toBe("AO");
    expect(result.primaryLanguage).toBe("pt");
    expect(result.interfaceLanguage).toBe("pt-AO");
    expect(result.locale).toBe("pt_AO");
    expect(result.resolutionSource).toBe("country-default");
    expect(result.confidence).toBe("medium");
    expect(result.fallbackApplied).toBe(false);
  });

  it("TESTE 6 — APENAS IDIOMA", () => {
    const input: GeoLinguisticProfileInput = {
      primaryLanguage: "es",
    };

    const result = resolveGeoLinguisticProfile(input);

    expect(result.primaryLanguage).toBe("es");
    expect(result.countryCode).toBeNull();
    expect(result.regionCode).toBeNull();
    expect(result.locale).toBe("es");
    expect(result.resolutionSource).toBe("explicit-preference");
  });

  it("TESTE 7 — ENTRADA VAZIA", () => {
    const result = resolveGeoLinguisticProfile({});

    expect(result.primaryLanguage).toBeDefined();
    expect(result.interfaceLanguage).toBeDefined();
    expect(result.locale).toBeDefined();
    expect(result.resolutionSource).toBe("system-default");
    expect(result.confidence).toBe("low");
    expect(result.fallbackApplied).toBe(true);
  });

  it("TESTE 8 — CÓDIGO DESCONHECIDO", () => {
    const input: GeoLinguisticProfileInput = {
      countryCode: "XYZ",
      primaryLanguage: "invalidlang",
      languageVariant: "unknownvar",
    };

    const result = resolveGeoLinguisticProfile(input);

    expect(result).toBeDefined();
    expect(result.primaryLanguage).toBe("pt");
    expect(result.fallbackApplied).toBe(true);
  });

  it("TESTE 9 — NORMALIZAÇÃO", () => {
    const input: GeoLinguisticProfileInput = {
      countryCode: " ao ",
      primaryLanguage: " PT-ao ",
      regionCode: " lua ",
    };

    const result = resolveGeoLinguisticProfile(input);

    expect(result.countryCode).toBe("AO");
    expect(result.primaryLanguage).toBe("pt");
    expect(result.interfaceLanguage).toBe("pt-AO");
    expect(result.regionCode).toBe("LUA");
  });

  it("TESTE 10 — IDIOMAS SECUNDÁRIOS", () => {
    const input: GeoLinguisticProfileInput = {
      primaryLanguage: "pt",
      secondaryLanguages: [
        "pt",
        "pt-AO",
        "umbundu",
        "umbundu",
        "kimbundu",
        "   ",
        "",
      ],
    };

    const result = resolveGeoLinguisticProfile(input);

    expect(result.secondaryLanguages).toEqual(["umbundu", "kimbundu"]);
  });

  it("TESTE 11 — IMUTABILIDADE", () => {
    const secondaryList = Object.freeze(["umbundu"]);
    const input: GeoLinguisticProfileInput = Object.freeze({
      countryCode: "AO",
      primaryLanguage: "pt",
      secondaryLanguages: secondaryList,
    });

    const result = resolveGeoLinguisticProfile(input);

    expect(Object.isFrozen(input)).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.secondaryLanguages)).toBe(true);
    expect(Object.isFrozen(result.culturalContext)).toBe(true);
  });

  it("TESTE 12 — DETERMINISMO", () => {
    const input: GeoLinguisticProfileInput = {
      countryCode: "AO",
      regionCode: "LUA",
      primaryLanguage: "pt",
    };

    const result1 = resolveGeoLinguisticProfile(input);
    const result2 = resolveGeoLinguisticProfile(input);

    expect(result1).toEqual(result2);
  });

  it("TESTE 13 — VARIANTE INVÁLIDA", () => {
    const input: GeoLinguisticProfileInput = {
      primaryLanguage: "pt",
      languageVariant: "nonexistent_variant_123",
    };

    const result = resolveGeoLinguisticProfile(input);

    expect(result.primaryLanguage).toBe("pt");
    expect(result.languageVariant).not.toBe("nonexistent_variant_123");
    expect(result.fallbackApplied).toBe(true);
  });

  it("TESTE 14 — LOCALIZAÇÃO AUTORIZADA", () => {
    const input: GeoLinguisticProfileInput = {
      authorizedLocation: {
        countryCode: "MZ",
        regionCode: "MPM",
      },
    };

    const result = resolveGeoLinguisticProfile(input);

    expect(result.countryCode).toBe("MZ");
    expect(result.regionCode).toBe("MPM");
    expect(result.primaryLanguage).toBe("pt");
    expect(result.interfaceLanguage).toBe("pt-MZ");
    expect(result.resolutionSource).toBe("authorized-location");
  });

  it("TESTE 15 — PRESERVAÇÃO DO CATÁLOGO", () => {
    const originalAo = JSON.stringify(REGIONAL_LANGUAGE_CATALOG["AO"]);

    resolveGeoLinguisticProfile({ countryCode: "AO" });
    resolveGeoLinguisticProfile({ countryCode: "MZ" });

    const currentAo = JSON.stringify(REGIONAL_LANGUAGE_CATALOG["AO"]);
    expect(currentAo).toBe(originalAo);
  });
});
