import { describe, expect, it } from "vitest";
import { CefrAssessmentEngine } from "./CefrAssessmentEngine";
import { UserMemory } from "../../domain/memory/UserMemory";

const memory = (words: string[]): UserMemory => ({
  userId: "u1",
  vocabularyMastered: words,
  grammarWeaknesses: [],
  preferredStyle: "balanced",
  learningGoals: [],
  motivation: "",
  studyFrequency: "",
  lastUpdated: new Date(),
  privacyLevel: "private",
});

describe("CefrAssessmentEngine", () => {
  it("selects difficulty from unique demonstrated vocabulary", () => {
    expect(CefrAssessmentEngine.calculateNextDifficulty(memory([]))).toBe("A1");
    expect(CefrAssessmentEngine.calculateNextDifficulty(memory(Array.from({ length: 55 }, (_, index) => `word-${index}`)))).toBe("B1");
  });

  it("returns zero for empty evidence and rewards richer connected writing", () => {
    expect(CefrAssessmentEngine.evaluate("", "B1")).toBe(0);
    const basic = CefrAssessmentEngine.evaluate("I work.", "B1");
    const richer = CefrAssessmentEngine.evaluate("I work in tourism because I enjoy helping visitors, although the role can be demanding.", "B1");
    expect(richer).toBeGreaterThan(basic);
    expect(richer).toBeLessThanOrEqual(1);
  });
});
