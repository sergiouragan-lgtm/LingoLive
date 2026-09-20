import { Router, Request, Response } from 'express';
import { advancedPersonalizationUXService } from '../services/advanced-personalization-ux.service';

const router = Router();

router.post('/profiles/create', async (req: Request, res: Response) => {
  try {
    const { userId, learningStyle, preferences, contentAffinities } = req.body;
    const profile = await advancedPersonalizationUXService.createPersonalizationProfile(
      userId,
      learningStyle,
      preferences,
      contentAffinities
    );
    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/recommendations/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { algorithm } = req.query;
    const recommendations = await advancedPersonalizationUXService.getContentRecommendations(
      userId,
      (algorithm as any) || 'hybrid'
    );
    res.status(200).json(recommendations);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/learning-paths/optimize', async (req: Request, res: Response) => {
  try {
    const { userId, currentLevel, completionRate } = req.body;
    const path = await advancedPersonalizationUXService.optimizeLearningPath(
      userId,
      currentLevel,
      completionRate
    );
    res.status(201).json(path);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/ui-adaptation/configure', async (req: Request, res: Response) => {
  try {
    const { userId, theme, layout, fontSize, textSize, accessibilityFeatures } = req.body;
    const adaptation = await advancedPersonalizationUXService.configureUIAdaptation(
      userId,
      theme,
      layout,
      fontSize,
      textSize,
      accessibilityFeatures
    );
    res.status(201).json(adaptation);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/engagement/track', async (req: Request, res: Response) => {
  try {
    const { userId, dailyActiveMinutes, weeklySessionCount, completionRate } = req.body;
    const engagement = await advancedPersonalizationUXService.trackUserEngagement(
      userId,
      dailyActiveMinutes,
      weeklySessionCount,
      completionRate
    );
    res.status(201).json(engagement);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/ab-tests/create', async (req: Request, res: Response) => {
  try {
    const { name, hypothesis, startDate } = req.body;
    const experiment = await advancedPersonalizationUXService.createABTest(
      name,
      hypothesis,
      new Date(startDate)
    );
    res.status(201).json(experiment);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const metrics = await advancedPersonalizationUXService.getPersonalizationMetrics({ start: startDate, end: endDate });
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
