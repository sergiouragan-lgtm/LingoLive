import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { testCoverageQualityService } from '../services/test-coverage-quality.service';

const router = Router();

router.post('/coverage-reports', requireAuth, async (req: Request, res: Response) => {
  try {
    const { statements, branches, functions, lines, fileData } = req.body;
    const report = await testCoverageQualityService.generateCoverageReport(
      statements,
      branches,
      functions,
      lines,
      fileData
    );
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/quality-gates', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, rules, threshold } = req.body;
    const gate = await testCoverageQualityService.defineQualityGate(name, rules, threshold);
    res.json(gate);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/evaluate-quality-gate', requireAuth, async (req: Request, res: Response) => {
  try {
    const { gateId, metrics } = req.body;
    const result = await testCoverageQualityService.evaluateQualityGate(gateId, metrics);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/code-quality-metrics', requireAuth, async (req: Request, res: Response) => {
  try {
    const { coverage, complexity, duplication, issues } = req.body;
    const metrics = await testCoverageQualityService.recordCodeQualityMetrics(
      coverage,
      complexity,
      duplication,
      issues
    );
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/technical-debt', requireAuth, async (req: Request, res: Response) => {
  try {
    const { metrics, fileData } = req.body;
    const debt = await testCoverageQualityService.identifyTechnicalDebt(metrics, fileData);
    res.json(debt);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/quality-trends', requireAuth, async (req: Request, res: Response) => {
  try {
    const { metric, dataPoints } = req.body;
    const trend = await testCoverageQualityService.trackQualityTrend(metric, dataPoints);
    res.json(trend);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
