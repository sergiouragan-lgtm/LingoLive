import { Router, Request, Response } from 'express';
import { advancedPerformanceOptimizationService } from '../services/advanced-performance-optimization.service';

const router = Router();

router.post('/metrics/record', async (req: Request, res: Response) => {
  try {
    const { name, category, value, unit, threshold } = req.body;
    const metric = await advancedPerformanceOptimizationService.recordPerformanceMetric(
      name,
      category,
      value,
      unit,
      threshold
    );
    res.status(201).json(metric);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/cache/strategy', async (req: Request, res: Response) => {
  try {
    const { name, type, ttl, evictionPolicy } = req.body;
    const strategy = await advancedPerformanceOptimizationService.implementCacheStrategy(
      name,
      type,
      ttl,
      evictionPolicy
    );
    res.status(201).json(strategy);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/database/optimize', async (req: Request, res: Response) => {
  try {
    const { type, targetCollection, improvement } = req.body;
    const optimization = await advancedPerformanceOptimizationService.optimizeDatabase(
      type,
      targetCollection,
      improvement
    );
    res.status(201).json(optimization);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/cdn/configure', async (req: Request, res: Response) => {
  try {
    const { provider, regions, cacheBehaviors } = req.body;
    const config = await advancedPerformanceOptimizationService.configureCDN(
      provider,
      regions,
      cacheBehaviors
    );
    res.status(201).json(config);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/loadbalancing/setup', async (req: Request, res: Response) => {
  try {
    const { algorithm, serverInstances, healthCheckInterval } = req.body;
    const policy = await advancedPerformanceOptimizationService.setupLoadBalancing(
      algorithm,
      serverInstances,
      healthCheckInterval
    );
    res.status(201).json(policy);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/report/generate', async (req: Request, res: Response) => {
  try {
    const { pageLoadTime, firstContentfulPaint, largestContentfulPaint, cumulativeLayoutShift, timingBudget } = req.body;
    const report = await advancedPerformanceOptimizationService.generateOptimizationReport(
      pageLoadTime,
      firstContentfulPaint,
      largestContentfulPaint,
      cumulativeLayoutShift,
      timingBudget
    );
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const metrics = await advancedPerformanceOptimizationService.getPerformanceMetrics({ start: startDate, end: endDate });
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
