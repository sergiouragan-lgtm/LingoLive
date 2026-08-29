import crypto from "crypto";
import { dbAdmin } from "../config/firebaseAdmin";
import { ENABLE_SANDBOX_FALLBACK } from "../config/env";
import { localMemoryDb } from "./firestoreSafe.service";
import { applyLearningEvent, LearningActivityEvent, normalizeLearningProgress } from "./learningProgress.service";
import { normalizeTutorMemory } from "./tutorMemory.service";

const volatileAllowed = ENABLE_SANDBOX_FALLBACK || process.env.NODE_ENV === "test" || process.env.VITEST === "true";
export class PracticeCompletionError extends Error { constructor(public code: string) { super(code); } }

type Completion = {
  sourceCollection: "pronunciation_results" | "flashcard_sessions";
  sourceId: string;
  event: LearningActivityEvent;
  score: number;
  xpAwarded: number;
  memoryPatch: (raw: unknown, now: string) => Record<string, unknown>;
  sourcePayload: Record<string, unknown>;
};

const digest = (value: unknown) => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const clamp = (value: unknown, min: number, max: number) => Math.min(max, Math.max(min, Number(value) || 0));

async function commitCompletion(uid: string, completion: Completion) {
  const eventId = completion.event.id;
  const { occurredAt: _occurredAt, ...stableEvent } = completion.event;
  const { timestamp: _timestamp, completedAt: _completedAt, ...stableSource } = completion.sourcePayload;
  const payloadDigest = digest({ event: stableEvent, source: stableSource });
  const auditId = digest(`${uid}|${eventId}`);
  const now = completion.event.occurredAt;

  if (dbAdmin && process.env.VITEST !== "true" && process.env.NODE_ENV !== "test") {
    const sourceRef = dbAdmin.collection(completion.sourceCollection).doc(completion.sourceId);
    const progressRef = dbAdmin.collection("learning_progress").doc(uid);
    const receiptRef = progressRef.collection("events").doc(eventId);
    const memoryRef = dbAdmin.collection("user_memory").doc(uid);
    const gameRef = dbAdmin.collection("user_gamification").doc(uid);
    const auditRef = dbAdmin.collection("xp_audit_logs").doc(auditId);
    return dbAdmin.runTransaction(async (tx: any) => {
      const [sourceSnap, progressSnap, receiptSnap, memorySnap, gameSnap, auditSnap] = await tx.getAll(sourceRef, progressRef, receiptRef, memoryRef, gameRef, auditRef);
      if (receiptSnap.exists) {
        if (receiptSnap.data()?.payloadDigest !== payloadDigest) throw new PracticeCompletionError("EVENT_ID_COLLISION");
        return { progress: normalizeLearningProgress(progressSnap.exists ? progressSnap.data() : null, uid), xpAwarded: 0, newTotalXp: Number(gameSnap.data()?.xp || 0), duplicate: true };
      }
      if (sourceSnap.exists && sourceSnap.data()?.userId !== uid) throw new PracticeCompletionError("FORBIDDEN");
      if (auditSnap.exists) throw new PracticeCompletionError("INTEGRITY_CONFLICT");
      const progress = applyLearningEvent(normalizeLearningProgress(progressSnap.exists ? progressSnap.data() : null, uid), completion.event);
      const previousXp = Number(gameSnap.exists ? gameSnap.data()?.xp || gameSnap.data()?.totalXp || 0 : 0);
      const newTotalXp = previousXp + completion.xpAwarded;
      tx.set(sourceRef, { ...completion.sourcePayload, userId: uid, status: "completed", completedAt: now, payloadDigest }, { merge: true });
      tx.set(progressRef, { ...progress, updatedAt: now }, { merge: false });
      tx.create(receiptRef, { userId: uid, eventId, payloadDigest, type: completion.event.type, occurredAt: now, createdAt: now });
      tx.set(memoryRef, completion.memoryPatch(memorySnap.exists ? memorySnap.data() : null, now), { merge: true });
      tx.set(gameRef, { userId: uid, xp: newTotalXp, totalXp: newTotalXp, level: Math.floor(newTotalXp / 500) + 1, updatedAt: now }, { merge: true });
      tx.create(auditRef, { auditId, eventId, eventType: completion.event.type, userId: uid, awardedXp: completion.xpAwarded, previousXp, newTotalXp, createdAt: now });
      return { progress, xpAwarded: completion.xpAwarded, newTotalXp, duplicate: false };
    });
  }
  if (!volatileAllowed) throw new PracticeCompletionError("STORAGE_UNAVAILABLE");
  const receiptKey = `learning_progress_${uid}_events_${eventId}`;
  const stored = localMemoryDb.get(receiptKey);
  if (stored) {
    if (stored.payloadDigest !== payloadDigest) throw new PracticeCompletionError("EVENT_ID_COLLISION");
    return { progress: normalizeLearningProgress(localMemoryDb.get(`learning_progress_${uid}`), uid), xpAwarded: 0, newTotalXp: Number(localMemoryDb.get(`user_gamification_${uid}`)?.xp || 0), duplicate: true };
  }
  const progress = applyLearningEvent(normalizeLearningProgress(localMemoryDb.get(`learning_progress_${uid}`), uid), completion.event);
  const previousXp = Number(localMemoryDb.get(`user_gamification_${uid}`)?.xp || 0); const newTotalXp = previousXp + completion.xpAwarded;
  localMemoryDb.set(`${completion.sourceCollection}_${completion.sourceId}`, { ...completion.sourcePayload, userId: uid, status: "completed", completedAt: now, payloadDigest });
  localMemoryDb.set(`learning_progress_${uid}`, progress); localMemoryDb.set(receiptKey, { payloadDigest });
  localMemoryDb.set(`user_memory_${uid}`, completion.memoryPatch(localMemoryDb.get(`user_memory_${uid}`), now));
  localMemoryDb.set(`user_gamification_${uid}`, { userId: uid, xp: newTotalXp, totalXp: newTotalXp, level: Math.floor(newTotalXp / 500) + 1 });
  localMemoryDb.set(`xp_audit_logs_${auditId}`, { auditId, eventId, userId: uid, awardedXp: completion.xpAwarded });
  return { progress, xpAwarded: completion.xpAwarded, newTotalXp, duplicate: false };
}

export function completePronunciation(uid: string, attemptId: string, evaluation: Record<string, unknown>, language: string, durationMinutes: unknown) {
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(attemptId)) throw new PracticeCompletionError("INVALID_ID");
  const score = Math.round(clamp(evaluation.overallScore, 0, 100)); const now = new Date().toISOString();
  const weakPhonemes = Array.isArray(evaluation.phonemeAnalysis) ? evaluation.phonemeAnalysis.filter((p: any) => Number(p?.accuracy) < 70).map((p: any) => String(p?.ipaSymbol || p?.phoneme || "").slice(0, 40)).filter(Boolean).slice(0, 8) : [];
  const xpAwarded = Math.max(5, Math.min(30, Math.round(score / 5)));
  return commitCompletion(uid, {
    sourceCollection: "pronunciation_results", sourceId: attemptId, score, xpAwarded,
    event: { id: `pronunciation_${attemptId}`, type: "pronunciation", language: String(language || "unknown").slice(0, 30), occurredAt: now, durationMinutes: clamp(durationMinutes, 0.1, 120), score, skills: ["speaking", "listening"] },
    sourcePayload: { ...evaluation, id: attemptId, targetText: String(evaluation.targetText || "").slice(0, 1000), timestamp: now, overallScore: score },
    memoryPatch: (raw, timestamp) => { const memory = normalizeTutorMemory(raw, uid) as any; return { ...memory, pronunciationErrors: [...new Set([...(memory.pronunciationErrors || []), ...weakPhonemes])].slice(-12), recentPronunciationEvidence: weakPhonemes.slice(0, 6), lastPronunciationAt: timestamp }; },
  });
}

export async function getCompletedPronunciation(uid: string, attemptId: string) {
  if (dbAdmin && process.env.VITEST !== "true" && process.env.NODE_ENV !== "test") {
    const snapshot = await dbAdmin.collection("pronunciation_results").doc(attemptId).get();
    const data = snapshot.exists ? snapshot.data() : null;
    return data?.userId === uid && data?.status === "completed" ? data : null;
  }
  const data = localMemoryDb.get(`pronunciation_results_${attemptId}`);
  return data?.userId === uid && data?.status === "completed" ? data : null;
}

export function completeFlashcardSession(uid: string, sessionId: string, raw: any) {
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(sessionId)) throw new PracticeCompletionError("INVALID_ID");
  const ratings = Array.isArray(raw?.ratings) ? raw.ratings.slice(0, 100).map((item: any) => ({ cardId: String(item?.cardId || "").slice(0, 100), word: String(item?.word || "").trim().slice(0, 80), rating: item?.rating === "known" ? "known" : "learning" })).filter((item: any) => item.cardId && item.word) : [];
  if (!ratings.length) throw new PracticeCompletionError("INVALID_RATINGS");
  const known = ratings.filter((item: any) => item.rating === "known"); const review = ratings.filter((item: any) => item.rating === "learning");
  const score = Math.round(known.length / ratings.length * 100); const now = new Date().toISOString(); const xpAwarded = Math.max(5, Math.min(25, known.length * 2 + review.length));
  return commitCompletion(uid, {
    sourceCollection: "flashcard_sessions", sourceId: sessionId, score, xpAwarded,
    event: { id: `flashcard_${sessionId}`, type: "vocabulary", language: String(raw?.language || "unknown").slice(0, 30), occurredAt: now, durationMinutes: clamp(raw?.durationMinutes, 0.1, 120), score, skills: ["vocabulary", "reading"] },
    sourcePayload: { sessionId, ratings, score, cardCount: ratings.length, knownCount: known.length },
    memoryPatch: (memoryRaw, timestamp) => { const memory = normalizeTutorMemory(memoryRaw, uid) as any; return { ...memory, vocabularyMastered: [...new Set([...memory.vocabularyMastered, ...known.map((item: any) => item.word)])].slice(-50), vocabularyNeedsReview: [...new Set(review.map((item: any) => item.word))].slice(-50), flashcardsReviewed: Number(memory.flashcardsReviewed || 0) + ratings.length, recentFlashcardEvidence: ratings.slice(-12), lastFlashcardAt: timestamp }; },
  });
}
