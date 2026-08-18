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

// 2. API endpoint to send test push notifications (supports both real FCM and sandbox fallback)
router.post("/send-test-push", requireAuth, async (req: any, res) => {
  const { userId, title, body } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
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

    console.log(`[Test Push] Sending push to User ID: ${userId}, Token: ${token}`);

    if (token.startsWith("simulated_")) {
      return res.json({
        status: "simulated",
        message: "Notificação simulada disparada com sucesso! Exibiremos o alerta localmente no seu navegador.",
        title: notificationTitle,
        body: notificationBody
      });
    }

    if (!dbAdmin) {
      return res.status(500).json({ 
        error: "Firebase Admin SDK não foi inicializado." 
      });
    }

    try {
      await (admin as any).messaging().send({
        token: token,
        notification: {
          title: notificationTitle,
          body: notificationBody,
        },
        data: {
          type: "test_notification"
        }
      });
      
      res.json({
        status: "success",
        message: "Notificação Push Real enviada com sucesso via Firebase Cloud Messaging!"
      });
    } catch (fcmErr: any) {
      console.warn("FCM real send failed, providing simulation fallback:", fcmErr.message);
      res.status(200).json({
        status: "simulated",
        message: `Notificação Push disparada (FCM falhou: ${fcmErr.message}). Utilizando fallback de simulação local no navegador.`,
        title: notificationTitle,
        body: notificationBody,
        fallback: true
      });
    }
  } catch (err: any) {
    console.error("Test push endpoint error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
