import { beforeEach, describe, expect, it } from "vitest";
import { localMemoryDb } from "./firestoreSafe.service";
import { LearningEventCollisionError, recordLearningEvent } from "./learningProgress.repository";

const event = {
  id: "quiz_event_001",
  type: "quiz" as const,
  language: "en",
  occurredAt: "2026-08-28T10:00:00.000Z",
  durationMinutes: 5,
  score: 80,
  skills: ["reading" as const],
};

describe("learning progress repository", () => {
  beforeEach(() => localMemoryDb.clear());

  it("persiste agregado e trata replay idêntico como duplicado", async () => {
    const first = await recordLearningEvent("alice", event);
    const replay = await recordLearningEvent("alice", event);
    expect(first.duplicate).toBe(false);
    expect(replay.duplicate).toBe(true);
    expect(replay.progress.totalActivities).toBe(1);
  });

  it("mantém idempotência após mais de 100 eventos", async () => {
    await recordLearningEvent("alice", event);
    for (let index = 0; index < 110; index += 1) {
      await recordLearningEvent("alice", { ...event, id: `quiz_event_${String(index + 100).padStart(3, "0")}` });
    }
    const replay = await recordLearningEvent("alice", event);
    expect(replay.duplicate).toBe(true);
    expect(replay.progress.totalActivities).toBe(111);
  });

  it("rejeita reutilização do id com payload diferente", async () => {
    await recordLearningEvent("alice", event);
    await expect(recordLearningEvent("alice", { ...event, score: 100 })).rejects.toBeInstanceOf(LearningEventCollisionError);
  });
});
