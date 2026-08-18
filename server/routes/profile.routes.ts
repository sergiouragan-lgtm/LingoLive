import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { safeSetDoc } from "../services/firestoreSafe.service";

const router = Router();

router.post("/", requireAuth, async (req: any, res) => {
  const userId = req.user.uid;
  const profileData = req.body;

  try {
    const updatePayload: Record<string, any> = {};
    const allowedKeys = [
      "displayName", "email", "age", "level", "learningLanguage", 
      "targetRegion", "dailyGoal", "theme", "welcomeCompleted", 
      "paymentCompleted", "onboardingCompleted", "countryCode", "nativeLanguage",
      "notificationSettings"
    ];

    for (const key of allowedKeys) {
      if (profileData[key] !== undefined) {
        updatePayload[key] = profileData[key];
      }
    }

    updatePayload.updatedAt = new Date().toISOString();

    await safeSetDoc("users", userId, updatePayload, true);
    
    res.json({ success: true, message: "Perfil atualizado com sucesso", profile: updatePayload });
  } catch (error: any) {
    console.error("Erro ao atualizar perfil no backend:", error);
    res.status(500).json({ error: error.message || "Erro interno ao salvar perfil." });
  }
});

export default router;
