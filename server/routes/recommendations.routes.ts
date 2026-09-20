import express, { Request, Response } from 'express';
import { recommendationsService } from '../services/recommendations.service';
import { requireAuth } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/preferences/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const preferences = await recommendationsService.getUserContentPreferences(userId);
    res.json(preferences);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/preferences/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    await recommendationsService.updateUserPreferences(userId, req.body);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/personalized/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    const recommendations = await recommendationsService.getPersonalizedRecommendations(userId, limit);
    res.json(recommendations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/collaborative-filtering/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await recommendationsService.getCollaborativeFilteringRecommendations(userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/interactions', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, contentId, interactionType } = req.body;
    await recommendationsService.recordRecommendationInteraction(userId, contentId, interactionType);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ab-tests', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, description, variants } = req.body;
    const test = await recommendationsService.createABTest(name, description, variants);
    res.status(201).json(test);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/ab-tests', requireAuth, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const tests = await recommendationsService.getABTests(status);
    res.json(tests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ab-tests/:testId/activate', requireAuth, async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;
    await recommendationsService.activateABTest(testId);
    res.json({ success: true, message: 'A/B test activated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/metrics', requireAuth, async (req: Request, res: Response) => {
  try {
    const metrics = await recommendationsService.getRecommendationMetrics();
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
