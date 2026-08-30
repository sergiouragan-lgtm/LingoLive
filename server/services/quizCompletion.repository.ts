import crypto from "crypto";
import { dbAdmin } from "../config/firebaseAdmin";
import { localMemoryDb } from "./firestoreSafe.service";
import { applyLearningEvent, LearningActivityEvent, normalizeLearningProgress } from "./learningProgress.service";
import { isQuizSessionExpired } from "./adaptiveQuiz.service";
import { normalizeTutorMemory } from "./tutorMemory.service";

const volatileAllowed = process.env.NODE_ENV === "test" || process.env.VITEST === "true";
export class QuizCompletionError extends Error { constructor(public code: string) { super(code); } }

const calculate = (sessionId: string, data: any, answers: number[], durationMinutes: number, now: string) => {
  if (answers.length !== data.questions.length || answers.some(answer => !Number.isInteger(answer) || answer < 0 || answer > 3)) throw new QuizCompletionError("INVALID_ANSWERS");
  const results = data.questions.map((question: any, index: number) => ({ questionId: question.id, correct: answers[index] === question.correctAnswerIndex, correctAnswerIndex: question.correctAnswerIndex, explanation: question.explanation, skill: question.skill, difficulty: question.difficulty }));
  const correctAnswers = results.filter((result: any) => result.correct).length;
  const score = Math.round(correctAnswers / results.length * 100);
  const result = { score, correctAnswers, totalQuestions: results.length, results, xpAwarded: 100 };
  const event: LearningActivityEvent = { id: `quiz_${sessionId}`, type: "quiz", language: data.language, occurredAt: now, durationMinutes, score, skills: [...new Set(data.questions.map((question: any) => question.skill))] as any };
  return { result, event };
};

const memoryPatch = (raw: any, uid: string, results: any[], now: string) => {
  const memory = normalizeTutorMemory(raw, uid);
  if (!memory.enabled) return memory;
  const weak = [...new Set(results.filter(result => !result.correct).map(result => `${result.skill} ${result.difficulty}`))].slice(0, 6);
  const grammar = weak.filter(item => item.startsWith("grammar ")).map(item => `Reforçar ${item}`);
  return { ...memory, grammarWeaknesses: [...new Set([...memory.grammarWeaknesses, ...grammar])].slice(-12), recentQuizEvidence: weak, lastQuizAt: now };
};

export async function completeQuiz(uid: string, sessionId: string, answers: number[], rawDuration: unknown) {
  const durationMinutes = Math.max(0.1, Math.min(120, Number(rawDuration) || 0.1));
  const auditId = crypto.createHash("sha256").update(`${uid}|quiz_attempt|${sessionId}`).digest("hex");
  if (dbAdmin && process.env.VITEST !== "true" && process.env.NODE_ENV !== "test") {
    const sessionRef = dbAdmin.collection("quiz_sessions").doc(sessionId); const progressRef = dbAdmin.collection("learning_progress").doc(uid);
    const receiptRef = progressRef.collection("events").doc(`quiz_${sessionId}`); const memoryRef = dbAdmin.collection("user_memory").doc(uid);
    const gamificationRef = dbAdmin.collection("user_gamification").doc(uid); const auditRef = dbAdmin.collection("xp_audit_logs").doc(auditId);
    return dbAdmin.runTransaction(async (tx: any) => {
      const [sessionSnap, progressSnap, receiptSnap, memorySnap, gameSnap, auditSnap] = await tx.getAll(sessionRef, progressRef, receiptRef, memoryRef, gamificationRef, auditRef);
      if (!sessionSnap.exists || sessionSnap.data().userId !== uid) throw new QuizCompletionError("NOT_FOUND");
      const session = sessionSnap.data(); if (session.status === "completed" && session.result) return { ...session.result, duplicated: true };
      if (session.status !== "active") throw new QuizCompletionError("UNAVAILABLE"); if (isQuizSessionExpired(session.expiresAt)) throw new QuizCompletionError("EXPIRED");
      const now = new Date().toISOString(); const { result, event } = calculate(sessionId, session, answers, durationMinutes, now);
      if (receiptSnap.exists || auditSnap.exists) throw new QuizCompletionError("INTEGRITY_CONFLICT");
      const progress = applyLearningEvent(normalizeLearningProgress(progressSnap.exists ? progressSnap.data() : null, uid), event);
      const previousXp = gameSnap.exists ? Number(gameSnap.data().xp || gameSnap.data().totalXp || 0) : 0; const newTotalXp = previousXp + result.xpAwarded;
      tx.set(sessionRef, { status: "completed", answers, score: result.score, result, completedAt: now }, { merge: true });
      tx.set(progressRef, { ...progress, updatedAt: now }, { merge: false });
      tx.create(receiptRef, { userId: uid, eventId: event.id, type: "quiz", score: result.score, createdAt: now });
      tx.set(memoryRef, memoryPatch(memorySnap.exists ? memorySnap.data() : null, uid, result.results, now), { merge: true });
      tx.set(gamificationRef, { userId: uid, xp: newTotalXp, totalXp: newTotalXp, level: Math.floor(newTotalXp / 500) + 1, updatedAt: now }, { merge: true });
      tx.create(auditRef, { auditId, eventId: sessionId, eventType: "quiz_attempt", userId: uid, awardedXp: result.xpAwarded, previousXp, newTotalXp, createdAt: now });
      return { ...result, newTotalXp, duplicated: false };
    });
  }
  if (!volatileAllowed) throw new QuizCompletionError("STORAGE_UNAVAILABLE");
  const sessionKey = `quiz_sessions_${sessionId}`; const session = localMemoryDb.get(sessionKey);
  if (!session || session.userId !== uid) throw new QuizCompletionError("NOT_FOUND"); if (session.status === "completed" && session.result) return { ...session.result, duplicated: true };
  if (isQuizSessionExpired(session.expiresAt)) throw new QuizCompletionError("EXPIRED");
  const now = new Date().toISOString(); const { result, event } = calculate(sessionId, session, answers, durationMinutes, now);
  const progress = applyLearningEvent(normalizeLearningProgress(localMemoryDb.get(`learning_progress_${uid}`), uid), event); const gameKey = `user_gamification_${uid}`; const game = localMemoryDb.get(gameKey) || {}; const previousXp = Number(game.xp || game.totalXp || 0); const newTotalXp = previousXp + 100;
  localMemoryDb.set(sessionKey, { ...session, status: "completed", answers, result, completedAt: now }); localMemoryDb.set(`learning_progress_${uid}`, progress); localMemoryDb.set(`learning_progress_${uid}_events_${event.id}`, { userId: uid, eventId: event.id }); localMemoryDb.set(`user_memory_${uid}`, memoryPatch(localMemoryDb.get(`user_memory_${uid}`), uid, result.results, now)); localMemoryDb.set(gameKey, { ...game, userId: uid, xp: newTotalXp, totalXp: newTotalXp, level: Math.floor(newTotalXp / 500) + 1 }); localMemoryDb.set(`xp_audit_logs_${auditId}`, { auditId, userId: uid, awardedXp: 100 });
  return { ...result, newTotalXp, duplicated: false };
}
