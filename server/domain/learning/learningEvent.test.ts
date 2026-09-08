import { describe, expect, it } from "vitest";
import { LEARNING_EVENT_SCHEMA_VERSION, projectLearningGap, stableDocumentId, validateLearningEvent, type LearningEventV1 } from "./learningEvent";

function event(overrides: Partial<LearningEventV1> = {}): LearningEventV1 {
  return {
    schemaVersion: LEARNING_EVENT_SCHEMA_VERSION, eventType: "ATTEMPT_EVALUATED",
    tenantId: "tenant-ao", studentId: "student-1", languageCode: "en", cefrLevel: "B1",
    activity: { id: "exercise-1", type: "cloze_test" },
    response: { actual: "I has finished", expected: "I have finished" },
    target: { type: "grammar", key: "present-perfect-have", label: "Present perfect: have" },
    result: { outcome: "incorrect", score: 0, confirmed: true }, severity: "high",
    occurredAt: new Date().toISOString(), idempotencyKey: "attempt-1:question-1", ...overrides,
  };
}

describe("canonical learning event and gap projector", () => {
  it("accepts the complete versioned contract", () => expect(validateLearningEvent(event())).toEqual([]));

  it("preserves a blank answer as real evidence instead of discarding the attempt", () => {
    expect(validateLearningEvent(event({ response: { actual: "", expected: "have" } }))).toEqual([]);
  });

  it("rejects unconfirmed, oversized and replay-unsafe evidence", () => {
    const invalid = event({ response: { actual: "x".repeat(4001) }, result: { outcome: "incorrect", score: 0, confirmed: false }, idempotencyKey: "bad key" });
    expect(validateLearningEvent(invalid)).toEqual(expect.arrayContaining(["invalid response", "invalid confirmed result", "invalid idempotencyKey format"]));
  });

  it("increases a confirmed gap and keeps the source event auditable", () => {
    const gap = projectLearningGap(event());
    expect(gap).toMatchObject({ status: "active", weaknessScore: 0.3, totalFailures: 1, successfulReassessments: 0 });
    expect(gap.sourceEventId).toBe(stableDocumentId("tenant-ao", "attempt-1:question-1"));
  });

  it("reduces and eventually masters a gap only after repeated reassessment success", () => {
    const active = projectLearningGap(event({ severity: "critical" }));
    const success = event({ eventType: "REASSESSMENT_EVALUATED", result: { outcome: "correct", score: 1, confirmed: true }, severity: "none", idempotencyKey: "reassessment-1" });
    const remediating = projectLearningGap(success, active);
    const mastered = projectLearningGap({ ...success, idempotencyKey: "reassessment-2" }, remediating);
    expect(remediating.status).toBe("remediating");
    expect(mastered).toMatchObject({ status: "mastered", weaknessScore: 0, totalFailures: 1, successfulReassessments: 2 });
  });

  it("produces deterministic document IDs for idempotent retries", () => {
    expect(stableDocumentId("tenant", "same-key")).toBe(stableDocumentId("tenant", "same-key"));
    expect(stableDocumentId("tenant", "same-key")).not.toBe(stableDocumentId("tenant", "other-key"));
  });
});
