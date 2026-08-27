import { describe, expect, it } from "vitest";
import { applyLearningEvent, normalizeLearningEvent, normalizeLearningProgress } from "./learningProgress.service";

describe("learning progress service", () => {
  it("aggregates activities and skill averages", () => {
    let progress = normalizeLearningProgress(null, "u1");
    const first = normalizeLearningEvent({ id: "quiz_12345678", type: "quiz", language: "en", occurredAt: "2026-08-26T10:00:00Z", durationMinutes: 5, score: 80, skills: ["grammar", "vocabulary"] })!;
    const second = normalizeLearningEvent({ id: "quiz_87654321", type: "quiz", language: "en", occurredAt: "2026-08-26T11:00:00Z", durationMinutes: 4, score: 100, skills: ["grammar"] })!;
    progress = applyLearningEvent(applyLearningEvent(progress, first), second);

    expect(progress.totalActivities).toBe(2);
    expect(progress.totalMinutes).toBe(9);
    expect(progress.completedByType.quiz).toBe(2);
    expect(progress.skills.grammar.averageScore).toBe(90);
  });

  it("is idempotent for retried events", () => {
    const progress = normalizeLearningProgress(null, "u1");
    const event = normalizeLearningEvent({ id: "event_12345678", type: "lesson", skills: [], durationMinutes: 10 })!;
    const once = applyLearningEvent(progress, event);
    expect(applyLearningEvent(once, event)).toBe(once);
  });

  it("rejects invalid event types and clamps unsafe metrics", () => {
    expect(normalizeLearningEvent({ id: "short", type: "hacked" })).toBeNull();
    const event = normalizeLearningEvent({ id: "event_abcdefgh", type: "assessment", durationMinutes: 5000, score: 500, skills: ["writing", "invalid"] })!;
    expect(event.durationMinutes).toBe(600);
    expect(event.score).toBe(100);
    expect(event.skills).toEqual(["writing"]);
  });
});
