import { describe, expect, it } from "vitest";

import { buildStudentDashboardModel, resolveDashboardDataState } from "./studentDashboard.model";

const base = {
  studentName: "Nome da autenticação",
  selectedLanguage: { code: "en", name: "Inglês", flag: "🇬🇧", defaultVoice: "alloy" },
  selectedProficiency: "Intermediate" as const,
  streakData: { count: 2, lastDate: "2026-09-07", history: ["2026-09-06", "2026-09-07"] },
  savedWords: [],
  achievements: [],
};

describe("studentDashboard model", () => {
  it("prioritizes the intelligent profile created during onboarding", () => {
    const model = buildStudentDashboardModel({ ...base, profile: {
      identity: { preferredDisplayName: { value: "Sofia" } },
      learning: { targetLanguage: { value: "Francês" }, cefrLevel: { value: "A2" }, learningStyle: { value: "adaptive" } },
      account: { dailyGoal: { value: 20 } },
      languageProfile: { goals: ["conversation"] },
      aiPreferences: { studyFrequency: 5 },
    }});
    expect(model.displayName).toBe("Sofia");
    expect(model.targetLanguage).toBe("Francês");
    expect(model.cefrLevel).toBe("A2");
    expect(model.dailyGoalMinutes).toBe(20);
    expect(model.learningGoal).toBe("conversation");
  });

  it("supports the legacy onboarding profile during gradual migration", () => {
    const profile = { languageProfile: { targetLanguage: "Espanhol", level: "B1", learningStyle: "adaptive" }, aiPreferences: { dailyGoal: 15 } };
    const model = buildStudentDashboardModel({ ...base, profile });
    expect(model.targetLanguage).toBe("Espanhol");
    expect(model.dailyGoalMinutes).toBe(15);
    expect(resolveDashboardDataState(undefined, profile, model)).toBe("success");
  });

  it("reports empty and partial states without fabricating data", () => {
    const empty = buildStudentDashboardModel({ ...base, profile: undefined });
    expect(resolveDashboardDataState(undefined, undefined, empty)).toBe("empty");
    const partialProfile = { identity: {} };
    const partial = buildStudentDashboardModel({ ...base, profile: partialProfile });
    expect(resolveDashboardDataState(undefined, partialProfile, partial)).toBe("partial");
  });
});
