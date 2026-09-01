import { Router } from "express";
import admin from "firebase-admin";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { dbAdmin } from "../config/firebaseAdmin";
import { safeAddDoc } from "../services/firestoreSafe.service";

const router = Router();

const SCHOOL_ROLES = new Set(["school_admin", "org_admin", "admin", "super_admin"]);

// Mobile clients must authorize institutional navigation exclusively from
// verified custom claims. Mutable fields in users/{uid} are never consulted.
router.get("/school/mobile-context", requireAuth, async (req: any, res) => {
  const role = String(req.user?.role || "").toLowerCase();
  const schoolId = typeof req.user?.schoolId === "string" ? req.user.schoolId.trim() : "";
  const tenantId = typeof req.user?.tenantId === "string" ? req.user.tenantId.trim() : "";
  if (!SCHOOL_ROLES.has(role) || (!schoolId && !tenantId)) {
    return res.status(403).json({ error: "Acesso institucional não atribuído." });
  }
  return res.json({ role, schoolId: schoolId || null, tenantId: tenantId || null });
});

// 1. API endpoint to add a teacher
router.post(
  "/professores",
  requireAuth,
  requireRole("school_admin", "super_admin"),
  async (req: any, res: any) => {
    try {
      const { nome, email, telefone, idioma, sala, turno, allowedClassIds } = req.body;
      const schoolId = req.user.schoolId || req.body.schoolId;

      if (req.user.role !== "super_admin" && req.body.schoolId !== req.user.schoolId) {
        return res.status(403).json({ error: "Não pode criar professor noutra escola" });
      }
      
      if (!nome || !email) {
        return res.status(400).json({ error: "Nome e email são obrigatórios" });
      }

      const invitationCode = `PROF-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      
      await safeAddDoc("teachers", {
        nome,
        email,
        telefone,
        idioma,
        sala,
        turno,
        invitationCode,
        schoolId: schoolId || "default-school",
        allowedClassIds: allowedClassIds || []
      });
      
      res.status(201).json({ message: "Professor registrado com sucesso" });
    } catch (error) {
      console.error("Erro ao registrar professor:", error);
      res.status(500).json({ error: "Erro interno ao registrar professor" });
    }
  }
);

// 2. Real FCM delivery check. A learner can target only their own registered
// devices; institutional operators are authorized exclusively by token claims.
router.post("/send-test-push", requireAuth, async (req: any, res) => {
  const { userId, title, body } = req.body;
  if (typeof userId !== "string" || !userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  const callerRole = String(req.user?.role || "").toLowerCase();
  if (userId !== req.user.uid && !SCHOOL_ROLES.has(callerRole)) {
    return res.status(403).json({ error: "Sem permissão para notificar este utilizador." });
  }
  if (typeof title !== "string" || typeof body !== "string" || !title.trim() || !body.trim() || title.length > 120 || body.length > 500) {
    return res.status(400).json({ error: "Título ou mensagem inválidos." });
  }

  try {
    if (!dbAdmin) {
      return res.status(503).json({ error: "Firebase Admin SDK não foi inicializado." });
    }
    const devices = await dbAdmin.collection("users").doc(userId).collection("devices").where("enabled", "==", true).limit(20).get();
    const tokens = devices.docs.map((document: any) => document.data()?.token).filter((token: unknown): token is string => typeof token === "string" && token.length >= 20);
    if (!tokens.length) return res.status(404).json({ error: "Nenhum dispositivo com notificações ativas." });
    const result = await (admin as any).messaging().sendEachForMulticast({
      tokens,
      notification: { title: title.trim(), body: body.trim() },
      data: { type: "delivery_check" },
    });
    return res.json({ status: "sent", successCount: result.successCount, failureCount: result.failureCount });
  } catch (err: any) {
    console.error("Test push endpoint error:", err);
    res.status(502).json({ error: "Falha no envio FCM." });
  }
});

export default router;
