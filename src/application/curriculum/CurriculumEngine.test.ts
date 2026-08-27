import { describe, expect, it } from "vitest";
import { CurriculumEngine } from "./CurriculumEngine";

describe("CurriculumEngine", () => {
  it("handles empty paths and prerequisite unlocking deterministically", () => {
    expect(CurriculumEngine.calculateProgress([])).toBe(0);
    expect(CurriculumEngine.canUnlockNode({ id: "b", type: "National", title: "B", competencyId: "c", dependencies: ["a"], isCompleted: false }, ["a"])).toBe(true);
  });
});
