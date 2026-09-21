import { Router } from 'express';
import { masteryCompetencyTrackingService } from '../services/mastery-competency-tracking.service';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/track-mastery', requireAuth, async (req: any, res) => {
  try {
    const { conceptId, assessmentScore, assessmentId } = req.body;
    const competency = await masteryCompetencyTrackingService.trackConceptMastery(
      req.user?.uid || '',
      conceptId,
      assessmentScore,
      assessmentId
    );
    res.json(competency);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:conceptId', requireAuth, async (req: any, res) => {
  try {
    const competency = await masteryCompetencyTrackingService.getCompetencyMap(
      req.user?.uid || '',
      req.params.conceptId
    );
    res.json(competency);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/framework/map', requireAuth, async (req: any, res) => {
  try {
    const { conceptId, competencies, prerequisites, estimatedLearningTime } = req.body;
    const framework = await masteryCompetencyTrackingService.mapCompetencyFramework(
      conceptId,
      competencies,
      prerequisites,
      estimatedLearningTime
    );
    res.json(framework);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/skill-progression', requireAuth, async (req: any, res) => {
  try {
    const { conceptId, skillId, skillName, currentLevel, maxLevel } = req.body;
    const progression = await masteryCompetencyTrackingService.trackSkillProgression(
      req.user?.uid || '',
      conceptId,
      skillId,
      skillName,
      currentLevel,
      maxLevel
    );
    res.json(progression);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/blockers/:conceptId', requireAuth, async (req: any, res) => {
  try {
    const blockers = await masteryCompetencyTrackingService.identifyLearningBlockers(
      req.user?.uid || '',
      req.params.conceptId
    );
    res.json({ blockers });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/report/:conceptId', requireAuth, async (req: any, res) => {
  try {
    const report = await masteryCompetencyTrackingService.generateMasteryReport(
      req.user?.uid || '',
      req.params.conceptId
    );
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
