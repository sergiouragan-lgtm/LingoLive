import { Router } from "express";
import { dbAdmin } from "../config/firebaseAdmin";
import { requireAuth } from "../middleware/requireAuth";
import { recordLearningEvent } from "../services/learningEvent.service";
import type { LearningEventV1 } from "../domain/learning/learningEvent";

const router = Router();

async function canonicalTenantId(user: any): Promise<string> {
  const account = await dbAdmin.collection("users").doc(user.uid).get();
  return String(user.tenantId || (account.exists ? account.data()?.tenantId : "") || `individual:${user.uid}`);
}

router.post("/events", requireAuth, async (req: any, res) => {
  const event = req.body as LearningEventV1;
  if (!event || event.studentId !== req.user.uid) return res.status(403).json({ error: "STUDENT_ID_MISMATCH" });
  if (!dbAdmin) return res.status(503).json({ error: "FIRESTORE_UNAVAILABLE" });
  try {
    const tenantId = await canonicalTenantId(req.user);
    if (event.tenantId !== tenantId) return res.status(403).json({ error: "TENANT_ID_MISMATCH" });
    const result = await recordLearningEvent(event);
    return res.status(result.duplicate ? 200 : 201).json(result);
  } catch (error: any) {
    if (error?.code === "INVALID_LEARNING_EVENT") return res.status(400).json({ error: error.code, details: error.message.split(", ") });
    console.error("[LearningEvent] Failed to persist canonical event", error?.message);
    return res.status(500).json({ error: "LEARNING_EVENT_PERSISTENCE_FAILED" });
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
