import { Router } from "express";
import crypto from "crypto";
import { requireAuth } from "../middleware/requireAuth";
import { dbAdmin } from "../config/firebaseAdmin";
import { safeGetDoc } from "../services/firestoreSafe.service";

const router = Router();

// Forbidden fields that client is NEVER allowed to specify directly
const FORBIDDEN_CLIENT_FIELDS = [
  "xp", "totalXp", "awardedXp", "coins", "level", "rank", "rankingPosition", 
  "badges", "rewards", "completedLessons", "organizationId", "userId"
];

// Map of standard XP/Coin rewards calculated strictly on server
const REWARD_MATRIX: Record<string, { xp: number; coins: number }> = {
  lesson_completion: { xp: 50, coins: 10 },
  quiz_attempt: { xp: 100, coins: 20 },
  activity_completion: { xp: 30, coins: 5 },
  daily_streak: { xp: 20, coins: 5 },
  speaking_practice: { xp: 40, coins: 10 }
};

/**
 * POST /api/gamification/award-xp
 * Secure server-controlled endpoint to grant XP and coins to authenticated users.
 */
router.post("/award-xp", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: "Utilizador não autenticado." });
    }

    // 1. Check for forbidden payload manipulation
    const bodyKeys = Object.keys(req.body || {});
    const injectedForbidden = bodyKeys.filter(k => FORBIDDEN_CLIENT_FIELDS.includes(k));
    if (injectedForbidden.length > 0) {
      return res.status(400).json({ 
        error: `Tentativa de manipulação direta de campos restritos: ${injectedForbidden.join(", ")}.` 
      });
    }

    const { eventId, eventType, quizAttemptId } = req.body;

    if (!eventId || !eventType) {
      return res.status(400).json({ error: "Os parâmetros 'eventId' e 'eventType' são obrigatórios." });
    }
    if (!Object.prototype.hasOwnProperty.call(REWARD_MATRIX, eventType)) {
      return res.status(400).json({ error: "Tipo de evento de recompensa inválido." });
    }

    // 2. Resolve user document for tenant scoping and profile details
    let userDoc: any = null;
    try {
      if (dbAdmin) {
        const userSnap = await dbAdmin.collection("users").doc(userId).get();
        if (userSnap.exists) {
          userDoc = userSnap.data();
        }
      }
    } catch (err) {
      console.warn("[Gamification Route] Firestore admin user fetch warning:", err);
    }

    // Fallback to safe get doc if dbAdmin snapshot unavailable
    if (!userDoc) {
      userDoc = await safeGetDoc("users", userId) || {};
    }

    const organizationId = userDoc.organizationId || userDoc.tenantId || "default";
    const classId = userDoc.classId || userDoc.turma || "default_class";
    const schoolId = userDoc.schoolId || "default_school";
    const displayName = userDoc.displayName || userDoc.nome || "Estudante LingoLIVE";
    const avatarUrl = userDoc.avatarUrl || userDoc.photoURL || "";
    const country = userDoc.country || "Angola";
    const province = userDoc.province || "Luanda";

    // 3. Pedagogical Validation of the event
    if (eventType === "quiz_attempt") {
      if (!quizAttemptId || quizAttemptId !== eventId) return res.status(400).json({ error: "Tentativa de quiz inválida." });
      let attemptDoc = null;
      try {
        if (dbAdmin) {
          const attSnap = await dbAdmin.collection("quiz_sessions").doc(quizAttemptId).get();
          if (attSnap.exists) attemptDoc = attSnap.data();
        }
      } catch (e) {
        const fallback = await safeGetDoc("quiz_sessions", quizAttemptId);
        attemptDoc = fallback.exists ? fallback.data() : null;
      }
      if (!attemptDoc || attemptDoc.userId !== userId || attemptDoc.status !== "completed") return res.status(404).json({ error: "Quiz concluído não encontrado." });
      return res.status(409).json({ error: "O XP do quiz já é atribuído atomicamente na submissão." });
    }

    // 4. Calculate server reward
    const reward = REWARD_MATRIX[eventType];

    // 5. Compute Audit ID for strict server-side idempotency
    const rawAuditString = `${userId}_${organizationId}_${eventType}_${eventId}`;
    const auditId = crypto.createHash("sha256").update(rawAuditString).digest("hex");

    if (!dbAdmin) {
      return res.status(503).json({ error: "Persistência de recompensas indisponível." });
    }

    // 6. Execute atomic Firestore transaction
    const auditRef = dbAdmin.collection("xp_audit_logs").doc(auditId);
    const gamificationRef = dbAdmin.collection("user_gamification").doc(userId);
    const leaderboardRef = dbAdmin.collection("leaderboard_entries").doc(userId);

    const transactionResult = await dbAdmin.runTransaction(async (transaction: any) => {
      // Check if audit log already exists
      const auditSnap = await transaction.get(auditRef);
      if (auditSnap.exists) {
        const existingData = auditSnap.data();
        return {
          duplicated: true,
          awardedXp: existingData.awardedXp || 0,
          awardedCoins: existingData.awardedCoins || 0,
          newTotalXp: existingData.newTotalXp || 0,
          newLevel: existingData.newLevel || 1
        };
      }

      // Read current user_gamification state
      const gamificationSnap = await transaction.get(gamificationRef);
      const currentGamification = gamificationSnap.exists ? gamificationSnap.data() : {};

      const previousXp = currentGamification.xp || currentGamification.totalXp || 0;
      const previousCoins = currentGamification.coins || 0;

      const newTotalXp = previousXp + reward.xp;
      const newCoins = previousCoins + reward.coins;
      const newLevel = Math.floor(newTotalXp / 500) + 1;
      const nowIso = new Date().toISOString();

      // Write updated user_gamification
      transaction.set(gamificationRef, {
        userId,
        xp: newTotalXp,
        totalXp: newTotalXp,
        coins: newCoins,
        level: newLevel,
        organizationId,
        classId,
        schoolId,
        updatedAt: nowIso
      }, { merge: true });

      // Write sanitized public leaderboard_entries
      transaction.set(leaderboardRef, {
        userId,
        displayName,
        avatarUrl,
        xp: newTotalXp,
        level: newLevel,
        country,
        province,
        schoolId,
        classId,
        organizationId,
        visibility: currentGamification.visibility || "PUBLIC",
        updatedAt: nowIso
      }, { merge: true });

      // Create audit log
      transaction.set(auditRef, {
        auditId,
        eventId,
        eventType,
        userId,
        organizationId,
        classId,
        awardedXp: reward.xp,
        awardedCoins: reward.coins,
        previousXp,
        newTotalXp,
        newLevel,
        createdAt: nowIso
      });

      return {
        duplicated: false,
        awardedXp: reward.xp,
        awardedCoins: reward.coins,
        newTotalXp,
        newLevel
      };
    });

    return res.json({
      success: true,
      auditId,
      ...transactionResult
    });

  } catch (err: any) {
    console.error("[Gamification Router] Exception awarding XP:", err);
    return res.status(500).json({ error: err.message || "Falha ao atribuir XP." });
  }
});

export default router;
