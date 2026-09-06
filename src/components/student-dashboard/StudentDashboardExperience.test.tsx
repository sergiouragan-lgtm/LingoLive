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
  onStartPractice: vi.fn(),
  onNavigate: vi.fn(),
};

describe("StudentDashboardExperience", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders the approved dashboard hierarchy with real-data empty states", () => {
    render(<StudentDashboardExperience {...baseProps} />);
    expect(screen.getByRole("heading", { name: "Bom dia, Sofia!" })).toBeDefined();
    expect(screen.getByText("Próxima atividade")).toBeDefined();
    expect(screen.getByText("Nenhum ponto prioritário")).toBeDefined();
    expect(screen.getByText("A primeira conquista está próxima")).toBeDefined();
  });

  it("connects primary practice and navigation actions", () => {
    render(<StudentDashboardExperience {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Continuar aprendendo/i }));
    fireEvent.click(screen.getByRole("button", { name: /Biblioteca/i }));
    expect(baseProps.onStartPractice).toHaveBeenCalledOnce();
    expect(baseProps.onNavigate).toHaveBeenCalledWith("biblioteca");
  });

  it("renders profile learning gaps without inventing production data", () => {
    render(<StudentDashboardExperience {...baseProps} userProfile={{ learningGaps: ["Present perfect", "Vocabulário de reuniões"] }} />);
    expect(screen.getByText("Present perfect")).toBeDefined();
    expect(screen.getByText("Vocabulário de reuniões")).toBeDefined();
  });
});
