import { Router } from 'express';
import { adaptiveLearningPathsService } from '../services/adaptive-learning-paths.service';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/generate', requireAuth, async (req: any, res) => {
  try {
    const { targetLanguage, proficiencyLevel } = req.body;
    const path = await adaptiveLearningPathsService.generateAdaptivePath(
      req.user?.uid || '',
      targetLanguage,
      proficiencyLevel
    );
    res.json(path);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/adjust', requireAuth, async (req: any, res) => {
  try {
    const { pathId, modulePerformance } = req.body;
    const adjusted = await adaptiveLearningPathsService.adjustPathBasedOnPerformance(
      pathId,
      req.user?.uid || '',
      modulePerformance
    );
    res.json(adjusted);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/complete-module', requireAuth, async (req: any, res) => {
  try {
    const { pathId, moduleId, score, timeSpent } = req.body;
    const updated = await adaptiveLearningPathsService.updateModuleCompletion(
      pathId,
      moduleId,
      score,
      timeSpent
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:pathId', requireAuth, async (req: any, res) => {
  try {
    const path = await adaptiveLearningPathsService.getAdaptivePath(req.params.pathId);
    res.json(path);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/preferences', requireAuth, async (req: any, res) => {
  try {
    const preferences = req.body;
    const result = await adaptiveLearningPathsService.setLearningPreferences(req.user?.uid || '', preferences);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:pathId/completion-prediction', requireAuth, async (req: any, res) => {
  try {
    const prediction = await adaptiveLearningPathsService.predictCompletionDate(req.params.pathId);
    res.json(prediction);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
