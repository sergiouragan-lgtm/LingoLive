import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { normalizeLearningEvent } from "../services/learningProgress.service";
import { getLearningProgress, LearningEventCollisionError, LearningStorageUnavailableError, recordLearningEvent } from "../services/learningProgress.repository";
import { completeFlashcardSession, PracticeCompletionError } from "../services/canonicalPracticeCompletion.service";

const router = Router();

router.get("/progress", requireAuth, async (req: any, res) => {
  try {
    res.json({ progress: await getLearningProgress(req.user.uid) });
  } catch (error) {
    if (error instanceof LearningStorageUnavailableError) return res.status(503).json({ error: "Persistência de aprendizagem indisponível." });
    console.error("Failed to load learning progress:", error);
    res.status(500).json({ error: "Não foi possível carregar o progresso." });
  }
});

router.post("/events", requireAuth, async (req: any, res) => {
  const event = normalizeLearningEvent(req.body);
  if (!event) return res.status(400).json({ error: "Evento de aprendizagem inválido." });

  try {
    const result = await recordLearningEvent(req.user.uid, event);
    res.status(result.duplicate ? 200 : 201).json(result);
  } catch (error) {
    if (error instanceof LearningEventCollisionError) return res.status(409).json({ error: "O identificador do evento já pertence a outro conteúdo." });
    if (error instanceof LearningStorageUnavailableError) return res.status(503).json({ error: "Persistência de aprendizagem indisponível." });
    console.error("Failed to record learning event:", error);
    res.status(500).json({ error: "Não foi possível registar a atividade." });
  }
});

router.post("/flashcard-sessions/:sessionId/complete", requireAuth, async (req: any, res) => {
  try {
    const result = await completeFlashcardSession(req.user.uid, req.params.sessionId, req.body);
    res.status(result.duplicate ? 200 : 201).json(result);
  } catch (error) {
    if (error instanceof PracticeCompletionError) {
      const status = error.code === "EVENT_ID_COLLISION" || error.code === "INTEGRITY_CONFLICT" ? 409 : error.code === "STORAGE_UNAVAILABLE" ? 503 : 400;
      return res.status(status).json({ error: error.code });
    }
    console.error("Failed to complete flashcard session:", error);
    res.status(500).json({ error: "Não foi possível concluir a revisão." });
  }
});

export default router;
