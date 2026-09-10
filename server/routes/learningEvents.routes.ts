import { Router } from "express";
import { dbAdmin } from "../config/firebaseAdmin";
import { requireAuth } from "../middleware/requireAuth";
import { recordRawLearningAttempt } from "../services/learningEvent.service";
import type { RawLearningAttempt } from "../domain/learning/gapEngine";

const router = Router();

async function canonicalTenantId(user: any): Promise<string> {
  const account = await dbAdmin.collection("users").doc(user.uid).get();
  return String(user.tenantId || (account.exists ? account.data()?.tenantId : "") || `individual:${user.uid}`);
}

router.post("/attempts", requireAuth, async (req: any, res) => {
  const attempt = req.body as RawLearningAttempt;
  if (!attempt || attempt.studentId !== req.user.uid) return res.status(403).json({ error: "STUDENT_ID_MISMATCH" });
  if (!dbAdmin) return res.status(503).json({ error: "FIRESTORE_UNAVAILABLE" });
  try {
    const tenantId = await canonicalTenantId(req.user);
    if (attempt.tenantId !== tenantId) return res.status(403).json({ error: "TENANT_ID_MISMATCH" });
    const result = await recordRawLearningAttempt(attempt);
    return res.status(result.duplicate ? 200 : 201).json(result);
  } catch (error: any) {
    if (["INVALID_LEARNING_ATTEMPT", "INVALID_ACTIVITY_DEFINITION"].includes(error?.code)) return res.status(400).json({ error: error.code, details: error.message.split(", ") });
    if (error?.code === "ACTIVITY_DEFINITION_NOT_FOUND") return res.status(404).json({ error: error.code });
    console.error("[GapEngine] Failed to classify learning attempt", error?.message);
    return res.status(500).json({ error: "LEARNING_ATTEMPT_CLASSIFICATION_FAILED" });
  }
});

router.get("/history", requireAuth, async (req: any, res) => {
  if (!dbAdmin) return res.status(503).json({ error: "FIRESTORE_UNAVAILABLE" });
  try {
    const tenantId = await canonicalTenantId(req.user);
    const snapshot = await dbAdmin.collection("learning_events").where("tenantId", "==", tenantId).where("studentId", "==", req.user.uid).orderBy("occurredAt", "desc").limit(50).get();
    return res.json({ tenantId, events: snapshot.docs.map((document: any) => ({ id: document.id, ...document.data() })) });
  } catch (error: any) {
    console.error("[GapEngine] Failed to load learning history", error?.message);
    return res.status(500).json({ error: "LEARNING_HISTORY_READ_FAILED" });
  }
});

router.get("/state", requireAuth, async (req: any, res) => {
  if (!dbAdmin) return res.status(503).json({ error: "FIRESTORE_UNAVAILABLE" });
  try {
    const tenantId = await canonicalTenantId(req.user);
    const [gapSnapshot, recommendationSnapshot] = await Promise.all([
      dbAdmin.collection("student_learning_gaps").where("tenantId", "==", tenantId).where("studentId", "==", req.user.uid).where("status", "in", ["active", "remediating"]).orderBy("weaknessScore", "desc").limit(10).get(),
      dbAdmin.collection("learning_recommendations").where("tenantId", "==", tenantId).where("studentId", "==", req.user.uid).where("status", "in", ["active", "in_progress"]).orderBy("updatedAt", "desc").limit(10).get(),
    ]);
    return res.json({
      tenantId,
      gaps: gapSnapshot.docs.map((document: any) => ({ id: document.id, ...document.data() })),
      recommendations: recommendationSnapshot.docs.map((document: any) => ({ id: document.id, ...document.data() })),
    });
  } catch (error: any) {
    console.error("[LearningEvent] Failed to load personalization state", error?.message);
    return res.status(500).json({ error: "LEARNING_STATE_READ_FAILED" });
  }
});

export default router;
