import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import {
  getPreferences,
  upsertPreferences,
  registerFcmToken,
  unregisterFcmToken,
  sendStudyReminder,
  sendMilestoneNotification,
  broadcastNewEbook,
} from "../services/ebook/EbookNotificationService";

const router = Router();

// ── Get notification preferences ─────────────────────────────────────────────
router.get("/preferences", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  try {
    const prefs = await getPreferences(userId);
    return res.json({ success: true, prefs });
  } catch (err: any) {
    console.error("[ebook-notifications] getPreferences error:", err.message);
    return res.status(500).json({ error: "Falha ao carregar preferências" });
  }
});

// ── Update notification preferences ──────────────────────────────────────────
router.put("/preferences", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  const { studyReminders, reminderHour, newEbookAlerts, progressMilestones } = req.body;

  try {
    const prefs = await upsertPreferences(userId, {
      studyReminders,
      reminderHour,
      newEbookAlerts,
      progressMilestones,
    });
    return res.json({ success: true, prefs });
  } catch (err: any) {
    console.error("[ebook-notifications] updatePreferences error:", err.message);
    return res.status(500).json({ error: "Falha ao guardar preferências" });
  }
});

// ── Register FCM device token ─────────────────────────────────────────────────
router.post("/subscribe", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "token FCM é obrigatório" });

  try {
    await registerFcmToken(userId, token);
    return res.json({ success: true });
  } catch (err: any) {
    console.error("[ebook-notifications] subscribe error:", err.message);
    return res.status(500).json({ error: "Falha ao registar token" });
  }
});

// ── Unregister FCM device token ───────────────────────────────────────────────
router.post("/unsubscribe", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "token FCM é obrigatório" });

  try {
    await unregisterFcmToken(userId, token);
    return res.json({ success: true });
  } catch (err: any) {
    console.error("[ebook-notifications] unsubscribe error:", err.message);
    return res.status(500).json({ error: "Falha ao remover token" });
  }
});

// ── Send study reminder to a specific student (admin/system) ─────────────────
router.post("/remind/:studentId", requireAuth, async (req, res) => {
  try {
    const result = await sendStudyReminder(req.params.studentId);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("[ebook-notifications] remind error:", err.message);
    return res.status(500).json({ error: "Falha ao enviar lembrete" });
  }
});

// ── Send milestone notification ───────────────────────────────────────────────
router.post("/milestone", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  const { milestone, ebookTitle } = req.body;
  if (!milestone || !ebookTitle) {
    return res.status(400).json({ error: "milestone e ebookTitle são obrigatórios" });
  }

  try {
    const result = await sendMilestoneNotification(userId, milestone, ebookTitle);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("[ebook-notifications] milestone error:", err.message);
    return res.status(500).json({ error: "Falha ao enviar notificação de progresso" });
  }
});

// ── Broadcast new ebook to all subscribed students (admin) ───────────────────
router.post("/broadcast", requireAuth, async (req, res) => {
  const { ebookId, title } = req.body;
  if (!ebookId || !title) {
    return res.status(400).json({ error: "ebookId e title são obrigatórios" });
  }

  try {
    const result = await broadcastNewEbook(ebookId, title);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("[ebook-notifications] broadcast error:", err.message);
    return res.status(500).json({ error: "Falha ao enviar notificação" });
  }
});

export default router;
