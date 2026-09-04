import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import {
  createOrUpdateReview,
  getUserReview,
  listReviews,
  getRatingAggregate,
  deleteReview,
  markHelpful,
} from "../services/ebook/EbookReviewService";

const router = Router();

// ── List reviews for an ebook ─────────────────────────────────────────────────
router.get("/:ebookId", requireAuth, async (req: any, res) => {
  const { ebookId } = req.params;
  const limit = Math.min(Number(req.query.limit ?? 20), 100);

  try {
    const [reviews, aggregate] = await Promise.all([
      listReviews(ebookId, limit),
      getRatingAggregate(ebookId),
    ]);
    return res.json({ success: true, reviews, aggregate });
  } catch (err: any) {
    console.error("[ebook-reviews] list error:", err.message);
    return res.status(500).json({ error: "Falha ao carregar avaliações" });
  }
});

// ── Get current user's review for an ebook ───────────────────────────────────
router.get("/:ebookId/mine", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  const { ebookId } = req.params;
  try {
    const review = await getUserReview(ebookId, userId);
    return res.json({ success: true, review });
  } catch (err: any) {
    console.error("[ebook-reviews] mine error:", err.message);
    return res.status(500).json({ error: "Falha ao carregar avaliação" });
  }
});

// ── Create or update a review ─────────────────────────────────────────────────
router.post("/:ebookId", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  const { ebookId } = req.params;
  const { rating, comment, cefrLevel } = req.body;

  if (!rating || !comment) {
    return res.status(400).json({ error: "rating e comment são obrigatórios" });
  }

  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: "rating deve ser um inteiro entre 1 e 5" });
  }

  const displayName =
    (req.user as any)?.displayName ?? (req.user as any)?.name ?? "Estudante";

  try {
    const review = await createOrUpdateReview(
      ebookId,
      userId,
      displayName,
      ratingNum,
      String(comment).substring(0, 2000),
      cefrLevel
    );
    return res.json({ success: true, review });
  } catch (err: any) {
    console.error("[ebook-reviews] create error:", err.message);
    return res.status(500).json({ error: "Falha ao guardar avaliação" });
  }
});

// ── Delete a review ───────────────────────────────────────────────────────────
router.delete("/:ebookId/:reviewId", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  const { reviewId } = req.params;
  const isAdmin = ["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(
    String((req.user as any)?.role ?? "").toUpperCase()
  );

  try {
    await deleteReview(reviewId, userId, isAdmin);
    return res.json({ success: true });
  } catch (err: any) {
    if (err.message === "Access denied") return res.status(403).json({ error: "Acesso negado" });
    if (err.message === "Review not found") return res.status(404).json({ error: "Avaliação não encontrada" });
    console.error("[ebook-reviews] delete error:", err.message);
    return res.status(500).json({ error: "Falha ao eliminar avaliação" });
  }
});

// ── Mark review as helpful ────────────────────────────────────────────────────
router.post("/:ebookId/:reviewId/helpful", requireAuth, async (req: any, res) => {
  const { reviewId } = req.params;
  try {
    await markHelpful(reviewId);
    return res.json({ success: true });
  } catch (err: any) {
    console.error("[ebook-reviews] helpful error:", err.message);
    return res.status(500).json({ error: "Falha ao registar" });
  }
});

export default router;
