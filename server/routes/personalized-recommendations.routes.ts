import { Router } from 'express';
import { personalizedRecommendationsService } from '../services/personalized-recommendations.service';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.get('/recommendations/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;
    const recommendations = await personalizedRecommendationsService.getContentRecommendations(
      userId,
      parseInt(limit as string) || 5
    );
    res.json(recommendations);
  } catch (error: any) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/record-click', requireAuth, async (req, res) => {
  try {
    const { recommendationId, userId } = req.body;
    await personalizedRecommendationsService.recordRecommendationClick(recommendationId, userId);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error recording click:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/record-completion', requireAuth, async (req, res) => {
  try {
    const { userId, contentId, timeSpentSeconds } = req.body;
    await personalizedRecommendationsService.recordContentCompletion(userId, contentId, timeSpentSeconds);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error recording completion:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/metrics/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const metrics = await personalizedRecommendationsService.getRecommendationMetrics(userId);
    res.json(metrics);
  } catch (error: any) {
    console.error('Error getting metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/profile/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = req.body;
    await personalizedRecommendationsService.updateUserProfile(userId, profile);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
