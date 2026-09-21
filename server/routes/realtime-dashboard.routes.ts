import express, { Request, Response } from 'express';
import { realtimeDashboardService } from '../services/realtime-dashboard.service';
import { requireAuth } from '../middleware/requireAuth';

const router = express.Router();

router.get('/current', requireAuth, async (req: Request, res: Response) => {
  try {
    const dashboard = await realtimeDashboardService.getRealtimeDashboard();
    res.json(dashboard);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/activity-stream', requireAuth, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const stream = await realtimeDashboardService.getActivityStream(limit);
    res.json(stream);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/engagement-heatmap', requireAuth, async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const heatmap = await realtimeDashboardService.getEngagementHeatmap(days);
    res.json(heatmap);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/subscribers', requireAuth, async (req: Request, res: Response) => {
  try {
    const count = realtimeDashboardService.getSubscriberCount();
    res.json({ subscriberCount: count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/broadcast', requireAuth, async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;
    const update = {
      type: type || 'metric_update',
      data,
      timestamp: new Date(),
    };
    await realtimeDashboardService.broadcastUpdate(update);
    res.json({ success: true, message: 'Update broadcasted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
