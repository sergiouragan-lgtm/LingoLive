import { Router } from 'express';
import { assessmentAnalyticsService } from '../services/assessment-analytics.service';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/analyze-items/:assessmentId', requireAuth, async (req: any, res) => {
  try {
    const analytics = await assessmentAnalyticsService.analyzeAssessmentItems(req.params.assessmentId);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/concept/:conceptId', requireAuth, async (req: any, res) => {
  try {
    const analytics = await assessmentAnalyticsService.analyzeConceptPerformance(req.params.conceptId);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/compare-progression', requireAuth, async (req: any, res) => {
  try {
    const { assessmentIds } = req.body;
    const comparison = await assessmentAnalyticsService.compareAssessmentProgression(
      req.user?.uid || '',
      assessmentIds
    );
    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/risk-patterns', requireAuth, async (req: any, res) => {
  try {
    const patterns = await assessmentAnalyticsService.identifyRiskPatterns(req.user?.uid || '');
    res.json(patterns);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
