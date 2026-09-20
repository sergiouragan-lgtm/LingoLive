import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { analyticsDashboardService } from '../services/analytics.dashboard.service';

const router = Router();

router.get('/dashboard', requireAuth, async (req: any, res) => {
  try {
    const timeRange = (req.query.timeRange || '7d') as '24h' | '7d' | '30d';
    const metrics = await analyticsDashboardService.getDashboardMetrics(timeRange);
    res.json({ success: true, metrics });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/user-metrics/:userId', requireAuth, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const metrics = await analyticsDashboardService.getUserMetrics(userId);
    res.json({ success: true, metrics });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/timeseries', requireAuth, async (req: any, res) => {
  try {
    const { eventType, timeRange } = req.query;
    if (!eventType) return res.status(400).json({ error: 'eventType required' });

    const timeseries = await analyticsDashboardService.getEventTimeseries(
      eventType,
      (timeRange || '7d') as '24h' | '7d' | '30d'
    );
    res.json({ success: true, timeseries });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/top-features', requireAuth, async (req: any, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const features = await analyticsDashboardService.getTopFeatures(limit);
    res.json({ success: true, features });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/cohort-analysis', requireAuth, async (req: any, res) => {
  try {
    const cohortDays = Number(req.query.cohortDays) || 7;
    const cohorts = await analyticsDashboardService.getCohortAnalysis(cohortDays);
    res.json({ success: true, cohorts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
