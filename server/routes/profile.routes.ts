import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { safeSetDoc } from "../services/firestoreSafe.service";

const router = Router();

/**
 * @swagger
 * /profile:
 *   post:
 *     summary: Update user profile
 *     description: Updates authenticated user's profile information including display name, preferences, and settings
 *     tags:
 *       - User Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserProfile'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 profile:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Invalid request payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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
