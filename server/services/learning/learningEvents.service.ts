import crypto from "crypto";
import { dbAdmin } from "../../config/firebaseAdmin";
import {
  isFirestoreAdminUsable,
  safeAddDoc,
  safeGetDoc,
  safeQueryDocs,
  safeSetDoc,
} from "../firestoreSafe.service";

/**
 * Catálogo canónico de eventos de aprendizagem.
 *
 * Estes nomes são o contrato partilhado entre a aplicação web, a aplicação
 * mobile e os projectores de progresso/XP/memória. Nenhum consumidor deve
 * inventar variantes: qualquer evento novo tem de ser adicionado aqui e
 * mapeado em `EVENT_XP_SOURCE`.
 */
export const CANONICAL_LEARNING_EVENTS = {
  QUIZ_COMPLETED: "learning.quiz.completed",
  PRONUNCIATION_EVALUATED: "learning.pronunciation.evaluated",
  FLASHCARD_REVIEWED: "learning.flashcard.reviewed",
} as const;

export type CanonicalLearningEventType =
  (typeof CANONICAL_LEARNING_EVENTS)[keyof typeof CANONICAL_LEARNING_EVENTS];

export const CANONICAL_LEARNING_EVENT_TYPES: CanonicalLearningEventType[] =
  Object.values(CANONICAL_LEARNING_EVENTS);

/**
 * Cada evento canónico mapeia para um `eventType` do REWARD_MATRIX servido por
 * `/api/gamification/award-xp`, de modo a que web e mobile atribuam exactamente
 * o mesmo XP para a mesma atividade.
 */
export const EVENT_XP_SOURCE: Record<CanonicalLearningEventType, string> = {
  [CANONICAL_LEARNING_EVENTS.QUIZ_COMPLETED]: "quiz_attempt",
  [CANONICAL_LEARNING_EVENTS.PRONUNCIATION_EVALUATED]: "speaking_practice",
  [CANONICAL_LEARNING_EVENTS.FLASHCARD_REVIEWED]: "activity_completion",
};

export const LEARNING_EVENTS_COLLECTION = "learning_events";
export const LEARNING_EVENT_SCHEMA_VERSION = 1;

export type LearningEventSource = "mobile" | "web" | "server";

export interface LearningEventActor {
  userId: string;
  tenantId: string;
  schoolId: string | null;
  classId: string | null;
}

export interface CanonicalLearningEvent {
  eventId: string;
  idempotencyKey: string;
  type: CanonicalLearningEventType;
  version: number;
  occurredOn: string;
  recordedAt: string;
  source: LearningEventSource;
  actor: LearningEventActor;
  /** Cópia plana de `actor.userId` para permitir consultas em todos os backends. */
  userId: string;
  /** Cópia plana de `actor.tenantId` para isolamento por tenant nas consultas. */
  tenantId: string;
  activityId: string;
  language: string | null;
  /** Percentagem 0..100 do desempenho na atividade. */
  score: number;
  payload: Record<string, unknown>;
}

export interface PublishLearningEventInput {
  type: CanonicalLearningEventType;
  actor: LearningEventActor;
  activityId: string;
  score: number;
  language?: string | null;
  source?: LearningEventSource;
  occurredOn?: string;
  payload?: Record<string, unknown>;
}

export function isCanonicalLearningEvent(type: string): type is CanonicalLearningEventType {
  return CANONICAL_LEARNING_EVENT_TYPES.includes(type as CanonicalLearningEventType);
}

/**
 * A chave de idempotência é determinística: o mesmo utilizador, no mesmo tenant,
 * a submeter a mesma atividade do mesmo tipo produz sempre o mesmo evento. Isto
 * impede que uma repetição de rede na app mobile duplique XP ou progresso.
 */
export function buildIdempotencyKey(
  type: CanonicalLearningEventType,
  actor: Pick<LearningEventActor, "userId" | "tenantId">,
  activityId: string,
): string {
  return crypto
    .createHash("sha256")
    .update(`${type}|${actor.tenantId}|${actor.userId}|${activityId}`)
    .digest("hex");
}

const clampScore = (value: unknown): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
};

/**
 * Resolve o actor canónico a partir do documento real do utilizador. O tenant
 * nunca é lido do corpo do pedido: vem das custom claims ou do perfil persistido.
 */
export async function resolveLearningActor(user: any): Promise<LearningEventActor> {
  const userId = user?.uid;
  if (!userId) {
    throw new Error("LEARNING_ACTOR_UNRESOLVED");
  }

  const snapshot = await safeGetDoc("users", userId);
  const profile = snapshot.exists ? snapshot.data() : {};

  return {
    userId,
    tenantId: String(user?.tenantId || profile.tenantId || profile.organizationId || "default"),
    schoolId: user?.schoolId || profile.schoolId || null,
    classId: user?.classId || profile.classId || profile.turma || null,
  };
}

/**
 * Persiste o evento canónico de forma idempotente. Devolve `duplicated: true`
 * quando o evento já existia, sem reescrever o registo original.
 */
export async function publishLearningEvent(
  input: PublishLearningEventInput,
): Promise<{ event: CanonicalLearningEvent; duplicated: boolean }> {
  if (!isCanonicalLearningEvent(input.type)) {
    throw new Error(`LEARNING_EVENT_TYPE_UNKNOWN: ${input.type}`);
  }
  if (!input.activityId) {
    throw new Error("LEARNING_EVENT_ACTIVITY_REQUIRED");
  }

  const idempotencyKey = buildIdempotencyKey(input.type, input.actor, input.activityId);
  const nowIso = new Date().toISOString();

  const event: CanonicalLearningEvent = {
    eventId: idempotencyKey,
    idempotencyKey,
    type: input.type,
    version: LEARNING_EVENT_SCHEMA_VERSION,
    occurredOn: input.occurredOn || nowIso,
    recordedAt: nowIso,
    source: input.source || "mobile",
    actor: input.actor,
    userId: input.actor.userId,
    tenantId: input.actor.tenantId,
    activityId: input.activityId,
    language: input.language ?? null,
    score: clampScore(input.score),
    payload: input.payload || {},
  };

  const existing = await safeGetDoc(LEARNING_EVENTS_COLLECTION, idempotencyKey);
  if (existing.exists) {
    return { event: existing.data() as CanonicalLearningEvent, duplicated: true };
  }

  await safeSetDoc(LEARNING_EVENTS_COLLECTION, idempotencyKey, event);
  return { event, duplicated: false };
}

/**
 * Lê a linha temporal canónica do utilizador, ordenada do mais recente para o
 * mais antigo. Só devolve eventos realmente persistidos.
 */
export async function listLearningEvents(
  userId: string,
  limit = 50,
): Promise<CanonicalLearningEvent[]> {
  const events = await safeQueryDocs(LEARNING_EVENTS_COLLECTION, "userId", userId);
  return events
    .filter((event: any) => isCanonicalLearningEvent(event?.type))
    .sort((a: any, b: any) => Date.parse(b.occurredOn || 0) - Date.parse(a.occurredOn || 0))
    .slice(0, limit) as CanonicalLearningEvent[];
}

export interface XpAwardResult {
  awardedXp: number;
  awardedCoins: number;
  newTotalXp: number;
  newLevel: number;
  duplicated: boolean;
  auditId: string;
}

const REWARD_MATRIX: Record<string, { xp: number; coins: number }> = {
  lesson_completion: { xp: 50, coins: 10 },
  quiz_attempt: { xp: 100, coins: 20 },
  activity_completion: { xp: 30, coins: 5 },
  daily_streak: { xp: 20, coins: 5 },
  speaking_practice: { xp: 40, coins: 10 },
};

/**
 * Atribui XP para um evento canónico usando exactamente o mesmo modelo de dados
 * (`xp_audit_logs`, `user_gamification`, `leaderboard_entries`) da rota web
 * `/api/gamification/award-xp`. O cliente nunca envia valores de XP.
 */
export async function awardXpForLearningEvent(
  event: CanonicalLearningEvent,
): Promise<XpAwardResult> {
  const xpSource = EVENT_XP_SOURCE[event.type];
  const reward = REWARD_MATRIX[xpSource] || { xp: 20, coins: 5 };
  const auditId = crypto
    .createHash("sha256")
    .update(`${event.actor.userId}_${event.actor.tenantId}_${xpSource}_${event.eventId}`)
    .digest("hex");

  if (!isFirestoreAdminUsable()) {
    // Ambiente sem Admin SDK (sandbox/testes): mantemos o registo de auditoria
    // em memória para que a idempotência continue a ser observável.
    const existing = await safeGetDoc("xp_audit_logs", auditId);
    if (existing.exists) {
      const data = existing.data();
      return {
        awardedXp: data.awardedXp || 0,
        awardedCoins: data.awardedCoins || 0,
        newTotalXp: data.newTotalXp || 0,
        newLevel: data.newLevel || 1,
        duplicated: true,
        auditId,
      };
    }
    const stateSnapshot = await safeGetDoc("user_gamification", event.actor.userId);
    const state = stateSnapshot.exists ? stateSnapshot.data() : {};
    const newTotalXp = Number(state.xp || 0) + reward.xp;
    const newLevel = Math.floor(newTotalXp / 500) + 1;
    await safeSetDoc("user_gamification", event.actor.userId, {
      userId: event.actor.userId,
      xp: newTotalXp,
      totalXp: newTotalXp,
      coins: Number(state.coins || 0) + reward.coins,
      level: newLevel,
      organizationId: event.actor.tenantId,
      schoolId: event.actor.schoolId,
      classId: event.actor.classId,
      updatedAt: new Date().toISOString(),
    }, true);
    await safeSetDoc("xp_audit_logs", auditId, {
      auditId,
      eventId: event.eventId,
      eventType: xpSource,
      canonicalEventType: event.type,
      userId: event.actor.userId,
      organizationId: event.actor.tenantId,
      awardedXp: reward.xp,
      awardedCoins: reward.coins,
      newTotalXp,
      newLevel,
      createdAt: new Date().toISOString(),
    });
    return {
      awardedXp: reward.xp,
      awardedCoins: reward.coins,
      newTotalXp,
      newLevel,
      duplicated: false,
      auditId,
    };
  }

  const auditRef = dbAdmin.collection("xp_audit_logs").doc(auditId);
  const gamificationRef = dbAdmin.collection("user_gamification").doc(event.actor.userId);
  const leaderboardRef = dbAdmin.collection("leaderboard_entries").doc(event.actor.userId);

  return await dbAdmin.runTransaction(async (transaction: any) => {
    const auditSnap = await transaction.get(auditRef);
    if (auditSnap.exists) {
      const data = auditSnap.data();
      return {
        awardedXp: data.awardedXp || 0,
        awardedCoins: data.awardedCoins || 0,
        newTotalXp: data.newTotalXp || 0,
        newLevel: data.newLevel || 1,
        duplicated: true,
        auditId,
      };
    }

    const gamificationSnap = await transaction.get(gamificationRef);
    const current = gamificationSnap.exists ? gamificationSnap.data() : {};
    const previousXp = current.xp || current.totalXp || 0;
    const newTotalXp = previousXp + reward.xp;
    const newLevel = Math.floor(newTotalXp / 500) + 1;
    const nowIso = new Date().toISOString();

    transaction.set(gamificationRef, {
      userId: event.actor.userId,
      xp: newTotalXp,
      totalXp: newTotalXp,
      coins: (current.coins || 0) + reward.coins,
      level: newLevel,
      organizationId: event.actor.tenantId,
      schoolId: event.actor.schoolId,
      classId: event.actor.classId,
      updatedAt: nowIso,
    }, { merge: true });

    transaction.set(leaderboardRef, {
      userId: event.actor.userId,
      xp: newTotalXp,
      level: newLevel,
      organizationId: event.actor.tenantId,
      schoolId: event.actor.schoolId,
      classId: event.actor.classId,
      visibility: current.visibility || "PUBLIC",
      updatedAt: nowIso,
    }, { merge: true });

    transaction.set(auditRef, {
      auditId,
      eventId: event.eventId,
      eventType: xpSource,
      canonicalEventType: event.type,
      userId: event.actor.userId,
      organizationId: event.actor.tenantId,
      classId: event.actor.classId,
      awardedXp: reward.xp,
      awardedCoins: reward.coins,
      previousXp,
      newTotalXp,
      newLevel,
      source: event.source,
      createdAt: nowIso,
    });

    return {
      awardedXp: reward.xp,
      awardedCoins: reward.coins,
      newTotalXp,
      newLevel,
      duplicated: false,
      auditId,
    };
  });
}

/**
 * Projeta o evento canónico na memória de longo prazo (`user_memory`) usada
 * pelo motor de conversação. Só escreve evidência derivada do evento real.
 */
export async function projectEventIntoMemory(event: CanonicalLearningEvent): Promise<void> {
  const snapshot = await safeGetDoc("user_memory", event.actor.userId);
  const memory = snapshot.exists ? snapshot.data() : {};

  const vocabularyMastered: string[] = Array.isArray(memory.vocabularyMastered)
    ? [...memory.vocabularyMastered] : [];
  const grammarWeaknesses: string[] = Array.isArray(memory.grammarWeaknesses)
    ? [...memory.grammarWeaknesses] : [];

  const masteredTerms = Array.isArray(event.payload.masteredTerms)
    ? (event.payload.masteredTerms as unknown[]).map(String) : [];
  const strugglingTerms = Array.isArray(event.payload.strugglingTerms)
    ? (event.payload.strugglingTerms as unknown[]).map(String) : [];

  for (const term of masteredTerms) {
    if (!vocabularyMastered.includes(term)) vocabularyMastered.push(term);
    const weakIndex = grammarWeaknesses.indexOf(term);
    if (weakIndex !== -1) grammarWeaknesses.splice(weakIndex, 1);
  }
  for (const term of strugglingTerms) {
    if (!grammarWeaknesses.includes(term)) grammarWeaknesses.push(term);
  }

  await safeSetDoc("user_memory", event.actor.userId, {
    ...memory,
    userId: event.actor.userId,
    tenantId: event.actor.tenantId,
    vocabularyMastered: vocabularyMastered.slice(-500),
    grammarWeaknesses: grammarWeaknesses.slice(-200),
    lastEventType: event.type,
    lastEventId: event.eventId,
    lastUpdated: event.recordedAt,
    privacyLevel: memory.privacyLevel || "private",
  }, true);
}

/**
 * Actualiza o perfil adaptativo com a evidência do evento. Cada tipo canónico
 * alimenta a dimensão pedagógica correspondente.
 */
export async function projectEventIntoProgress(event: CanonicalLearningEvent): Promise<void> {
  const snapshot = await safeGetDoc("adaptive_profiles", event.actor.userId);
  const profile = snapshot.exists ? snapshot.data() : { userId: event.actor.userId };

  const patch: Record<string, unknown> = {
    ...profile,
    userId: event.actor.userId,
    tenantId: event.actor.tenantId,
    lastUpdated: event.recordedAt,
  };

  if (event.type === CANONICAL_LEARNING_EVENTS.QUIZ_COMPLETED) {
    const attempts = Number(profile.mobileQuizAttempts || 0) + 1;
    const previousAverage = Number(profile.quizScoreAverage || 0);
    patch.mobileQuizAttempts = attempts;
    patch.quizScoreAverage = Math.round(
      (previousAverage * (attempts - 1) + event.score) / attempts,
    );
    patch.latestQuizScore = event.score;
  }

  if (event.type === CANONICAL_LEARNING_EVENTS.PRONUNCIATION_EVALUATED) {
    patch.latestPronunciationScore = event.score;
    patch.speakingScore = event.score;
  }

  if (event.type === CANONICAL_LEARNING_EVENTS.FLASHCARD_REVIEWED) {
    patch.flashcardReviews = Number(profile.flashcardReviews || 0) + 1;
    patch.latestFlashcardScore = event.score;
  }

  await safeSetDoc("adaptive_profiles", event.actor.userId, patch, true);
}

/**
 * Fluxo completo: persistir evento canónico → XP → memória → progresso.
 * Reexecuções com a mesma atividade são no-ops (idempotentes).
 */
export async function ingestLearningEvent(input: PublishLearningEventInput): Promise<{
  event: CanonicalLearningEvent;
  duplicated: boolean;
  xp: XpAwardResult;
}> {
  const { event, duplicated } = await publishLearningEvent(input);
  const xp = await awardXpForLearningEvent(event);

  if (!duplicated) {
    await projectEventIntoMemory(event);
    await projectEventIntoProgress(event);
    await safeAddDoc("learning_event_projections", {
      eventId: event.eventId,
      type: event.type,
      userId: event.actor.userId,
      tenantId: event.actor.tenantId,
      awardedXp: xp.awardedXp,
      projectedAt: new Date().toISOString(),
    });
  }

  return { event, duplicated, xp };
}
