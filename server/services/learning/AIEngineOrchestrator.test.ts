import { describe, expect, it, vi } from "vitest";
import { AIEngineOrchestrator, LearnerStateStore } from "./AIEngineOrchestrator";

function createStore(overrides: Partial<LearnerStateStore> = {}): LearnerStateStore {
  return {
    getStudent: vi.fn().mockResolvedValue({ level: "A2", languageNative: "Portuguese", languageTarget: "English", xp: 20 }),
    getMemory: vi.fn().mockResolvedValue({ interactions: 2, recentTopics: ["travel"] }),
    saveProgress: vi.fn().mockResolvedValue(undefined),
    saveMemory: vi.fn().mockResolvedValue(undefined),
    appendInteraction: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("AIEngineOrchestrator", () => {
  it("executes the tutor and persists progress, memory and the interaction", async () => {
    const store = createStore();
    const tutor = vi.fn().mockResolvedValue("Good start. Say: I would like a coffee, please.");
    const orchestrator = new AIEngineOrchestrator(store, tutor, () => new Date("2026-08-28T10:00:00.000Z"));
    const result = await orchestrator.processInteraction({ userId: "student-1", message: "I want coffee", task: "restaurant" });
    expect(tutor).toHaveBeenCalledWith(expect.objectContaining({ userId: "student-1", level: "A2", languageTarget: "English", lessonContext: "restaurant" }));
    expect(result.evaluation.completed).toBe(true);
    expect(result.evaluation).toEqual(expect.objectContaining({ lexicalDiversity: 100, sentenceComplete: false, nextLevel: "A2" }));
    expect(result.progress).toEqual({ interactions: 3, xp: 26, lastActivityAt: "2026-08-28T10:00:00.000Z" });
    expect(store.saveProgress).toHaveBeenCalledWith("student-1", result.progress);
    expect(store.saveMemory).toHaveBeenCalledWith("student-1", expect.objectContaining({ lastTask: "restaurant" }));
    expect(store.appendInteraction).toHaveBeenCalledWith(expect.objectContaining({ userId: "student-1", completed: true }));
  });

  it("advances one CEFR level after sustained high performance", async () => {
    const store = createStore({
      getMemory: vi.fn().mockResolvedValue({ interactions: 9, averageScore: 90, recentTopics: [] }),
    });
    const orchestrator = new AIEngineOrchestrator(store, vi.fn().mockResolvedValue("Excellent work."));
    const result = await orchestrator.processInteraction({
      userId: "student-1",
      message: "I would like to reserve a quiet table near the window, please.",
    });
    expect(result.evaluation.nextLevel).toBe("B1");
    expect(store.saveMemory).toHaveBeenCalledWith("student-1", expect.objectContaining({ level: "B1" }));
  });

  it("rejects an empty identity or message", async () => {
    const orchestrator = new AIEngineOrchestrator(createStore(), vi.fn());
    await expect(orchestrator.processInteraction({ userId: "", message: "hello" })).rejects.toThrow("AUTHENTICATED_USER_REQUIRED");
    await expect(orchestrator.processInteraction({ userId: "student-1", message: "   " })).rejects.toThrow("LEARNER_MESSAGE_REQUIRED");
  });

  it("does not persist when the tutor returns an empty response", async () => {
    const store = createStore();
    const orchestrator = new AIEngineOrchestrator(store, vi.fn().mockResolvedValue(""));
    await expect(orchestrator.processInteraction({ userId: "student-1", message: "hello" })).rejects.toThrow("TUTOR_EMPTY_RESPONSE");
    expect(store.saveProgress).not.toHaveBeenCalled();
    expect(store.saveMemory).not.toHaveBeenCalled();
  });
});
