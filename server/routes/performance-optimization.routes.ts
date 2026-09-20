import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { performanceOptimizationService } from '../services/performance-optimization.service';

const router = Router();

router.post('/query-performance', requireAuth, async (req: Request, res: Response) => {
  try {
    const { queryText, executionTime, rowsScanned, rowsReturned, indexUsed, index } = req.body;
    const performance = await performanceOptimizationService.recordQueryPerformance(
      queryText,
      executionTime,
      rowsScanned,
      rowsReturned,
      indexUsed,
      index
    );
    res.json(performance);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/cache-metrics', requireAuth, async (req: Request, res: Response) => {
  try {
    const { cacheType, hitCount, missCount, avgAccessTime, totalSize, evictionCount } = req.body;
    const metrics = await performanceOptimizationService.recordCacheMetrics(
      cacheType,
      hitCount,
      missCount,
      avgAccessTime,
      totalSize,
      evictionCount
    );
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/resource-utilization', requireAuth, async (req: Request, res: Response) => {
  try {
    const { resourceType, usage, peak, average, bottlenecks } = req.body;
    const utilization = await performanceOptimizationService.trackResourceUtilization(
      resourceType,
      usage,
      peak,
      average,
      bottlenecks
    );
    res.json(utilization);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/bottlenecks', requireAuth, async (req: Request, res: Response) => {
  try {
    const { type, severity, component, currentValue, threshold, estimatedImprovement, recommendation } = req.body;
    const bottleneck = await performanceOptimizationService.identifyBottleneck(
      type,
      severity,
      component,
      currentValue,
      threshold,
      estimatedImprovement,
      recommendation
    );
    res.json(bottleneck);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/suggestions', requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, description, estimatedImpact, effort, category, implementation, priority } = req.body;
    const suggestion = await performanceOptimizationService.generateOptimizationSuggestion(
      title,
      description,
      estimatedImpact,
      effort,
      category,
      implementation,
      priority
    );
    res.json(suggestion);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/reports', requireAuth, async (req: Request, res: Response) => {
  try {
    const { startTime, endTime } = req.body;
    const report = await performanceOptimizationService.generatePerformanceReport(
      new Date(startTime),
      new Date(endTime)
    );
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/index-recommendations', requireAuth, async (req: Request, res: Response) => {
  try {
    const { table, columns, estimatedBenefit, queryCount, priority } = req.body;
    const recommendation = await performanceOptimizationService.recommendIndex(
      table,
      columns,
      estimatedBenefit,
      queryCount,
      priority
    );
    res.json(recommendation);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/insights', requireAuth, async (req: Request, res: Response) => {
  try {
    const { startTime, endTime } = req.body;
    const insights = await performanceOptimizationService.getOptimizationInsights({
      start: new Date(startTime),
      end: new Date(endTime),
    });
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
