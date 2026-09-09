import { describe, expect, it } from "vitest";
import { adaptiveFascicleId, toStudentAdaptiveMaterial, validateFascicleContent } from "./AdaptiveFascicleService";

describe("adaptive fascicle contract", () => {
  const gaps = [{ targetKey: "present-perfect", sourceEventId: "event-1" }, { targetKey: "meeting-vocab", sourceEventId: "event-2" }];
  const content = { title: "Reforço", summary: "Prática dirigida.", addressedTargetKeys: gaps.map(g => g.targetKey), sections: [{ heading: "Explicação", explanation: "Use o tempo verbal no contexto.", examples: ["I have finished."] }], exercises: gaps.map((gap, index) => ({ id: `exercise-${index}`, prompt: "Complete", answer: "answer", explanation: "Explicação", targetKey: gap.targetKey })) };

  it("creates a deterministic generation id from the exact source evidence", () => {
    expect(adaptiveFascicleId("tenant", "student", gaps)).toBe(adaptiveFascicleId("tenant", "student", gaps));
    expect(adaptiveFascicleId("tenant", "student", gaps)).not.toBe(adaptiveFascicleId("tenant", "student", [{ ...gaps[0], sourceEventId: "new-event" }]));
  });

  it("accepts complete content covering every gap and validated answer", () => expect(validateFascicleContent(content, gaps.map(g => g.targetKey))).toBe(true));
  it("rejects missing gap coverage and exercises without answers", () => {
    expect(validateFascicleContent({ ...content, addressedTargetKeys: [gaps[0].targetKey] }, gaps.map(g => g.targetKey))).toBe(false);
    expect(validateFascicleContent({ ...content, exercises: content.exercises.map(item => ({ ...item, answer: "" })) }, gaps.map(g => g.targetKey))).toBe(false);
  });
  it("never exposes the generation prompt or answer key to the student", () => {
    const material = toStudentAdaptiveMaterial("material-1", { prompt: "private prompt", content });
    expect(material).not.toHaveProperty("prompt");
    expect(material.content.exercises[0]).not.toHaveProperty("answer");
    expect(material.content.exercises[0]).not.toHaveProperty("explanation");
  });
});
