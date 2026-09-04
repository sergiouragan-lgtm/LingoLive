import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import {
  getRecommendations,
  getSimilarEbooks,
} from "../services/ebook/EbookRecommendationService";

const router = Router();

// ── Personalised recommendations for authenticated student ────────────────────
router.get("/", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  const limit = Math.min(parseInt((req.query.limit as string) || "6", 10), 12);

  try {
    const recommendations = await getRecommendations(userId, limit);
    return res.json({ success: true, recommendations });
  } catch (err: any) {
    console.error("[ebook-recommendations] error:", err.message);
    return res.status(500).json({ error: "Falha ao gerar recomendações" });
  }
});

// ── Similar ebooks to a given ebook ──────────────────────────────────────────
router.get("/similar/:ebookId", requireAuth, async (req, res) => {
  const limit = Math.min(parseInt((req.query.limit as string) || "4", 10), 8);

  try {
    const similar = await getSimilarEbooks(req.params.ebookId, limit);
    return res.json({ success: true, similar });
  } catch (err: any) {
    console.error("[ebook-recommendations] similar error:", err.message);
    return res.status(500).json({ error: "Falha ao carregar e-books similares" });
  }
});

export default router;
