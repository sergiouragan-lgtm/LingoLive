import { describe, it, expect } from "vitest";
import {
  REGIONAL_LANGUAGE_CATALOG,
  normalizeCountryCode,
  getCountryLanguageProfile,
  getDefaultInterfaceLanguageForCountry,
  getRegionalLanguageOptions,
  getAvailableLanguageOptionsForCountry,
} from "../data/regionalLanguageCatalog";

describe("Central Regional Language Catalog", () => {
  it("catalog contains the 10 original countries plus the 10 expandidos nesta sessão (20 no total), todos com chaves maiúsculas", () => {
    const keys = Object.keys(REGIONAL_LANGUAGE_CATALOG);
    expect(keys.sort()).toEqual(
      [
        "AO", "BR", "CA", "ES", "FR", "JP", "MX", "MZ", "US", "ZA", // 10 originais
        "CV", "GW", "ST", "TL", "NG", "GB", "DE", "IT", "CN", "IN", // 10 expandidos (lusofonia + mercados globais)
      ].sort()
    );
    keys.forEach((key) => {
      expect(key).toBe(key.toUpperCase());
      expect(REGIONAL_LANGUAGE_CATALOG[key].countryCode).toBe(key);
    });
  });

  it("normalizeCountryCode handles required cases", () => {
    expect(normalizeCountryCode("ao")).toBe("AO");
    expect(normalizeCountryCode(" Ao ")).toBe("AO");
    expect(normalizeCountryCode("USA")).toBeNull();
    expect(normalizeCountryCode("A1")).toBeNull();
    expect(normalizeCountryCode("")).toBeNull();
    expect(normalizeCountryCode(null)).toBeNull();
    expect(normalizeCountryCode(undefined)).toBeNull();
  });

  it("getDefaultInterfaceLanguageForCountry returns correct default language per country", () => {
    expect(getDefaultInterfaceLanguageForCountry("AO")).toBe("pt-AO");
    expect(getDefaultInterfaceLanguageForCountry("MZ")).toBe("pt-MZ");
    expect(getDefaultInterfaceLanguageForCountry("ZA")).toBe("en-ZA");
    expect(getDefaultInterfaceLanguageForCountry("FR")).toBe("fr-FR");
    expect(getDefaultInterfaceLanguageForCountry("ES")).toBe("es-ES");
    expect(getDefaultInterfaceLanguageForCountry("CA")).toBe("en-CA");
    expect(getDefaultInterfaceLanguageForCountry("BR")).toBe("pt-BR");
    expect(getDefaultInterfaceLanguageForCountry("JP")).toBe("ja-JP");
    expect(getDefaultInterfaceLanguageForCountry("MX")).toBe("es-MX");
    expect(getDefaultInterfaceLanguageForCountry("US")).toBe("en-US");
    expect(getDefaultInterfaceLanguageForCountry("ZZ")).toBeNull();
  });

  it("getRegionalLanguageOptions returns regional options for specific countries", () => {
    const angolaOptions = getRegionalLanguageOptions("AO");
    const angolaIds = angolaOptions.map((o) => o.id);
    expect(angolaIds).toContain("umbundu");
    expect(angolaIds).toContain("kimbundu");

    const mozambiqueOptions = getRegionalLanguageOptions("MZ");
    expect(mozambiqueOptions.map((o) => o.id)).toContain("makhuwa");

    const spainOptions = getRegionalLanguageOptions("ES");
    expect(spainOptions.map((o) => o.id)).toContain("catalan");

    const brazilOptions = getRegionalLanguageOptions("BR");
    expect(brazilOptions.map((o) => o.id)).toContain("guarani");

    const canadaOptions = getRegionalLanguageOptions("CA");
    expect(canadaOptions.map((o) => o.id)).toContain("cree");

    const japanOptions = getRegionalLanguageOptions("JP");
    expect(japanOptions.map((o) => o.id)).toContain("ainu");

    const mexicoOptions = getRegionalLanguageOptions("MX");
    expect(mexicoOptions.map((o) => o.id)).toContain("nahuatl");

    const usOptions = getRegionalLanguageOptions("US");
    expect(usOptions.map((o) => o.id)).toContain("navajo");

    expect(getRegionalLanguageOptions("ZZ")).toEqual([]);
  });

  it("getAvailableLanguageOptionsForCountry separates official and regional options", () => {
    const caOptions = getAvailableLanguageOptionsForCountry("CA");
    expect(caOptions.officialLanguages.map((l) => l.code)).toEqual(["en", "fr"]);
    expect(caOptions.regionalOptions.map((o) => o.id)).toEqual([
      "cree",
      "inuktitut",
      "ojibwe",
    ]);

    const unknownOptions = getAvailableLanguageOptionsForCountry("ZZ");
    expect(unknownOptions.officialLanguages).toEqual([]);
    expect(unknownOptions.regionalOptions).toEqual([]);
  });

  it("returned options maintain catalog immutability when mutated by consumer", () => {
    const first = getRegionalLanguageOptions("AO");
    const initialCount = first.length;

    first.push({
      id: "temporary",
      name: "Temporary",
      countryCodes: ["AO"],
      kind: "regional",
    });

    const second = getRegionalLanguageOptions("AO");
    expect(second.length).toBe(initialCount);
    expect(second.map((o) => o.id)).not.toContain("temporary");

    const profile = getCountryLanguageProfile("AO");
    if (profile) {
      // @ts-expect-error mutating copy
      profile.officialLanguages.push({
        code: "temp",
        name: "Temp",
        nativeName: "Temp",
      });
    }

    const freshProfile = getCountryLanguageProfile("AO");
    expect(freshProfile?.officialLanguages.map((l) => l.code)).not.toContain("temp");
  });

  it("verifies deep freeze runtime immutability on REGIONAL_LANGUAGE_CATALOG at all levels", () => {
    expect(Object.isFrozen(REGIONAL_LANGUAGE_CATALOG)).toBe(true);
    expect(Object.isFrozen(REGIONAL_LANGUAGE_CATALOG.AO)).toBe(true);
    expect(Object.isFrozen(REGIONAL_LANGUAGE_CATALOG.AO.officialLanguages)).toBe(true);
    expect(Object.isFrozen(REGIONAL_LANGUAGE_CATALOG.AO.officialLanguages[0])).toBe(true);
    expect(Object.isFrozen(REGIONAL_LANGUAGE_CATALOG.AO.regionalOptions)).toBe(true);
    expect(Object.isFrozen(REGIONAL_LANGUAGE_CATALOG.AO.regionalOptions[0])).toBe(true);
    expect(Object.isFrozen(REGIONAL_LANGUAGE_CATALOG.AO.regionalOptions[0].countryCodes)).toBe(true);
  });

  it("prevents direct mutation on REGIONAL_LANGUAGE_CATALOG", () => {
    const originalCountryName = REGIONAL_LANGUAGE_CATALOG.AO.countryName;
    const originalOfficialCount = REGIONAL_LANGUAGE_CATALOG.AO.officialLanguages.length;
    const originalRegionalCount = REGIONAL_LANGUAGE_CATALOG.AO.regionalOptions.length;
    const originalCountryCodes = [...REGIONAL_LANGUAGE_CATALOG.AO.regionalOptions[0].countryCodes];

    expect(() => {
      (
        REGIONAL_LANGUAGE_CATALOG.AO as unknown as { countryName: string }
      ).countryName = "Changed";
    }).toThrow();

    expect(() => {
      (
        REGIONAL_LANGUAGE_CATALOG.AO.officialLanguages as unknown as unknown[]
      ).push({
        code: "xx",
        name: "Temporary",
        nativeName: "Temporary",
      });
    }).toThrow();

    expect(() => {
      (
        REGIONAL_LANGUAGE_CATALOG.AO.regionalOptions as unknown as unknown[]
      ).push({
        id: "temporary",
        name: "Temporary",
        countryCodes: ["AO"],
        kind: "regional",
      });
    }).toThrow();

    expect(() => {
      (
        REGIONAL_LANGUAGE_CATALOG.AO.regionalOptions[0].countryCodes as unknown as string[]
      ).push("XX");
    }).toThrow();

    expect(REGIONAL_LANGUAGE_CATALOG.AO.countryName).toBe(originalCountryName);
    expect(REGIONAL_LANGUAGE_CATALOG.AO.officialLanguages.length).toBe(originalOfficialCount);
    expect(REGIONAL_LANGUAGE_CATALOG.AO.regionalOptions.length).toBe(originalRegionalCount);
    expect(REGIONAL_LANGUAGE_CATALOG.AO.regionalOptions[0].countryCodes).toEqual(originalCountryCodes);
  });
});
