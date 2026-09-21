import { Router } from 'express';
import { predictiveInterventionService } from '../services/predictive-intervention.service';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/assess-risk', requireAuth, async (req: any, res) => {
  try {
    const assessment = await predictiveInterventionService.assessRisk(req.user?.uid || '');
    res.json(assessment);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/recommend-interventions', requireAuth, async (req: any, res) => {
  try {
    const { riskAssessmentId } = req.body;
    const recommendations = await predictiveInterventionService.recommendInterventions(
      req.user?.uid || '',
      riskAssessmentId
    );
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/execute-intervention', requireAuth, async (req: any, res) => {
  try {
    const { interventionId } = req.body;
    const execution = await predictiveInterventionService.executeIntervention(
      interventionId,
      req.user?.uid || ''
    );
    res.json(execution);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/monitor-progress/:executionId', requireAuth, async (req: any, res) => {
  try {
    const progressData = req.body;
    const updated = await predictiveInterventionService.monitorInterventionProgress(
      req.params.executionId,
      progressData
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/early-warnings', requireAuth, async (req: any, res) => {
  try {
    const signals = await predictiveInterventionService.detectEarlyWarnings(req.user?.uid || '');
    res.json(signals);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/predict-success/:conceptId', requireAuth, async (req: any, res) => {
  try {
    const probability = await predictiveInterventionService.predictSuccess(
      req.user?.uid || '',
      req.params.conceptId
    );
    res.json(probability);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
