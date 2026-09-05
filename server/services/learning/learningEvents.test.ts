import { beforeEach, describe, expect, it } from "vitest";
import { localMemoryDb, safeGetDoc, safeSetDoc } from "../firestoreSafe.service";
import {
  buildIdempotencyKey,
  CANONICAL_LEARNING_EVENTS,
  CANONICAL_LEARNING_EVENT_TYPES,
  EVENT_XP_SOURCE,
  ingestLearningEvent,
  isCanonicalLearningEvent,
  listLearningEvents,
  resolveLearningActor,
} from "./learningEvents.service";

const ACTOR = {
  userId: "student-1",
  tenantId: "escola-alfa",
  schoolId: "escola-alfa-sede",
  classId: "turma-a",
};

const clearCollection = (prefix: string) => {
  for (const key of [...localMemoryDb.keys()]) {
    if (key.startsWith(prefix)) localMemoryDb.delete(key);
  }
};

beforeEach(() => {
  for (const prefix of [
    "learning_events_",
    "learning_event_projections_",
    "user_gamification_",
    "xp_audit_logs_",
    "user_memory_",
    "adaptive_profiles_",
    "users_",
  ]) {
    clearCollection(prefix);
  }
});

describe("catálogo canónico", () => {
  it("cobre as três atividades mobile e mapeia todas para uma fonte de XP", () => {
    expect(CANONICAL_LEARNING_EVENT_TYPES).toHaveLength(3);
    for (const type of CANONICAL_LEARNING_EVENT_TYPES) {
      expect(isCanonicalLearningEvent(type)).toBe(true);
      expect(EVENT_XP_SOURCE[type]).toBeTruthy();
    }
    expect(isCanonicalLearningEvent("learning.inventado")).toBe(false);
  });

  it("gera a mesma chave de idempotência para a mesma atividade e utilizador", () => {
    const a = buildIdempotencyKey(CANONICAL_LEARNING_EVENTS.QUIZ_COMPLETED, ACTOR, "quiz-1:att-1");
    const b = buildIdempotencyKey(CANONICAL_LEARNING_EVENTS.QUIZ_COMPLETED, ACTOR, "quiz-1:att-1");
    const other = buildIdempotencyKey(CANONICAL_LEARNING_EVENTS.QUIZ_COMPLETED, ACTOR, "quiz-1:att-2");
    expect(a).toBe(b);
    expect(a).not.toBe(other);
  });

  it("isola tenants diferentes na mesma atividade", () => {
    const alfa = buildIdempotencyKey(CANONICAL_LEARNING_EVENTS.QUIZ_COMPLETED, ACTOR, "quiz-1");
    const beta = buildIdempotencyKey(
      CANONICAL_LEARNING_EVENTS.QUIZ_COMPLETED,
      { ...ACTOR, tenantId: "escola-beta" },
      "quiz-1",
    );
    expect(alfa).not.toBe(beta);
  });
});

describe("resolveLearningActor", () => {
  it("prefere as claims assinadas ao documento do utilizador", async () => {
    await safeSetDoc("users", "student-2", { tenantId: "do-firestore", classId: "turma-x" });
    const actor = await resolveLearningActor({ uid: "student-2", tenantId: "do-token" });
    expect(actor.tenantId).toBe("do-token");
    expect(actor.classId).toBe("turma-x");
  });

  it("recusa um pedido sem identidade", async () => {
    await expect(resolveLearningActor({})).rejects.toThrow("LEARNING_ACTOR_UNRESOLVED");
  });
});

describe("ingestão de eventos canónicos", () => {
  it("persiste o evento, atribui XP e projeta memória e progresso", async () => {
    const { event, duplicated, xp } = await ingestLearningEvent({
      type: CANONICAL_LEARNING_EVENTS.QUIZ_COMPLETED,
      actor: ACTOR,
      activityId: "quiz-1:att-1",
      score: 80,
      language: "en",
      payload: { masteredTerms: ["hello"], strugglingTerms: ["through"] },
    });

    expect(duplicated).toBe(false);
    expect(event.type).toBe(CANONICAL_LEARNING_EVENTS.QUIZ_COMPLETED);
    expect(event.userId).toBe(ACTOR.userId);
    expect(event.tenantId).toBe(ACTOR.tenantId);
    expect(xp.awardedXp).toBe(100);

    const gamification = await safeGetDoc("user_gamification", ACTOR.userId);
    expect(gamification.data().xp).toBe(100);

    const memory = await safeGetDoc("user_memory", ACTOR.userId);
    expect(memory.data().vocabularyMastered).toContain("hello");
    expect(memory.data().grammarWeaknesses).toContain("through");

    const profile = await safeGetDoc("adaptive_profiles", ACTOR.userId);
    expect(profile.data().quizScoreAverage).toBe(80);
    expect(profile.data().mobileQuizAttempts).toBe(1);
  });

  it("não duplica XP quando a mesma atividade é reenviada", async () => {
    const input = {
      type: CANONICAL_LEARNING_EVENTS.FLASHCARD_REVIEWED,
      actor: ACTOR,
      activityId: "card-1:sessao-1",
      score: 60,
    } as const;

    await ingestLearningEvent(input);
    const second = await ingestLearningEvent(input);

    expect(second.duplicated).toBe(true);
    const gamification = await safeGetDoc("user_gamification", ACTOR.userId);
    expect(gamification.data().xp).toBe(30);
  });

  it("promove um termo de fraqueza para dominado quando é acertado depois", async () => {
    await ingestLearningEvent({
      type: CANONICAL_LEARNING_EVENTS.QUIZ_COMPLETED,
      actor: ACTOR,
      activityId: "quiz-1:att-1",
      score: 40,
      payload: { strugglingTerms: ["through"] },
    });
    await ingestLearningEvent({
      type: CANONICAL_LEARNING_EVENTS.QUIZ_COMPLETED,
      actor: ACTOR,
      activityId: "quiz-1:att-2",
      score: 90,
      payload: { masteredTerms: ["through"] },
    });

    const memory = await safeGetDoc("user_memory", ACTOR.userId);
    expect(memory.data().vocabularyMastered).toContain("through");
    expect(memory.data().grammarWeaknesses).not.toContain("through");
  });

  it("calcula a média de quiz a partir de todas as tentativas persistidas", async () => {
    await ingestLearningEvent({
      type: CANONICAL_LEARNING_EVENTS.QUIZ_COMPLETED,
      actor: ACTOR,
      activityId: "quiz-1:att-1",
      score: 60,
    });
    await ingestLearningEvent({
      type: CANONICAL_LEARNING_EVENTS.QUIZ_COMPLETED,
      actor: ACTOR,
      activityId: "quiz-1:att-2",
      score: 100,
    });

    const profile = await safeGetDoc("adaptive_profiles", ACTOR.userId);
    expect(profile.data().quizScoreAverage).toBe(80);
    expect(profile.data().mobileQuizAttempts).toBe(2);
  });

  it("recusa tipos de evento fora do catálogo canónico", async () => {
    await expect(
      ingestLearningEvent({
        type: "learning.inventado" as never,
        actor: ACTOR,
        activityId: "x",
        score: 10,
      }),
    ).rejects.toThrow("LEARNING_EVENT_TYPE_UNKNOWN");
  });

  it("devolve a linha temporal do utilizador ordenada e limitada ao próprio", async () => {
    await ingestLearningEvent({
      type: CANONICAL_LEARNING_EVENTS.QUIZ_COMPLETED,
      actor: ACTOR,
      activityId: "quiz-1:att-1",
      score: 70,
      occurredOn: "2026-01-01T00:00:00.000Z",
    });
    await ingestLearningEvent({
      type: CANONICAL_LEARNING_EVENTS.PRONUNCIATION_EVALUATED,
      actor: ACTOR,
      activityId: "eval-1",
      score: 90,
      occurredOn: "2026-02-01T00:00:00.000Z",
    });
    await ingestLearningEvent({
      type: CANONICAL_LEARNING_EVENTS.QUIZ_COMPLETED,
      actor: { ...ACTOR, userId: "outro-aluno" },
      activityId: "quiz-1:att-1",
      score: 50,
    });

    const timeline = await listLearningEvents(ACTOR.userId);
    expect(timeline).toHaveLength(2);
    expect(timeline[0].type).toBe(CANONICAL_LEARNING_EVENTS.PRONUNCIATION_EVALUATED);
    expect(timeline.every((event) => event.userId === ACTOR.userId)).toBe(true);
  });

  it("limita a pontuação ao intervalo 0..100", async () => {
    const { event } = await ingestLearningEvent({
      type: CANONICAL_LEARNING_EVENTS.PRONUNCIATION_EVALUATED,
      actor: ACTOR,
      activityId: "eval-fora-de-escala",
      score: 250,
    });
    expect(event.score).toBe(100);
  });
});
