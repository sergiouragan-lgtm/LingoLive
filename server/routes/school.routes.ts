import { Router } from "express";
import admin from "firebase-admin";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { dbAdmin } from "../config/firebaseAdmin";
import { safeAddDoc, safeGetDoc } from "../services/firestoreSafe.service";

const router = Router();

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

// 2. API endpoint to send a real test push notification.
router.post("/send-test-push", requireAuth, async (req: any, res) => {
  const { userId, title, body } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const privilegedRoles = new Set(["school_admin", "super_admin"]);
  if (userId !== req.user.uid && !privilegedRoles.has(req.user.role)) {
    return res.status(403).json({ error: "Não pode enviar notificações para outro usuário." });
  }

  try {
    const userDoc = await safeGetDoc("users", userId);
    if (!userDoc.exists) {
      return res.status(404).json({ error: "Perfil do usuário não encontrado." });
    }
    
    const userData = userDoc.data();
    const settings = userData?.notificationSettings;
    const token = settings?.fcmToken;
    
    if (!token) {
      return res.status(400).json({ 
        error: "Nenhum token push registrado. Ative as notificações nas configurações primeiro." 
      });
    }

    const notificationTitle = title || "LingoLive: Teste de Push! 🔔";
    const notificationBody = body || "Suas notificações push estão configuradas e ativas com sucesso!";

    if (token.startsWith("simulated_")) {
      return res.status(422).json({
        error: "INVALID_FCM_TOKEN",
        message: "O token registrado não é um token FCM válido. Registre novamente este navegador.",
      });
    }

    if (!dbAdmin) {
      return res.status(503).json({
        error: "FCM_NOT_CONFIGURED",
        message: "O serviço de notificações push não está configurado.",
      });
    }

    try {
      const messageId = await (admin as any).messaging().send({
        token: token,
        notification: {
          title: notificationTitle,
          body: notificationBody,
        },
        data: {
          type: "test_notification"
        }
      });

      await safeAddDoc("notification_deliveries", {
        userId,
        channel: "fcm",
        kind: "test_notification",
        status: "accepted",
        providerMessageId: messageId,
        createdAt: new Date().toISOString(),
      });
      
      res.json({
        status: "accepted",
        message: "Notificação aceita pelo Firebase Cloud Messaging.",
        messageId,
      });
    } catch (fcmErr: any) {
      console.warn("FCM real send failed:", fcmErr.message);
      res.status(502).json({
        error: "FCM_DELIVERY_FAILED",
        message: "O Firebase Cloud Messaging recusou a notificação. Verifique o token e tente novamente.",
        retryable: true,
      });
    }
  } catch (err: any) {
    console.error("Test push endpoint error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
