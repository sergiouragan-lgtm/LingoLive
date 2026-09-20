import { Router } from 'express';
import { gamificationEngagementService } from '../services/gamification-engagement.service';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/achievement/unlock', requireAuth, async (req, res) => {
  try {
    const { userId, badgeType, title, pointsAwarded } = req.body;
    const achievement = await gamificationEngagementService.unlockAchievement(
      userId,
      badgeType,
      title,
      pointsAwarded
    );
    res.json(achievement);
  } catch (error: any) {
    console.error('Error unlocking achievement:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/leaderboard/:scope', requireAuth, async (req, res) => {
  try {
    const { scope } = req.params;
    const { userId, limit } = req.query;
    const leaderboard = await gamificationEngagementService.getLeaderboard(
      scope as 'global' | 'weekly' | 'friends',
      userId as string,
      parseInt(limit as string) || 100
    );
    res.json(leaderboard);
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/streak/update', requireAuth, async (req, res) => {
  try {
    const { userId, concept } = req.body;
    const streak = await gamificationEngagementService.updateStreak(userId, concept);
    res.json(streak);
  } catch (error: any) {
    console.error('Error updating streak:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/points/award', requireAuth, async (req, res) => {
  try {
    const { userId, points, reason, metadata } = req.body;
    await gamificationEngagementService.awardPoints(userId, points, reason, metadata);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error awarding points:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/profile/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await gamificationEngagementService.getEngagementProfile(userId);
    res.json(profile);
  } catch (error: any) {
    console.error('Error getting engagement profile:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/milestones/check/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const milestones = await gamificationEngagementService.checkMilestones(userId);
    res.json(milestones);
  } catch (error: any) {
    console.error('Error checking milestones:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
