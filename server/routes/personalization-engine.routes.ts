import { Router } from 'express';
import { personalizationEngineService } from '../services/personalization-engine.service';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.get('/behavior-profile', requireAuth, async (req: any, res) => {
  try {
    const profile = await personalizationEngineService.buildBehaviorProfile(req.user?.uid || '');
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/content-preferences', requireAuth, async (req: any, res) => {
  try {
    const prefs = await personalizationEngineService.analyzeContentPreferences(req.user?.uid || '');
    res.json(prefs);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/adapt-difficulty', requireAuth, async (req: any, res) => {
  try {
    const { conceptId, currentScore } = req.body;
    const adaptation = await personalizationEngineService.adaptDifficulty(
      req.user?.uid || '',
      conceptId,
      currentScore
    );
    res.json(adaptation);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/session-customization', requireAuth, async (req: any, res) => {
  try {
    const customization = await personalizationEngineService.generateSessionCustomization(req.user?.uid || '');
    res.json(customization);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/learning-velocity/:conceptId', requireAuth, async (req: any, res) => {
  try {
    const velocity = await personalizationEngineService.calculateLearningVelocity(
      req.user?.uid || '',
      req.params.conceptId
    );
    res.json(velocity);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
