import { beforeEach, describe, expect, it } from "vitest";
import { completeFlashcardSession, completePronunciation } from "./canonicalPracticeCompletion.service";
import { localMemoryDb } from "./firestoreSafe.service";

describe("canonical practice completion", () => {
  beforeEach(() => localMemoryDb.clear());

  it("records pronunciation progress, memory and XP once", async () => {
    const evaluation = { targetText: "three", overallScore: 80, phonemeAnalysis: [{ ipaSymbol: "θ", accuracy: 45 }] };
    const first = await completePronunciation("u1", "attempt_12345678", evaluation, "en", 1);
    const replay = await completePronunciation("u1", "attempt_12345678", evaluation, "en", 1);
    expect(first.duplicate).toBe(false);
    expect(replay).toMatchObject({ duplicate: true, xpAwarded: 0 });
    expect(localMemoryDb.get("learning_progress_u1").completedByType.pronunciation).toBe(1);
    expect(localMemoryDb.get("user_memory_u1").pronunciationErrors).toContain("θ");
    expect(localMemoryDb.get("user_gamification_u1").xp).toBe(first.xpAwarded);
  });

  it("records a flashcard review canonically and rejects an id collision", async () => {
    const input = { language: "en", durationMinutes: 2, ratings: [{ cardId: "c1", word: "hello", rating: "known" }, { cardId: "c2", word: "world", rating: "learning" }] };
    const first = await completeFlashcardSession("u1", "session_12345678", input);
    const replay = await completeFlashcardSession("u1", "session_12345678", input);
    expect(replay.duplicate).toBe(true);
    expect(localMemoryDb.get("learning_progress_u1").completedByType.vocabulary).toBe(1);
    expect(localMemoryDb.get("user_memory_u1")).toMatchObject({ vocabularyMastered: ["hello"], vocabularyNeedsReview: ["world"], flashcardsReviewed: 2 });
    expect(localMemoryDb.get("user_gamification_u1").xp).toBe(first.xpAwarded);
    await expect(completeFlashcardSession("u1", "session_12345678", { ...input, ratings: [{ cardId: "c1", word: "changed", rating: "known" }] })).rejects.toMatchObject({ code: "EVENT_ID_COLLISION" });
  });
});
