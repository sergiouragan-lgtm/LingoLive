import { Router } from 'express';
import { learningOutcomeMeasurementService } from '../services/learning-outcome-measurement.service';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/create-outcome', requireAuth, async (req: any, res) => {
  try {
    const { conceptId, outcomeType, outcomeName, measurableGoal, targetMetric, measurementMethods } = req.body;
    const outcome = await learningOutcomeMeasurementService.createLearningOutcome(
      req.user?.uid || '',
      conceptId,
      outcomeType,
      outcomeName,
      measurableGoal,
      targetMetric,
      measurementMethods
    );
    res.json(outcome);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/record-evidence/:outcomeId', requireAuth, async (req: any, res) => {
  try {
    const { methodId, dataPoint, measurement, notes } = req.body;
    const outcome = await learningOutcomeMeasurementService.recordOutcomeEvidence(
      req.params.outcomeId,
      methodId,
      dataPoint,
      measurement,
      notes
    );
    res.json(outcome);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/create-rubric', requireAuth, async (req: any, res) => {
  try {
    const { conceptId, criteria, scoringScale } = req.body;
    const rubric = await learningOutcomeMeasurementService.createAssessmentRubric(
      conceptId,
      criteria,
      scoringScale
    );
    res.json(rubric);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/score/:rubricId', requireAuth, async (req: any, res) => {
  try {
    const { studentResponses } = req.body;
    const score = await learningOutcomeMeasurementService.scoreWithRubric(req.params.rubricId, studentResponses);
    res.json(score);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/track-progression', requireAuth, async (req: any, res) => {
  try {
    const { conceptId, milestones } = req.body;
    const progression = await learningOutcomeMeasurementService.trackOutcomeProgression(
      req.user?.uid || '',
      conceptId,
      milestones
    );
    res.json(progression);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/report/:conceptId', requireAuth, async (req: any, res) => {
  try {
    const report = await learningOutcomeMeasurementService.generateOutcomeReport(
      req.user?.uid || '',
      req.params.conceptId
    );
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
