import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import {
  enrollStudent,
  getEnrollment,
  markChapterRead,
  updateStudentCefrLevel,
  getAdaptedContent,
  getStudentLibrary,
  computeCompletionPercent,
} from "../services/ebook/AdaptiveLearningService";
import { safeGetDoc } from "../services/firestoreSafe.service";

const router = Router();

// ── Enroll student in an ebook (free or post-purchase) ────────────────────────
router.post("/enroll", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  const { ebookId, cefrLevel } = req.body;
  if (!ebookId) return res.status(400).json({ error: "ebookId é obrigatório" });

  try {
    const enrollment = await enrollStudent(
      ebookId,
      userId,
      req.user?.email ?? "",
      cefrLevel ?? null
    );
    return res.json({ success: true, enrollment });
  } catch (err: any) {
    console.error("[ebook-student] enroll error:", err.message);
    return res.status(500).json({ error: "Falha ao inscrever estudante" });
  }
});

// ── Get student progress for one ebook ───────────────────────────────────────
router.get("/progress/:ebookId", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  const { ebookId } = req.params;

  try {
    const enrollment = await getEnrollment(ebookId, userId);
    if (!enrollment) {
      return res.status(404).json({ error: "Inscrição não encontrada" });
    }

    // Load ebook to compute total chapters
    const doc = await safeGetDoc("ebooks", ebookId);
    const totalChapters = doc.exists ? (doc.data() as any)?.chapters?.length ?? 0 : 0;
    const completionPercent = computeCompletionPercent(enrollment, totalChapters);

    return res.json({ success: true, enrollment, completionPercent, totalChapters });
  } catch (err: any) {
    console.error("[ebook-student] progress error:", err.message);
    return res.status(500).json({ error: "Falha ao carregar progresso" });
  }
});

// ── Mark chapter as read ──────────────────────────────────────────────────────
router.post("/progress/:ebookId", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  const { ebookId } = req.params;
  const { chapterId, exercisesCompleted, exercisesTotal } = req.body;

  if (!chapterId) return res.status(400).json({ error: "chapterId é obrigatório" });

  try {
    await markChapterRead(ebookId, userId, chapterId, {
      completed: exercisesCompleted ?? 0,
      total: exercisesTotal ?? 0,
    });
    return res.json({ success: true });
  } catch (err: any) {
    console.error("[ebook-student] mark-read error:", err.message);
    return res.status(500).json({ error: "Falha ao registar progresso" });
  }
});

// ── Update student's CEFR level preference ───────────────────────────────────
router.patch("/cefr-level", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  const { ebookId, cefrLevel } = req.body;
  const validLevels = ["A1", "A2", "B1", "B2", "C1", "C2"];
  if (!ebookId || !cefrLevel || !validLevels.includes(cefrLevel)) {
    return res.status(400).json({ error: "ebookId e cefrLevel válido são obrigatórios" });
  }

  try {
    await updateStudentCefrLevel(ebookId, userId, cefrLevel);
    return res.json({ success: true });
  } catch (err: any) {
    console.error("[ebook-student] cefr-level error:", err.message);
    return res.status(500).json({ error: "Falha ao actualizar nível CEFR" });
  }
});

// ── Get adapted content for a chapter/block ──────────────────────────────────
router.post("/adaptive-content", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  const { ebookId, chapterId, blockId, originalText, targetLevel, language } = req.body;

  if (!ebookId || !chapterId || !originalText || !targetLevel || !language) {
    return res.status(400).json({ error: "ebookId, chapterId, originalText, targetLevel e language são obrigatórios" });
  }

  const validLevels = ["A1", "A2", "B1", "B2", "C1", "C2"];
  if (!validLevels.includes(targetLevel)) {
    return res.status(400).json({ error: "targetLevel inválido" });
  }

  // Verify enrollment before serving adapted content
  const enrollment = await getEnrollment(ebookId, userId);
  if (!enrollment) {
    return res.status(403).json({ error: "Acesso negado — inscreva-se primeiro" });
  }

  try {
    const adaptedText = await getAdaptedContent(
      ebookId,
      chapterId,
      blockId ?? null,
      originalText,
      targetLevel,
      language
    );
    return res.json({ success: true, adaptedText, cached: true });
  } catch (err: any) {
    console.error("[ebook-student] adaptive-content error:", err.message);
    return res.status(500).json({ error: "Falha ao adaptar conteúdo" });
  }
});

// ── Student library (all enrolled ebooks) ────────────────────────────────────
router.get("/library", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  try {
    const enrollments = await getStudentLibrary(userId);

    // Enrich with ebook metadata
    const enriched = await Promise.all(
      enrollments.map(async (enr) => {
        const doc = await safeGetDoc("ebooks", enr.ebookId);
        const ebookData = doc.exists ? (doc.data() as any) : {};
        const totalChapters = ebookData.chapters?.length ?? 0;
        return {
          ...enr,
          ebookTitle: ebookData.title ?? "E-book",
          ebookSubtitle: ebookData.subtitle,
          ebookLanguage: ebookData.language,
          ebookCefrLevel: ebookData.cefrLevel,
          ebookCoverColor: ebookData.coverColor,
          totalChapters,
          completionPercent: computeCompletionPercent(enr, totalChapters),
        };
      })
    );

    return res.json({ success: true, library: enriched });
  } catch (err: any) {
    console.error("[ebook-student] library error:", err.message);
    return res.status(500).json({ error: "Falha ao carregar biblioteca" });
  }
});

export default router;
