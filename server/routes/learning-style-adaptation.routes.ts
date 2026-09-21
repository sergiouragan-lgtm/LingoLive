import { Router } from 'express';
import { learningStyleAdaptationService } from '../services/learning-style-adaptation.service';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/detect-style', requireAuth, async (req: any, res) => {
  try {
    const profile = await learningStyleAdaptationService.detectLearningStyle(req.user?.uid || '');
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/match-content', requireAuth, async (req: any, res) => {
  try {
    const { contentId, contentFormats } = req.body;
    const match = await learningStyleAdaptationService.matchContentToStyle(
      req.user?.uid || '',
      contentId,
      contentFormats
    );
    res.json(match);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/optimize-interaction', requireAuth, async (req: any, res) => {
  try {
    const { interactionType } = req.body;
    const optimization = await learningStyleAdaptationService.optimizeInteractionPattern(
      req.user?.uid || '',
      interactionType
    );
    res.json(optimization);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/adapt-presentation/:contentId', requireAuth, async (req: any, res) => {
  try {
    const adaptation = await learningStyleAdaptationService.adaptPresentation(
      req.params.contentId,
      req.user?.uid || ''
    );
    res.json(adaptation);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/manage-cognitive-load/:sessionId', requireAuth, async (req: any, res) => {
  try {
    const metrics = await learningStyleAdaptationService.manageCognitiveLoad(
      req.user?.uid || '',
      req.params.sessionId
    );
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
