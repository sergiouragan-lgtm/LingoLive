import { Router } from 'express';
import { contentCurationGenerationService } from '../services/content-curation-generation.service';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.get('/curated/:userId/:concept', requireAuth, async (req, res) => {
  try {
    const { userId, concept } = req.params;
    const { limit } = req.query;
    const content = await contentCurationGenerationService.curateContentForUser(
      userId,
      concept,
      parseInt(limit as string) || 10
    );
    res.json(content);
  } catch (error: any) {
    console.error('Error curating content:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/exercise/generate', requireAuth, async (req, res) => {
  try {
    const { userId, concept, difficulty, exerciseType } = req.body;
    const exercise = await contentCurationGenerationService.generateExercise(
      userId,
      concept,
      difficulty,
      exerciseType
    );
    res.json(exercise);
  } catch (error: any) {
    console.error('Error generating exercise:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/curriculum/generate', requireAuth, async (req, res) => {
  try {
    const { userId, targetLanguage, proficiencyLevel, hoursPerWeek } = req.body;
    const curriculum = await contentCurationGenerationService.generatePersonalizedCurriculum(
      userId,
      targetLanguage,
      proficiencyLevel,
      hoursPerWeek
    );
    res.json(curriculum);
  } catch (error: any) {
    console.error('Error generating curriculum:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/content/rate', requireAuth, async (req, res) => {
  try {
    const { userId, contentId, rating } = req.body;
    await contentCurationGenerationService.rateContent(userId, contentId, rating);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error rating content:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/ab-test/create-variant', requireAuth, async (req, res) => {
  try {
    const { contentId, description, content, isControl } = req.body;
    const variant = await contentCurationGenerationService.createABTestVariant(
      contentId,
      description,
      content,
      isControl
    );
    res.json(variant);
  } catch (error: any) {
    console.error('Error creating A/B test variant:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/metadata/:contentId', requireAuth, async (req, res) => {
  try {
    const { contentId } = req.params;
    const metadata = await contentCurationGenerationService.getContentMetadata(contentId);
    res.json(metadata);
  } catch (error: any) {
    console.error('Error getting content metadata:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/curriculum/update-progress', requireAuth, async (req, res) => {
  try {
    const { pathId, moduleId, completed } = req.body;
    await contentCurationGenerationService.updateCurriculumProgress(pathId, moduleId, completed);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating curriculum progress:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
