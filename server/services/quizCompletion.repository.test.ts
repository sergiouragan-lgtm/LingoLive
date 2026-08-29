import { beforeEach, describe, expect, it } from "vitest";
import { localMemoryDb } from "./firestoreSafe.service";
import { completeQuiz } from "./quizCompletion.repository";

const questions = Array.from({ length: 5 }, (_, index) => ({ id: `q${index}`, correctAnswerIndex: 0, explanation: "Evidence", skill: index < 2 ? "grammar" : "vocabulary", difficulty: "A1" }));
const seed = (uid = "u1", id = "s1") => localMemoryDb.set(`quiz_sessions_${id}`, { userId: uid, language: "English", questions, status: "active", expiresAt: new Date(Date.now() + 60_000).toISOString() });
describe("atomic quiz completion", () => {
  beforeEach(() => { localMemoryDb.clear(); seed(); });
  it("updates session, progress, memory and XP exactly once on replay", async () => {
    const first = await completeQuiz("u1", "s1", [1, 0, 0, 0, 0], 2);
    const replay = await completeQuiz("u1", "s1", [1, 0, 0, 0, 0], 2);
    expect(first.duplicated).toBe(false); expect(replay.duplicated).toBe(true);
    expect(localMemoryDb.get("learning_progress_u1").completedByType.quiz).toBe(1);
    expect(localMemoryDb.get("user_gamification_u1").xp).toBe(100);
    expect(localMemoryDb.get("user_memory_u1").grammarWeaknesses).toContain("Reforçar grammar A1");
  });
  it("handles concurrent identical submissions without duplicate XP", async () => {
    const results = await Promise.all([completeQuiz("u1", "s1", [0,0,0,0,0], 1), completeQuiz("u1", "s1", [0,0,0,0,0], 1)]);
    expect(results.filter(result => !result.duplicated)).toHaveLength(1);
    expect(localMemoryDb.get("user_gamification_u1").xp).toBe(100);
  });
  it("does not mutate an expired or foreign session", async () => {
    await expect(completeQuiz("u2", "s1", [0,0,0,0,0], 1)).rejects.toMatchObject({ code: "NOT_FOUND" });
    localMemoryDb.set("quiz_sessions_s1", { ...localMemoryDb.get("quiz_sessions_s1"), expiresAt: new Date(0).toISOString() });
    await expect(completeQuiz("u1", "s1", [0,0,0,0,0], 1)).rejects.toMatchObject({ code: "EXPIRED" });
    expect(localMemoryDb.get("user_gamification_u1")).toBeUndefined();
  });
});
