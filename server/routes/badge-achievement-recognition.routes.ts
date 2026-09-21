import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { badgeAchievementRecognitionService } from '../services/badge-achievement-recognition.service';

const router = Router();

router.post('/create', requireAuth, async (req: any, res) => {
  try {
    const { badgeName, badgeType, description, icon, rarity, requirements, pointValue } = req.body;

    const badge = await badgeAchievementRecognitionService.createBadge(
      badgeName,
      badgeType,
      description,
      icon,
      rarity,
      requirements,
      pointValue
    );

    res.json({ success: true, badge });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/award/:badgeId', requireAuth, async (req: any, res) => {
  try {
    const { badgeId } = req.params;
    const { userId, evidenceData } = req.body;

    const userBadge = await badgeAchievementRecognitionService.awardBadgeToUser(userId, badgeId, evidenceData);

    res.json({ success: true, userBadge });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/progress/:userId/:badgeId', requireAuth, async (req: any, res) => {
  try {
    const { userId, badgeId } = req.params;

    const progress = await badgeAchievementRecognitionService.trackBadgeProgress(userId, badgeId);

    res.json({ success: true, progress });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:userId', requireAuth, async (req: any, res) => {
  try {
    const { userId } = req.params;

    const badges = await badgeAchievementRecognitionService.getUserBadges(userId);

    res.json({ success: true, badges });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/leaderboard/:period', requireAuth, async (req: any, res) => {
  try {
    const { period } = req.params;

    const leaderboard = await badgeAchievementRecognitionService.generateBadgeLeaderboard(
      period as 'daily' | 'weekly' | 'monthly' | 'alltime'
    );

    res.json({ success: true, leaderboard });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/revoke/:userBadgeId', requireAuth, async (req: any, res) => {
  try {
    const { userBadgeId } = req.params;
    const { reason } = req.body;

    const revoked = await badgeAchievementRecognitionService.revokeBadge(userBadgeId, reason);

    res.json({ success: true, badge: revoked });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
