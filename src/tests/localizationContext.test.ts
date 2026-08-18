import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import {
  useLocalization,
  LocalizationProvider,
} from "../context/LocalizationContext";

describe("LocalizationContext Initial Interface Language Integration & Conflict Resolution", () => {
  const originalNavigator = globalThis.navigator;
  let activeContainers: HTMLElement[] = [];

  // @ts-ignore
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    activeContainers = [];
  });

  afterEach(() => {
    for (const container of activeContainers) {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
    activeContainers = [];
    localStorage.clear();
    vi.restoreAllMocks();
    if (originalNavigator) {
      Object.defineProperty(globalThis, "navigator", {
        value: originalNavigator,
        configurable: true,
        writable: true,
      });
    }
  });

  function renderContext() {
    let currentValue: ReturnType<typeof useLocalization> | undefined;
    const TestComponent = () => {
      currentValue = useLocalization();
      return null;
    };
    const container = document.createElement("div");
    document.body.appendChild(container);
    activeContainers.push(container);
    const root = createRoot(container);
    act(() => {
      root.render(
        React.createElement(
          LocalizationProvider,
          null,
          React.createElement(TestComponent)
        )
      );
    });
    return {
      get current() {
        if (!currentValue) {
          throw new Error("LocalizationContext missing");
        }
        return currentValue;
      },
      unmount: () => {
        act(() => {
          root.unmount();
        });
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      },
    };
  }

  it("CASO 1 — NAVEGADOR PT-AO: resolve para pt via Provider", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {
        languages: ["pt-AO", "en-US"],
        language: "pt-AO",
      },
      configurable: true,
      writable: true,
    });

    const context = renderContext();

    expect(context.current.getCurrentLanguage()).toBe("pt");
    expect(context.current.linguisticIdentity.interfaceLanguage).toBe("pt");
  });

  it("CASO 2 — NAVEGADOR FR-FR: resolve para fr via Provider", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {
        languages: ["fr-FR", "en-US"],
        language: "fr-FR",
      },
      configurable: true,
      writable: true,
    });

    const context = renderContext();

    expect(context.current.getCurrentLanguage()).toBe("fr");
    expect(context.current.linguisticIdentity.interfaceLanguage).toBe("fr");
  });

  it("CASO 3 — NAVEGADOR JA-JP: resolve para ja via Provider", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {
        languages: ["ja-JP", "en-US"],
        language: "ja-JP",
      },
      configurable: true,
      writable: true,
    });

    const context = renderContext();

    expect(context.current.getCurrentLanguage()).toBe("ja");
    expect(context.current.linguisticIdentity.interfaceLanguage).toBe("ja");
  });

  it("CASO 4 — NAVIGATOR INEXISTENTE: fallback para pt via Provider", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const context = renderContext();

    expect(context.current.getCurrentLanguage()).toBe("pt");
    expect(context.current.linguisticIdentity.interfaceLanguage).toBe("pt");
  });

  it("CASO 5 — NAVIGATOR.LANGUAGES VAZIO: usa navigator.language para fr via Provider", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {
        languages: [],
        language: "fr-FR",
      },
      configurable: true,
      writable: true,
    });

    const context = renderContext();

    expect(context.current.getCurrentLanguage()).toBe("fr");
    expect(context.current.linguisticIdentity.interfaceLanguage).toBe("fr");
  });

  it("CASO 6 — IDIOMA DESCONHECIDO: fallback para pt via Provider", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {
        languages: ["xx-YY"],
        language: "xx-YY",
      },
      configurable: true,
      writable: true,
    });

    const context = renderContext();

    expect(context.current.getCurrentLanguage()).toBe("pt");
    expect(context.current.linguisticIdentity.interfaceLanguage).toBe("pt");
  });

  it("CASO 7 — PREFERÊNCIA DO LIE: lingolive_lie.interfaceLanguage ('es') tem precedência sobre o navegador", () => {
    localStorage.setItem(
      "lingolive_lie",
      JSON.stringify({ interfaceLanguage: "es" })
    );

    Object.defineProperty(globalThis, "navigator", {
      value: {
        languages: ["fr-FR"],
        language: "fr-FR",
      },
      configurable: true,
      writable: true,
    });

    const context = renderContext();

    expect(context.current.getCurrentLanguage()).toBe("es");
    expect(context.current.linguisticIdentity.interfaceLanguage).toBe("es");
  });

  it("CASO 8 — PREFERÊNCIA DE LOCALIZAÇÃO: lingolive_localization.language ('de') é usada quando LIE está ausente", () => {
    localStorage.setItem(
      "lingolive_localization",
      JSON.stringify({ language: "de" })
    );

    Object.defineProperty(globalThis, "navigator", {
      value: {
        languages: ["fr-FR"],
        language: "fr-FR",
      },
      configurable: true,
      writable: true,
    });

    const context = renderContext();

    expect(context.current.getCurrentLanguage()).toBe("de");
    expect(context.current.linguisticIdentity.interfaceLanguage).toBe("de");
  });

  it("CASO 9 — CONFLITO ENTRE AS DUAS CHAVES: lingolive_lie.interfaceLanguage ('fr') vence lingolive_localization.language ('en')", () => {
    localStorage.setItem(
      "lingolive_lie",
      JSON.stringify({ interfaceLanguage: "fr" })
    );

    localStorage.setItem(
      "lingolive_localization",
      JSON.stringify({ language: "en" })
    );

    const context = renderContext();

    expect(context.current.getCurrentLanguage()).toBe("fr");
    expect(context.current.linguisticIdentity.interfaceLanguage).toBe("fr");
  });

  it("CASO 10 — CONFLITO INVERSO: lingolive_lie.interfaceLanguage ('en') vence lingolive_localization.language ('fr')", () => {
    localStorage.setItem(
      "lingolive_lie",
      JSON.stringify({ interfaceLanguage: "en" })
    );

    localStorage.setItem(
      "lingolive_localization",
      JSON.stringify({ language: "fr" })
    );

    const context = renderContext();

    expect(context.current.getCurrentLanguage()).toBe("en");
    expect(context.current.linguisticIdentity.interfaceLanguage).toBe("en");
  });

  it("CASO 11 — CACHE DE LOCALIZAÇÃO COM JSON INVÁLIDO: não lança excepção e usa defaults", () => {
    localStorage.setItem("lingolive_localization", "{invalid-json");

    Object.defineProperty(globalThis, "navigator", {
      value: {
        languages: ["fr-FR"],
        language: "fr-FR",
      },
      configurable: true,
      writable: true,
    });

    const context = renderContext();

    expect(context.current.getCurrentLanguage()).toBe("fr");
    expect(context.current.localization.country).toBe("US");
    expect(context.current.localization.currency).toBe("USD");
  });

  it("CASO 12 — CACHE PARCIAL: preserva idioma do cache e usa defaults seguros", () => {
    localStorage.setItem(
      "lingolive_localization",
      JSON.stringify({ language: "fr" })
    );

    const context = renderContext();

    expect(context.current.getCurrentLanguage()).toBe("fr");
    expect(context.current.linguisticIdentity.interfaceLanguage).toBe("fr");
    expect(context.current.localization.country).toBe("US");
    expect(context.current.localization.currency).toBe("USD");
  });

  it("CASO 13 — COUNTRY E CURRENCY PRESERVADOS: preserva país e moeda do cache e idioma prioritário", () => {
    localStorage.setItem(
      "lingolive_lie",
      JSON.stringify({ interfaceLanguage: "pt" })
    );

    localStorage.setItem(
      "lingolive_localization",
      JSON.stringify({ country: "CA", language: "fr", currency: "CAD" })
    );

    const context = renderContext();

    expect(context.current.getCurrentLanguage()).toBe("pt");
    expect(context.current.linguisticIdentity.interfaceLanguage).toBe("pt");
    expect(context.current.localization.country).toBe("CA");
    expect(context.current.localization.currency).toBe("CAD");
  });

  it("CASO 14 — MUDANÇA MANUAL CONTINUA SINCRONIZADA: changeLanguage actualiza os dois estados e chaves", async () => {
    const context = renderContext();

    await act(async () => {
      context.current.changeLanguage("fr");
    });

    expect(context.current.getCurrentLanguage()).toBe("fr");
    expect(context.current.linguisticIdentity.interfaceLanguage).toBe("fr");

    const cachedLoc = JSON.parse(
      localStorage.getItem("lingolive_localization") || "{}"
    );
    const cachedLie = JSON.parse(
      localStorage.getItem("lingolive_lie") || "{}"
    );

    expect(cachedLoc.language).toBe("fr");
    expect(cachedLie.interfaceLanguage).toBe("fr");
  });

  it("CASO 15 — SETLINGUISTICIDENTITY CONTINUA SINCRONIZADO: setLinguisticIdentity actualiza os dois estados e chaves", async () => {
    const context = renderContext();

    await act(async () => {
      await context.current.setLinguisticIdentity({
        ...context.current.linguisticIdentity,
        interfaceLanguage: "en",
      });
    });

    expect(context.current.getCurrentLanguage()).toBe("en");
    expect(context.current.linguisticIdentity.interfaceLanguage).toBe("en");

    const cachedLoc = JSON.parse(
      localStorage.getItem("lingolive_localization") || "{}"
    );
    const cachedLie = JSON.parse(
      localStorage.getItem("lingolive_lie") || "{}"
    );

    expect(cachedLoc.language).toBe("en");
    expect(cachedLie.interfaceLanguage).toBe("en");
  });
});
