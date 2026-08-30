import { createHash } from "crypto";
import { dbAdmin } from "../config/firebaseAdmin";
import { localMemoryDb } from "./firestoreSafe.service";
import { applyLearningEvent, LearningActivityEvent, LearningProgress, normalizeLearningProgress } from "./learningProgress.service";

const allowVolatileStorage = process.env.NODE_ENV === "test" || process.env.VITEST === "true";

export class LearningStorageUnavailableError extends Error {}
export class LearningEventCollisionError extends Error {}

const digestEvent = (event: LearningActivityEvent) =>
  createHash("sha256").update(JSON.stringify(event)).digest("hex");

const progressKey = (userId: string) => `learning_progress_${userId}`;
const receiptKey = (userId: string, eventId: string) => `learning_progress_${userId}_events_${eventId}`;

export async function getLearningProgress(userId: string): Promise<LearningProgress> {
  if (dbAdmin && process.env.VITEST !== "true" && process.env.NODE_ENV !== "test") {
    const snapshot = await dbAdmin.collection("learning_progress").doc(userId).get();
    return normalizeLearningProgress(snapshot.exists ? snapshot.data() : null, userId);
  }
  if (!allowVolatileStorage) throw new LearningStorageUnavailableError("Firestore indisponível.");
  return normalizeLearningProgress(localMemoryDb.get(progressKey(userId)), userId);
}

export async function recordLearningEvent(userId: string, event: LearningActivityEvent) {
  const digest = digestEvent(event);
  if (dbAdmin && process.env.VITEST !== "true" && process.env.NODE_ENV !== "test") {
    return dbAdmin.runTransaction(async (transaction: any) => {
      const progressRef = dbAdmin.collection("learning_progress").doc(userId);
      const receiptRef = progressRef.collection("events").doc(event.id);
      const [progressSnapshot, receiptSnapshot] = await transaction.getAll(progressRef, receiptRef);
      const current = normalizeLearningProgress(progressSnapshot.exists ? progressSnapshot.data() : null, userId);
      if (receiptSnapshot.exists) {
        if (receiptSnapshot.data()?.payloadDigest !== digest) throw new LearningEventCollisionError("EVENT_ID_COLLISION");
        return { progress: current, duplicate: true };
      }
      const progress = applyLearningEvent(current, event);
      transaction.set(progressRef, { ...progress, updatedAt: new Date().toISOString() }, { merge: false });
      transaction.create(receiptRef, {
        userId,
        eventId: event.id,
        payloadDigest: digest,
        type: event.type,
        occurredAt: event.occurredAt,
        createdAt: new Date().toISOString(),
      });
      return { progress, duplicate: false };
    });
  }
  if (!allowVolatileStorage) throw new LearningStorageUnavailableError("Firestore indisponível.");
  const storedReceipt = localMemoryDb.get(receiptKey(userId, event.id));
  const current = normalizeLearningProgress(localMemoryDb.get(progressKey(userId)), userId);
  if (storedReceipt) {
    if (storedReceipt.payloadDigest !== digest) throw new LearningEventCollisionError("EVENT_ID_COLLISION");
    return { progress: current, duplicate: true };
  }
  const progress = applyLearningEvent(current, event);
  localMemoryDb.set(progressKey(userId), progress);
  localMemoryDb.set(receiptKey(userId, event.id), { payloadDigest: digest });
  return { progress, duplicate: false };
}
