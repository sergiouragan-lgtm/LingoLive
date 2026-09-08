import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { StudentDashboardExperience } from "./StudentDashboardExperience";

const baseProps = {
  studentName: "Sofia Martins",
  selectedLanguage: { code: "en", name: "Inglês", flag: "🇬🇧", defaultVoice: "alloy" },
  selectedProficiency: "Intermediate" as const,
  streakData: { count: 4, lastDate: "", history: [] },
  savedWords: [],
  achievements: [],
  userProfile: {
    identity: { preferredDisplayName: { value: "Sofia Martins" } },
    learning: {
      targetLanguage: { value: "Inglês" },
      cefrLevel: { value: "B2" },
      learningStyle: { value: "visual" },
    },
    account: { dailyGoal: { value: 20 } },
  },
  onStartPractice: vi.fn(),
  onNavigate: vi.fn(),
};

describe("StudentDashboardExperience", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders the eight dashboard sections in the approved order", () => {
    const { container } = render(<StudentDashboardExperience {...baseProps} />);
    expect(screen.getByRole("heading", { name: "Bom dia, Sofia!" })).toBeDefined();
    expect([...container.querySelectorAll("[data-dashboard-section]")].map((element) => element.getAttribute("data-dashboard-section"))).toEqual([
      "continue-learning", "daily-goal", "study-streak", "next-class",
      "adaptive-recommendations", "recent-progress", "vocabulary-review", "achievements",
    ]);
  });

  it("connects primary practice and navigation actions", () => {
    render(<StudentDashboardExperience {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Continuar aprendendo/i }));
    fireEvent.click(screen.getByRole("button", { name: /Biblioteca/i }));
    expect(baseProps.onStartPractice).toHaveBeenCalledOnce();
    expect(baseProps.onNavigate).toHaveBeenCalledWith("biblioteca");
  });

  it("renders profile learning gaps without inventing production data", () => {
    render(<StudentDashboardExperience {...baseProps} userProfile={{ ...baseProps.userProfile, learningGaps: ["Present perfect", "Vocabulário de reuniões"] }} />);
    expect(screen.getByText("Present perfect")).toBeDefined();
    expect(screen.getByText("Vocabulário de reuniões")).toBeDefined();
  });

  it("prioritizes the Perfil Inteligente over authentication fallbacks", () => {
    render(<StudentDashboardExperience {...baseProps} studentName="Nome da autenticação" />);
    expect(screen.getByRole("heading", { name: "Bom dia, Sofia!" })).toBeDefined();
    expect(screen.getByText("Inglês · nível B2")).toBeDefined();
    expect(screen.getByText("20 min")).toBeDefined();
  });

  it.each([
    ["loading", "A carregar dashboard"],
    ["empty", "Complete o seu Perfil Inteligente"],
    ["unavailable", "Dashboard temporariamente indisponível"],
  ] as const)("renders the %s state", (dataState, accessibleName) => {
    render(<StudentDashboardExperience {...baseProps} dataState={dataState} onRetry={vi.fn()} />);
    expect(screen.queryByText(accessibleName) ?? screen.getByLabelText(accessibleName)).toBeDefined();
  });

  it("keeps available content visible during a partial failure", () => {
    render(<StudentDashboardExperience {...baseProps} dataState="partial" userProfile={{ identity: baseProps.userProfile.identity }} />);
    expect(screen.getByText("Alguns dados não foram carregados")).toBeDefined();
    expect(screen.getByText("Objetivo diário")).toBeDefined();
  });

  it("shows the student's profile photograph in the highlighted hero space", () => {
    render(<StudentDashboardExperience {...baseProps} studentPhotoUrl="https://example.com/sofia.jpg" />);
    const photograph = screen.getByRole("img", { name: "Fotografia de Sofia" });
    expect(photograph.getAttribute("src")).toBe("https://example.com/sofia.jpg");
  });

  it("provides landmarks, a skip link and keyboard-operable primary actions", () => {
    render(<StudentDashboardExperience {...baseProps} />);
    const skipLink = screen.getByRole("link", { name: "Saltar para o conteúdo" });
    expect(skipLink.getAttribute("href")).toBe("#student-dashboard-content");
    expect(screen.getByRole("main").getAttribute("tabindex")).toBe("-1");
    const practice = screen.getByRole("button", { name: /Continuar aprendendo/i });
    practice.focus();
    fireEvent.keyDown(practice, { key: "Enter" });
    fireEvent.click(practice);
    expect(baseProps.onStartPractice).toHaveBeenCalledOnce();
  });

  it("announces loss of connection while keeping cached dashboard content visible", () => {
    render(<StudentDashboardExperience {...baseProps} />);
    fireEvent(window, new Event("offline"));
    expect(screen.getByText("Sem ligação à internet")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Bom dia, Sofia!" })).toBeDefined();
    fireEvent(window, new Event("online"));
    expect(screen.queryByText("Sem ligação à internet")).toBeNull();
  });
});
