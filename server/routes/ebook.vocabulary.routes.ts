import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import {
  getOrGenerateDeck,
  getStudentProgress,
  submitReviews,
  getDueCards,
} from "../services/ebook/EbookVocabularyService";

const router = Router();

// ── Get (or generate) vocab deck for an ebook ──────────────────────────────────
router.get("/deck/:ebookId", requireAuth, async (req, res) => {
  try {
    const deck = await getOrGenerateDeck(req.params.ebookId);
    if (!deck) return res.status(404).json({ error: "E-book não encontrado." });
    res.json(deck);
  } catch {
    res.status(500).json({ error: "Erro ao obter vocabulário." });
  }
});

// ── Student: get my flashcard progress for an ebook ───────────────────────────
router.get("/progress/:ebookId", requireAuth, async (req: any, res) => {
  try {
    const studentId = req.user.uid;
    const progress = await getStudentProgress(studentId, req.params.ebookId);
    res.json(progress);
  } catch {
    res.status(500).json({ error: "Erro ao obter progresso." });
  }
});

// ── Student: get due cards for review ─────────────────────────────────────────
router.get("/due/:ebookId", requireAuth, async (req: any, res) => {
  try {
    const studentId = req.user.uid;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const data = await getDueCards(studentId, req.params.ebookId, limit);
    res.json(data);
  } catch {
    res.status(500).json({ error: "Erro ao obter cartões." });
  }
});

// ── Student: submit review results ────────────────────────────────────────────
router.post("/review/:ebookId", requireAuth, async (req: any, res) => {
  try {
    const studentId = req.user.uid;
    const { results } = req.body;
    if (!Array.isArray(results)) {
      return res.status(400).json({ error: "results deve ser um array." });
    }
    const updated = await submitReviews(studentId, req.params.ebookId, results);
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Erro ao guardar revisão." });
  }
});

export default router;
