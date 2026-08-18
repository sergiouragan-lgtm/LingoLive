import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import {
  ConversationWizard,
  extractTargetLanguagesFromSmartProfile,
  resolveLanguageObject
} from "./ConversationWizard";
import { SmartProfile } from "../../profile/types";
import { ToastProvider } from "../../context/ToastContext";

// Mark React act environment for jsdom
// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("ConversationWizard - Dynamic Target Languages & SmartProfile Suite", () => {
  let activeContainers: HTMLElement[] = [];

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
  });

  function renderWizard(props: any) {
    const container = document.createElement("div");
    document.body.appendChild(container);
    activeContainers.push(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        React.createElement(
          ToastProvider,
          null,
          React.createElement(ConversationWizard, props)
        )
      );
    });

    return {
      container,
      updateProps: (newProps: any) => {
        act(() => {
          root.render(
            React.createElement(
              ToastProvider,
              null,
              React.createElement(ConversationWizard, newProps)
            )
          );
        });
      },
      unmount: () => {
        act(() => {
          root.unmount();
        });
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }
    };
  }

  it("TESTE 1 — UM IDIOMA: targetLanguages=['French'] extrai e renderiza apenas o card Francês", () => {
    const mockProfile: Partial<SmartProfile> = {
      learning: {
        targetLanguages: ["French"]
      } as any
    };

    const targetLangs = extractTargetLanguagesFromSmartProfile(mockProfile as SmartProfile);
    expect(targetLangs).toEqual(["French"]);

    const resolved = resolveLanguageObject("French");
    expect(resolved).not.toBeNull();
    expect(resolved?.code).toBe("fr");

    const onStartSession = vi.fn();
    const { container } = renderWizard({
      userId: "u123",
      smartProfile: mockProfile,
      onStartSession
    });

    // Language step container check
    const langSection = container.querySelector("#conversation-wizard");
    expect(langSection).not.toBeNull();

    // Check rendered language buttons (French only)
    const langButtons = container.querySelectorAll("button");
    const langCodes = Array.from(langButtons).map(b => b.textContent).filter(t => t?.includes("FR") || t?.includes("French"));
    expect(langCodes.length).toBeGreaterThan(0);

    // Ensure English and Portuguese are not rendered as language cards
    const textContent = container.textContent || "";
    expect(textContent).toContain("French");
    expect(textContent).not.toContain("Portuguese");
    expect(textContent).not.toContain("English");
  });

  it("TESTE 2 — DOIS IDIOMAS: targetLanguages=['English', 'German'] renderiza exactamente 2 cards sem Português nem Chinês", () => {
    const mockProfile: Partial<SmartProfile> = {
      learning: {
        targetLanguages: ["English", "German"]
      } as any
    };

    const targetLangs = extractTargetLanguagesFromSmartProfile(mockProfile as SmartProfile);
    expect(targetLangs).toEqual(["English", "German"]);

    const onStartSession = vi.fn();
    const { container } = renderWizard({
      userId: "u123",
      smartProfile: mockProfile,
      onStartSession
    });

    const textContent = container.textContent || "";
    expect(textContent).toContain("English");
    expect(textContent).toContain("German");
    expect(textContent).not.toContain("Portuguese");
    expect(textContent).not.toContain("Chinese");
  });

  it("TESTE 3 — LISTA VAZIA: targetLanguages=[] mostra mensagem de alerta, desativa botão e impede início de sessão", () => {
    const mockProfileEmpty: Partial<SmartProfile> = {
      learning: {
        targetLanguages: []
      } as any
    };

    const targetLangs = extractTargetLanguagesFromSmartProfile(mockProfileEmpty as SmartProfile);
    expect(targetLangs).toEqual([]);

    const onStartSession = vi.fn();
    const { container } = renderWizard({
      userId: "u123",
      smartProfile: mockProfileEmpty,
      onStartSession
    });

    const textContent = container.textContent || "";
    expect(textContent).toContain("Nenhum idioma configurado no Perfil Inteligente.");

    // CTA button must be disabled
    const ctaButton = Array.from(container.querySelectorAll("button")).find(b => b.textContent?.includes("Começar a Falar"));
    expect(ctaButton).not.toBeUndefined();
    expect(ctaButton?.hasAttribute("disabled")).toBe(true);

    // Click on CTA button does not trigger onStartSession
    act(() => {
      ctaButton?.click();
    });
    expect(onStartSession).not.toHaveBeenCalled();
  });

  it("TESTE 4 — TARGETLANGUAGE SINGULAR NÃO AUTORIZA: targetLanguages=['French'] com targetLanguage='English' renderiza apenas Francês", () => {
    const mockProfile: Partial<SmartProfile> = {
      learning: {
        targetLanguages: ["French"],
        targetLanguage: "English"
      } as any
    };

    const targetLangs = extractTargetLanguagesFromSmartProfile(mockProfile as SmartProfile);
    expect(targetLangs).toEqual(["French"]);

    const onStartSession = vi.fn();
    const { container } = renderWizard({
      userId: "u123",
      smartProfile: mockProfile,
      onStartSession
    });

    const textContent = container.textContent || "";
    expect(textContent).toContain("French");
    expect(textContent).not.toContain("English");
  });

  it("TESTE 5 — LOCALSTORAGE NÃO AUTORIZA: targetLanguages=['French'] com localStorage='English' ignora localStorage e seleciona Francês", () => {
    localStorage.setItem("lingolive_last_tutor_language", "en");

    const mockProfile: Partial<SmartProfile> = {
      learning: {
        targetLanguages: ["French"]
      } as any
    };

    const onStartSession = vi.fn();
    const { container } = renderWizard({
      userId: "u123",
      smartProfile: mockProfile,
      onStartSession
    });

    const ctaButton = Array.from(container.querySelectorAll("button")).find(b => b.textContent?.includes("Começar a Falar"));
    expect(ctaButton).not.toBeUndefined();
    expect(ctaButton?.hasAttribute("disabled")).toBe(false);

    act(() => {
      ctaButton?.click();
    });

    expect(onStartSession).toHaveBeenCalledTimes(1);
    const sessionPayload = onStartSession.mock.calls[0][0];
    expect(sessionPayload.language.code).toBe("fr");
    expect(sessionPayload.language.name).toBe("French");
  });

  it("TESTE 6 — DEDUPLICAÇÃO: targetLanguages=['French', 'fr', 'FR', 'Français'] produz um único card Francês sem duplicados", () => {
    const mockProfile: Partial<SmartProfile> = {
      learning: {
        targetLanguages: ["French", "fr", "FR", "Français"]
      } as any
    };

    const targetLangs = extractTargetLanguagesFromSmartProfile(mockProfile as SmartProfile);
    expect(targetLangs).toEqual(["French", "fr", "FR", "Français"]);

    const onStartSession = vi.fn();
    const { container } = renderWizard({
      userId: "u123",
      smartProfile: mockProfile,
      onStartSession
    });

    // Check that exactly ONE language card button is rendered in the language grid
    const langGrid = container.querySelector(".grid.grid-cols-2");
    const langCards = langGrid ? langGrid.querySelectorAll("button") : [];
    expect(langCards).toHaveLength(1);
  });

  it("TESTE 7 — ENTRADAS INVÁLIDAS: targetLanguages=['', '   ', null, undefined, 'French'] filtra vazios e rende apenas Francês", () => {
    const mockProfile: Partial<SmartProfile> = {
      learning: {
        targetLanguages: ["", "   ", null as any, undefined as any, "French"]
      } as any
    };

    const targetLangs = extractTargetLanguagesFromSmartProfile(mockProfile as SmartProfile);
    expect(targetLangs).toEqual(["French"]);

    const onStartSession = vi.fn();
    const { container } = renderWizard({
      userId: "u123",
      smartProfile: mockProfile,
      onStartSession
    });

    const textContent = container.textContent || "";
    expect(textContent).toContain("French");
  });

  it("TESTE 8 — IDIOMA DESCONHECIDO: targetLanguages=['UnknownLanguage'] ignora valor, não converte para Inglês/Português e mostra alerta", () => {
    const mockProfile: Partial<SmartProfile> = {
      learning: {
        targetLanguages: ["UnknownLanguage"]
      } as any
    };

    const resolved = resolveLanguageObject("UnknownLanguage");
    expect(resolved).toBeNull();

    const onStartSession = vi.fn();
    const { container } = renderWizard({
      userId: "u123",
      smartProfile: mockProfile,
      onStartSession
    });

    const textContent = container.textContent || "";
    expect(textContent).toContain("Nenhum idioma configurado no Perfil Inteligente.");
  });

  it("TESTE 9 — MUDANÇA DINÂMICA DO PERFIL: altera de ['English', 'German'] para ['French'] e sincroniza a seleção", () => {
    const mockProfile1: Partial<SmartProfile> = {
      learning: {
        targetLanguages: ["English", "German"]
      } as any
    };

    const mockProfile2: Partial<SmartProfile> = {
      learning: {
        targetLanguages: ["French"]
      } as any
    };

    const onStartSession = vi.fn();
    const { container, updateProps } = renderWizard({
      userId: "u123",
      smartProfile: mockProfile1,
      onStartSession
    });

    expect(container.textContent).toContain("English");
    expect(container.textContent).toContain("German");

    // Dynamically update profile prop to French
    updateProps({
      userId: "u123",
      smartProfile: mockProfile2,
      onStartSession
    });

    expect(container.textContent).toContain("French");
    expect(container.textContent).not.toContain("German");
    expect(container.textContent).not.toContain("English");

    // Click CTA to verify payload
    const ctaButton = Array.from(container.querySelectorAll("button")).find(b => b.textContent?.includes("Começar a Falar"));
    act(() => {
      ctaButton?.click();
    });

    expect(onStartSession).toHaveBeenCalledTimes(1);
    expect(onStartSession.mock.calls[0][0].language.code).toBe("fr");
  });

  it("TESTE 10 — PERFIL EM CARREGAMENTO: mostra spinner e não exibe 'Nenhum idioma configurado'", () => {
    const onStartSession = vi.fn();
    const { container } = renderWizard({
      userId: "u_loading",
      smartProfile: null,
      onStartSession
    });

    const textContent = container.textContent || "";
    expect(textContent).toContain("Carregando preferências e dados do Firestore...");
    expect(textContent).not.toContain("Nenhum idioma configurado no Perfil Inteligente.");
  });

  it("TESTE 11 — IDIOMA NATIVO NÃO É OPÇÃO: nativeLanguage='Portuguese' com targetLanguages=['French'] rende apenas Francês", () => {
    const mockProfile: Partial<SmartProfile> = {
      localization: {
        nativeLanguage: { value: "Portuguese", confidence: 1, source: "test", lastUpdated: "", validationStatus: "", version: "1" }
      } as any,
      learning: {
        targetLanguages: ["French"]
      } as any
    };

    const targetLangs = extractTargetLanguagesFromSmartProfile(mockProfile as SmartProfile);
    expect(targetLangs).toEqual(["French"]);

    const onStartSession = vi.fn();
    const { container } = renderWizard({
      userId: "u123",
      smartProfile: mockProfile,
      onStartSession
    });

    const textContent = container.textContent || "";
    expect(textContent).toContain("French");
    expect(textContent).not.toContain("Portuguese");
  });

  it("TESTE 12 — PAÍS NÃO AUTORIZA IDIOMA: country='Angola' com targetLanguages=['French'] rende apenas Francês sem adicionar Português", () => {
    const mockProfile: Partial<SmartProfile> = {
      localization: {
        country: { value: "Angola", confidence: 1, source: "test", lastUpdated: "", validationStatus: "", version: "1" }
      } as any,
      learning: {
        targetLanguages: ["French"]
      } as any
    };

    const targetLangs = extractTargetLanguagesFromSmartProfile(mockProfile as SmartProfile);
    expect(targetLangs).toEqual(["French"]);

    const onStartSession = vi.fn();
    const { container } = renderWizard({
      userId: "u123",
      smartProfile: mockProfile,
      onStartSession
    });

    const textContent = container.textContent || "";
    expect(textContent).toContain("French");
    expect(textContent).not.toContain("Portuguese");
  });

  it("TESTE 13 — PAYLOAD AUTORIZADO: onStartSession recebe o objeto exato de Francês selecionado", () => {
    const mockProfile: Partial<SmartProfile> = {
      learning: {
        targetLanguages: ["French"]
      } as any
    };

    const onStartSession = vi.fn();
    const { container } = renderWizard({
      userId: "u123",
      smartProfile: mockProfile,
      onStartSession
    });

    const ctaButton = Array.from(container.querySelectorAll("button")).find(b => b.textContent?.includes("Começar a Falar"));
    act(() => {
      ctaButton?.click();
    });

    expect(onStartSession).toHaveBeenCalledTimes(1);
    const session = onStartSession.mock.calls[0][0];
    expect(session.language).toEqual({
      code: "fr",
      name: "French",
      flag: "🇫🇷",
      defaultVoice: "Kore"
    });
  });

  it("TESTE 14 — HANDLER DEFENSIVO: início forçado com lista vazia impede invocação de onStartSession", () => {
    const mockProfileEmpty: Partial<SmartProfile> = {
      learning: {
        targetLanguages: []
      } as any
    };

    const onStartSession = vi.fn();
    const { container } = renderWizard({
      userId: "u123",
      smartProfile: mockProfileEmpty,
      onStartSession
    });

    const ctaButton = Array.from(container.querySelectorAll("button")).find(b => b.textContent?.includes("Começar a Falar"));
    act(() => {
      ctaButton?.click();
    });

    expect(onStartSession).not.toHaveBeenCalled();
  });

  it("TESTE 15 — AUSÊNCIA DE LISTA FIXA: perfil vazio nunca renderiza Português, Inglês, Francês ou Chinês como fallback", () => {
    const mockEmptyProfile = {};
    const targetLangs = extractTargetLanguagesFromSmartProfile(mockEmptyProfile);
    expect(targetLangs).toEqual([]);

    const onStartSession = vi.fn();
    const { container } = renderWizard({
      userId: "u123",
      smartProfile: mockEmptyProfile,
      onStartSession
    });

    const textContent = container.textContent || "";
    expect(textContent).not.toContain("Portuguese");
    expect(textContent).not.toContain("English");
    expect(textContent).not.toContain("French");
    expect(textContent).not.toContain("Chinese");
    expect(textContent).toContain("Nenhum idioma configurado no Perfil Inteligente.");
  });
});
