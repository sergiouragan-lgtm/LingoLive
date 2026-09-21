import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { performanceTestingService } from '../services/performance-testing.service';

const router = Router();

router.post('/load-tests', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, endpoint, scenarioType, virtualUsers, duration, rampUpTime } = req.body;
    const test = await performanceTestingService.runLoadTest(
      name,
      endpoint,
      scenarioType,
      virtualUsers,
      duration,
      rampUpTime
    );
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/stress-tests', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, endpoint, initialUsers, maxUsers, incrementBy } = req.body;
    const test = await performanceTestingService.runStressTest(
      name,
      endpoint,
      initialUsers,
      maxUsers,
      incrementBy
    );
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/memory-profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const { serviceId, duration } = req.body;
    const profile = await performanceTestingService.profileMemoryUsage(serviceId, duration);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/database-query-tests', requireAuth, async (req: Request, res: Response) => {
  try {
    const { collection, queryType, documentCount, executions } = req.body;
    const test = await performanceTestingService.testDatabaseQueryPerformance(
      collection,
      queryType,
      documentCount,
      executions
    );
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/baselines', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, endpoint, baseMetrics, basedOnTests } = req.body;
    const baseline = await performanceTestingService.createPerformanceBaseline(
      name,
      endpoint,
      baseMetrics,
      basedOnTests
    );
    res.json(baseline);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/benchmark-compare', requireAuth, async (req: Request, res: Response) => {
  try {
    const { baselineId, currentTestId, currentMetrics } = req.body;
    const comparison = await performanceTestingService.compareToBenchmark(baselineId, currentTestId, currentMetrics);
    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
