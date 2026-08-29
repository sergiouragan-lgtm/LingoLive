// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi, beforeEach, afterEach } from "vitest";
import { parseMemoryList } from "./LearningMemoryPanel";
import { LearningMemoryPanel } from "./LearningMemoryPanel";

vi.mock("../../firebase", () => ({
  auth: { currentUser: { getIdToken: vi.fn().mockResolvedValue("test-token") } },
}));

vi.mock("../../context/ThemeContext", () => ({
  useAppTheme: () => ({
    colorScheme: "light",
    setColorScheme: (scheme: string) => localStorage.setItem("lingolive_color_scheme", scheme),
  }),
}));

const response = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: vi.fn().mockResolvedValue(body),
});

describe("LearningMemoryPanel helpers", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
    });
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("parses comma and line-separated memory values without duplicates", () => {
    expect(parseMemoryList("Viagens, Trabalho\nViagens\n  Conversação ")).toEqual([
      "Viagens",
      "Trabalho",
      "Conversação",
    ]);
  });

  it("loads the learner memory and disables personalization through the authenticated API", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(response({
        memory: {
          enabled: true,
          cefrLevel: "B1",
          totalTutorTurns: 12,
          vocabularyMastered: ["airport"],
          grammarWeaknesses: ["past tense"],
          learningGoals: ["Viagens"],
          preferredStyle: "balanced",
          motivation: "",
          studyFrequency: "",
          lastSessionAt: null,
        },
      }) as unknown as Response)
      .mockResolvedValueOnce(response({
        memory: {
          enabled: false,
          cefrLevel: "B1",
          totalTutorTurns: 12,
          vocabularyMastered: ["airport"],
          grammarWeaknesses: ["past tense"],
          learningGoals: ["Viagens"],
          preferredStyle: "balanced",
          motivation: "",
          studyFrequency: "",
          lastSessionAt: null,
        },
      }) as unknown as Response);

    render(<LearningMemoryPanel userId="u1" />);
    expect(await screen.findByText("B1")).toBeTruthy();

    const toggle = screen.getByRole("switch", { name: "Ativar memória de aprendizagem" });
    fireEvent.click(toggle);

    await waitFor(() => expect(toggle.getAttribute("aria-checked")).toBe("false"));
    const patchCall = fetchMock.mock.calls[1];
    expect(patchCall[0]).toBe("/api/tutor-memory");
    expect(patchCall[1]?.method).toBe("PATCH");
    expect(JSON.parse(String(patchCall[1]?.body)).enabled).toBe(false);
  });

  it("requires explicit confirmation before deleting memory", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(response({ memory: { ...({}), enabled: true } }) as unknown as Response)
      .mockResolvedValueOnce(response(null, 204) as unknown as Response);

    render(<LearningMemoryPanel userId="u1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Controlo" }));
    const deleteButton = await screen.findByRole("button", { name: /Apagar toda a memória/ });
    fireEvent.click(deleteButton);

    expect(screen.getByText("Esta ação é definitiva.")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Confirmar eliminação" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][1]?.method).toBe("DELETE");
  });

  it("navigates through the four screens and toggles the persisted color scheme", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response({ memory: { enabled: true } }) as unknown as Response);

    render(<LearningMemoryPanel userId="u1" />);
    await screen.findByText("Retrato atual");

    fireEvent.click(screen.getByRole("button", { name: "Competências" }));
    expect(screen.getByRole("tab", { name: "Vocabulário" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Percurso" }));
    expect(screen.getByText("A memória cresce apenas com atividade concluída.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Controlo" }));
    expect(screen.getByText("Os seus dados de aprendizagem pertencem-lhe.")).toBeTruthy();

    expect(document.querySelector('[data-memory-theme="editorial-light"]')).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ativar tema Índigo Atmosférico" }));
    expect(localStorage.getItem("lingolive_color_scheme")).toBe("dark");
  });
});
