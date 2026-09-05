import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/requireAuth";
import {
  getPlatformOverview,
  getEbookDetailStats,
  getStudentStats,
  getSchoolStats,
} from "../services/ebook/EbookAnalyticsService";

const router = Router();

const STUDENT_ROLES = new Set([
  "STUDENT", "Student", "LEARNER", "BUSINESS_USER",
  "student", "learner",
]);

function requireElevatedRole(req: any, res: Response, next: NextFunction) {
  const role: string | undefined = req.user?.role;
  if (role && STUDENT_ROLES.has(role)) {
    return res.status(403).json({ error: "Acesso reservado a administradores e professores" });
  }
  return next();
}

// ── Platform-wide overview (admin) ────────────────────────────────────────────
router.get("/overview", requireAuth, requireElevatedRole, async (_req, res) => {
  try {
    const stats = await getPlatformOverview();
    return res.json({ success: true, stats });
  } catch (err: any) {
    console.error("[ebook-analytics] overview error:", err.message);
    return res.status(500).json({ error: "Falha ao carregar visão geral" });
  }
});

// ── Per-ebook stats (instructor/admin) ────────────────────────────────────────
router.get("/ebook/:ebookId", requireAuth, requireElevatedRole, async (req, res) => {
  try {
    const stats = await getEbookDetailStats(req.params.ebookId);
    return res.json({ success: true, stats });
  } catch (err: any) {
    console.error("[ebook-analytics] ebook detail error:", err.message);
    return res.status(500).json({ error: "Falha ao carregar estatísticas do e-book" });
  }
});

// ── Per-student stats ─────────────────────────────────────────────────────────
router.get("/student/:studentId", requireAuth, requireElevatedRole, async (req, res) => {
  try {
    const stats = await getStudentStats(req.params.studentId);
    return res.json({ success: true, stats });
  } catch (err: any) {
    console.error("[ebook-analytics] student stats error:", err.message);
    return res.status(500).json({ error: "Falha ao carregar estatísticas do estudante" });
  }
});

// ── My own stats (student self-service) ───────────────────────────────────────
router.get("/me", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  try {
    const stats = await getStudentStats(userId);
    return res.json({ success: true, stats });
  } catch (err: any) {
    console.error("[ebook-analytics] me error:", err.message);
    return res.status(500).json({ error: "Falha ao carregar as suas estatísticas" });
  }
});

// ── Per-school stats ──────────────────────────────────────────────────────────
router.get("/school/:schoolId", requireAuth, requireElevatedRole, async (req, res) => {
  try {
    const stats = await getSchoolStats(req.params.schoolId);
    return res.json({ success: true, stats });
  } catch (err: any) {
    console.error("[ebook-analytics] school stats error:", err.message);
    return res.status(500).json({ error: "Falha ao carregar estatísticas da escola" });
  }
});

export default router;
