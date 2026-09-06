import { Router } from "express";
import admin from "firebase-admin";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { attachSchoolClaims, requireSchoolRole, schoolClaimsErrorStatus } from "../middleware/requireSchoolClaims";
import {
  assertClassAccess,
  assertTenantAccess,
  assignSchoolClaims,
  normalizeSchoolRole,
  resolveSchoolClaims,
  SCHOOL_ROLES,
} from "../services/schoolClaims.service";
import { dbAdmin } from "../config/firebaseAdmin";
import { safeAddDoc, safeGetDoc, safeListDocs } from "../services/firestoreSafe.service";

const router = Router();

// 1. API endpoint to add a teacher
router.post(
  "/professores",
  requireAuth,
  requireRole("school_admin", "super_admin"),
  async (req: any, res: any) => {
    try {
      const { nome, email, telefone, idioma, sala, turno, allowedClassIds } = req.body;

      // A escola e o tenant vêm sempre das claims assinadas do actor, nunca do
      // corpo do pedido. Um pedido que aponte para outro tenant é recusado.
      const claims = await resolveSchoolClaims(req.user);
      const requestedTenantId = req.body.tenantId || req.body.organizationId || claims.tenantId;
      assertTenantAccess(claims, requestedTenantId);

      const requestedSchoolId = req.body.schoolId || claims.schoolId;
      if (claims.schoolId && requestedSchoolId && requestedSchoolId !== claims.schoolId
          && !["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(claims.role)) {
        return res.status(403).json({ error: "Não pode criar professor noutra escola" });
      }

      const schoolId = requestedSchoolId || claims.schoolId;
      if (!schoolId) {
        return res.status(400).json({
          error: "SCHOOL_ID_REQUIRED",
          message: "O administrador não tem uma escola associada nas suas claims.",
        });
      }

      if (!nome || !email) {
        return res.status(400).json({ error: "Nome e email são obrigatórios" });
      }

      // Cada turma atribuída ao novo professor tem de estar no âmbito do actor.
      const classIds: string[] = Array.isArray(allowedClassIds) ? allowedClassIds.map(String) : [];
      for (const classId of classIds) {
        assertClassAccess(claims, classId);
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
        tenantId: claims.tenantId,
        schoolId,
        allowedClassIds: classIds
      });

      res.status(201).json({ message: "Professor registrado com sucesso", schoolId, tenantId: claims.tenantId });
    } catch (error: any) {
      const code = String(error?.message || "");
      if (code.startsWith("SCHOOL_")) {
        return res.status(schoolClaimsErrorStatus(code)).json({ error: code });
      }
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

// 3. Claims escolares: leitura das claims efetivas do próprio utilizador.
// A app mobile chama este endpoint no arranque para saber que áreas mostrar.
router.get("/claims/me", requireAuth, attachSchoolClaims, async (req: any, res) => {
  return res.json({
    userId: req.user.uid,
    role: req.schoolClaims.role,
    tenantId: req.schoolClaims.tenantId,
    schoolId: req.schoolClaims.schoolId,
    classIds: req.schoolClaims.classIds,
    crossTenant: ["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(req.schoolClaims.role),
  });
});

// 4. Atribuição real de custom claims escolares (Firebase Auth).
router.post(
  "/claims/assign",
  requireAuth,
  attachSchoolClaims,
  requireSchoolRole("SUPER_ADMIN", "PLATFORM_ADMIN", "ORG_ADMIN", "SCHOOL_ADMIN"),
  async (req: any, res) => {
    const { targetUid, role, tenantId, schoolId, classIds } = req.body || {};

    if (!targetUid || typeof targetUid !== "string") {
      return res.status(400).json({ error: "TARGET_UID_REQUIRED" });
    }
    const normalizedRole = normalizeSchoolRole(role);
    if (!normalizedRole) {
      return res.status(400).json({
        error: "SCHOOL_ROLE_INVALID",
        message: `Papel inválido. Papéis aceites: ${SCHOOL_ROLES.join(", ")}.`,
      });
    }

    try {
      const claims = await assignSchoolClaims({
        actor: { ...req.schoolClaims, userId: req.user.uid },
        targetUid,
        role: normalizedRole,
        tenantId: tenantId || req.schoolClaims.tenantId,
        schoolId: schoolId ?? req.schoolClaims.schoolId,
        classIds: Array.isArray(classIds) ? classIds : [],
      });
      return res.json({ success: true, targetUid, claims });
    } catch (error: any) {
      const code = String(error?.message || "SCHOOL_CLAIMS_UNAVAILABLE");
      return res.status(schoolClaimsErrorStatus(code)).json({
        error: code,
        message: code === "SCHOOL_CLAIMS_UNAVAILABLE"
          ? "O Firebase Admin Auth não está configurado; nenhuma claim foi atribuída."
          : "Não foi possível atribuir as claims escolares pedidas.",
      });
    }
  }
);

// 5. Diretório escolar restrito ao tenant real do actor.
router.get(
  "/directory",
  requireAuth,
  attachSchoolClaims,
  requireSchoolRole("SUPER_ADMIN", "PLATFORM_ADMIN", "ORG_ADMIN", "SCHOOL_ADMIN", "TEACHER", "NATIVE_TEACHER"),
  async (req: any, res) => {
    try {
      const claims = req.schoolClaims;
      const crossTenant = ["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(claims.role);

      const inTenant = (record: any) => crossTenant
        || record.tenantId === claims.tenantId
        || (!record.tenantId && record.schoolId && record.schoolId === claims.schoolId);

      const teachers = (await safeListDocs("teachers")).filter(inTenant);
      let students = (await safeListDocs("students")).filter(inTenant);

      // Um professor só vê os alunos das turmas presentes nas suas claims.
      if (["TEACHER", "NATIVE_TEACHER"].includes(claims.role)) {
        students = students.filter((student: any) => {
          const classId = student.classId || student.turma;
          return student.teacherUid === req.user.uid
            || (classId && claims.classIds.includes(String(classId)));
        });
      }

      return res.json({
        tenantId: claims.tenantId,
        schoolId: claims.schoolId,
        role: claims.role,
        teachers: teachers.map((teacher: any) => ({
          id: teacher.id,
          nome: teacher.nome || teacher.name || "",
          email: teacher.email || "",
          idioma: teacher.idioma || null,
          schoolId: teacher.schoolId || null,
          allowedClassIds: teacher.allowedClassIds || [],
        })),
        students: students.map((student: any) => ({
          id: student.id,
          name: student.name || student.nome || "",
          classId: student.classId || student.turma || null,
          targetLanguage: student.targetLanguage || null,
        })),
      });
    } catch (error: any) {
      const code = String(error?.message || "");
      if (code.startsWith("SCHOOL_")) {
        return res.status(schoolClaimsErrorStatus(code)).json({ error: code });
      }
      console.error("Erro ao listar diretório escolar:", error);
      return res.status(500).json({ error: "Erro interno ao listar diretório escolar" });
    }
  }
);

export default router;
