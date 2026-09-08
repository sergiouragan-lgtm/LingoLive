import { dbAdmin } from "../config/firebaseAdmin";
import { projectLearningGap, stableDocumentId, validateLearningEvent, type LearningEventV1, type LearningGapProjection } from "../domain/learning/learningEvent";

export async function recordLearningEvent(event: LearningEventV1) {
  const errors = validateLearningEvent(event);
  if (errors.length) throw Object.assign(new Error(errors.join(", ")), { code: "INVALID_LEARNING_EVENT" });
  if (!dbAdmin) throw Object.assign(new Error("Firestore is unavailable"), { code: "FIRESTORE_UNAVAILABLE" });

  const eventId = stableDocumentId(event.tenantId, event.idempotencyKey);
  const gapId = stableDocumentId(event.tenantId, event.studentId, event.languageCode, event.target.type, event.target.key);
  const eventRef = dbAdmin.collection("learning_events").doc(eventId);
  const gapRef = dbAdmin.collection("student_learning_gaps").doc(gapId);

  return dbAdmin.runTransaction(async (transaction: any) => {
    const [existingEvent, existingGap] = await Promise.all([transaction.get(eventRef), transaction.get(gapRef)]);
    if (existingEvent.exists) return { duplicate: true, eventId, gapId, gap: existingGap.exists ? existingGap.data() : null };
    transaction.create(eventRef, { ...event, occurredAt: new Date(event.occurredAt), receivedAt: new Date() });

    // A successful first attempt is useful evidence, but it must not invent a
    // learning gap. Reassessments only reduce a gap that already exists.
    if (event.result.outcome === "correct" && !existingGap.exists) {
      return { duplicate: false, eventId, gapId, gap: null };
    }

    const gap = projectLearningGap(event, existingGap.exists ? existingGap.data() as LearningGapProjection : undefined);
    transaction.set(gapRef, gap);

    if (event.result.outcome === "incorrect") {
      const recommendationRef = dbAdmin.collection("learning_recommendations").doc(stableDocumentId(gapId, "recommendation"));
      const activityRef = dbAdmin.collection("corrective_activities").doc(stableDocumentId(gapId, "activity"));
      transaction.set(recommendationRef, { tenantId: event.tenantId, studentId: event.studentId, gapId, languageCode: event.languageCode, cefrLevel: event.cefrLevel, target: event.target, status: "active", sourceEventId: eventId, updatedAt: new Date() }, { merge: true });
      transaction.set(activityRef, { tenantId: event.tenantId, studentId: event.studentId, gapId, activityType: "adaptive_practice", target: event.target, status: "pending", sourceEventId: eventId, updatedAt: new Date() }, { merge: true });
    } else {
      const recommendationRef = dbAdmin.collection("learning_recommendations").doc(stableDocumentId(gapId, "recommendation"));
      const activityRef = dbAdmin.collection("corrective_activities").doc(stableDocumentId(gapId, "activity"));
      const remediationStatus = gap.status === "mastered" ? "completed" : "in_progress";
      transaction.set(recommendationRef, { status: remediationStatus, sourceEventId: eventId, updatedAt: new Date() }, { merge: true });
      transaction.set(activityRef, { status: remediationStatus, sourceEventId: eventId, updatedAt: new Date() }, { merge: true });
    }
    return { duplicate: false, eventId, gapId, gap };
  });
}
