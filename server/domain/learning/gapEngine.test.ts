import { describe, expect, it } from "vitest";
import { classifyLearningAttempt, validateActivityDefinition, validateRawLearningAttempt, type LearningActivityDefinition } from "./gapEngine";

const definition = (): LearningActivityDefinition => ({
  tenantId: "tenant-1", activityId: "activity-1", activityType: "cloze", languageCode: "pt", cefrLevel: "B1",
  target: { type: "vocabulary", key: "leave-verb", label: "Verbo sair" }, expectedAnswers: ["sair"],
  acceptedRegionalAnswers: { "pt-AO": ["bazar"], "pt-BR": ["meter o pé"] },
  errorCategory: "vocabulary", errorSeverity: "medium", evaluationMode: "attempt", active: true,
});

describe("server-side gap classification", () => {
  it("accepts a canonical answer after safe normalization", () => {
    expect(classifyLearningAttempt("  SAIR! ", definition())).toMatchObject({ outcome: "correct", reason: "STANDARD_ANSWER", severity: "none" });
  });

  it("protects every explicitly approved regional variant from becoming a gap", () => {
    expect(classifyLearningAttempt("bazar", definition())).toMatchObject({ outcome: "correct", reason: "VALID_REGIONAL_VARIANT", acceptedRegionalVariant: "pt-AO", category: "none" });
  });

  it("classifies unmatched evidence with server-owned category and severity", () => {
    expect(classifyLearningAttempt("partir-se", definition())).toEqual({ outcome: "incorrect", score: 0, confirmed: true, category: "vocabulary", reason: "NO_ACCEPTED_MATCH", severity: "medium" });
  });

  it("rejects malformed definitions and raw attempts", () => {
    expect(validateActivityDefinition({ ...definition(), acceptedRegionalAnswers: { fabricated: ["x"] } })).toContain("invalid acceptedRegionalAnswers");
    expect(validateRawLearningAttempt({ tenantId: "tenant-1", studentId: "student-1", activityId: "activity-1", actualResponse: "x", occurredAt: new Date().toISOString(), idempotencyKey: "short" })).toContain("invalid idempotencyKey");
  });
});
