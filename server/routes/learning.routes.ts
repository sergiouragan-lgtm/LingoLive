import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { safeGetDoc, safeSetDoc } from "../services/firestoreSafe.service";
import { applyLearningEvent, normalizeLearningEvent, normalizeLearningProgress } from "../services/learningProgress.service";

const router = Router();

router.get("/progress", requireAuth, async (req: any, res) => {
  try {
    const doc = await safeGetDoc("learning_progress", req.user.uid);
    res.json({ progress: normalizeLearningProgress(doc.exists ? doc.data() : null, req.user.uid) });
  } catch (error) {
    console.error("Failed to load learning progress:", error);
    res.status(500).json({ error: "Não foi possível carregar o progresso." });
  }
});

router.post("/events", requireAuth, async (req: any, res) => {
  const event = normalizeLearningEvent(req.body);
  if (!event) return res.status(400).json({ error: "Evento de aprendizagem inválido." });

  try {
    const doc = await safeGetDoc("learning_progress", req.user.uid);
    const current = normalizeLearningProgress(doc.exists ? doc.data() : null, req.user.uid);
    const progress = applyLearningEvent(current, event);
    if (progress !== current) {
      await safeSetDoc("learning_progress", req.user.uid, { ...progress, updatedAt: new Date().toISOString() });
    }
    res.status(progress === current ? 200 : 201).json({ progress, duplicate: progress === current });
  } catch (error) {
    console.error("Failed to record learning event:", error);
    res.status(500).json({ error: "Não foi possível registar a atividade." });
  }
});

export default router;
