import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { realtimeLearnerAnalyticsService } from '../services/realtime-learner-analytics.service';

const router = Router();

router.post('/metrics/:userId', requireAuth, async (req: any, res) => {
  try {
    const { userId } = req.params;

    const metrics = await realtimeLearnerAnalyticsService.calculateRealtimeMetrics(userId);

    res.json({ success: true, metrics });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/activity-feed/:userId', requireAuth, async (req: any, res) => {
  try {
    const { userId } = req.params;

    const feed = await realtimeLearnerAnalyticsService.buildActivityFeed(userId);

    res.json({ success: true, feed });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/engagement-score/:userId', requireAuth, async (req: any, res) => {
  try {
    const { userId } = req.params;

    const score = await realtimeLearnerAnalyticsService.calculateEngagementScore(userId);

    res.json({ success: true, score });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/learning-velocity/:userId/:conceptId', requireAuth, async (req: any, res) => {
  try {
    const { userId, conceptId } = req.params;

    const velocity = await realtimeLearnerAnalyticsService.calculateLearningVelocity(userId, conceptId);

    res.json({ success: true, velocity });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/dashboard/:userId', requireAuth, async (req: any, res) => {
  try {
    const { userId } = req.params;

    const dashboard = await realtimeLearnerAnalyticsService.buildRealtimeDashboard(userId);

    res.json({ success: true, dashboard });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/metric-snapshot/:userId', requireAuth, async (req: any, res) => {
  try {
    const { userId } = req.body;
    const { metrics } = req.body;

    const snapshot = await realtimeLearnerAnalyticsService.recordMetricSnapshot(userId, metrics);

    res.json({ success: true, snapshot });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
