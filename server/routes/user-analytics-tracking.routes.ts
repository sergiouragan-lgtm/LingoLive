import { Router, Request, Response } from 'express';
import { userAnalyticsTrackingService } from '../services/user-analytics-tracking.service';
const router = Router();
router.post('/events/track', async (req: Request, res: Response) => {
  try { const { userId, eventType, metadata } = req.body; const event = await userAnalyticsTrackingService.trackUserEvent(userId, eventType, metadata); res.status(201).json(event); }
  catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
router.post('/segments/create', async (req: Request, res: Response) => {
  try { const { name, userCount } = req.body; const segment = await userAnalyticsTrackingService.createUserSegment(name, userCount); res.status(201).json(segment); }
  catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
router.get('/metrics', async (req: Request, res: Response) => {
  try { const metrics = await userAnalyticsTrackingService.getMetrics(); res.status(200).json(metrics); }
  catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
export default router;
