import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import {
  getStudentGamification,
  recordChapterRead,
  getLeaderboard,
} from "../services/ebook/EbookGamificationService";

const router = Router();

router.get("/me", requireAuth, async (req, res) => {
  try {
    const studentId = (req as any).user.uid;
    const data = await getStudentGamification(studentId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Erro ao obter dados de gamificação." });
  }
});

router.get("/student/:studentId", requireAuth, async (req, res) => {
  try {
    const data = await getStudentGamification(req.params.studentId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Erro ao obter dados de gamificação." });
  }
});

router.post("/chapter-read", requireAuth, async (req, res) => {
  try {
    const studentId = (req as any).user.uid;
    const { ebookId, completionPercent } = req.body;
    if (!ebookId || completionPercent === undefined) {
      return res.status(400).json({ error: "ebookId e completionPercent são obrigatórios." });
    }
    const updated = await recordChapterRead(studentId, ebookId, Number(completionPercent));
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Erro ao registar progresso." });
  }
});

router.get("/leaderboard", requireAuth, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const entries = await getLeaderboard(limit);
    res.json({ entries });
  } catch (err) {
    res.status(500).json({ error: "Erro ao obter leaderboard." });
  }
});

export default router;
