import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import FeedbackReportCard from "./FeedbackReportCard";

const props = {
  language: { code: "en", name: "Inglês", flag: "🇬🇧", defaultVoice: "alloy" },
  proficiency: "Intermediate",
  scenario: { id: "meeting", title: "Reunião", description: "", iconName: "", promptContext: "" },
  transcript: [],
  ageGroup: "ADULT" as const,
  onRestart: vi.fn(),
  onViewSavedVocab: vi.fn(),
};

describe("FeedbackReportCard accessibility states", () => {
  beforeEach(() => { vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined))); });
  afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals(); });

  it("announces analysis progress to assistive technology", () => {
    render(<FeedbackReportCard {...props} transcript={[{ id: "1", role: "user", text: "Hello", timestamp: new Date() }]} />);
    expect(screen.getByRole("status", { name: "A analisar a conversa" })).toBeDefined();
  });

  it("announces insufficient conversation data as an actionable error", async () => {
    render(<FeedbackReportCard {...props} />);
    await waitFor(() => expect(screen.getByRole("alert")).toBeDefined());
    expect(screen.getByRole("button", { name: "Try Another Session" })).toBeDefined();
  });
});
