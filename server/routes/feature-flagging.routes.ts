import { Router, Request, Response } from 'express';
import { featureFlaggingService } from '../services/feature-flagging.service';
const router = Router();
router.post('/flags/create', async (req: Request, res: Response) => {
  try {
    const { name, rollout } = req.body;
    const flag = await featureFlaggingService.createFeatureFlag(name, rollout);
    res.status(201).json(flag);
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await featureFlaggingService.getMetrics();
    res.status(200).json(metrics);
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
export default router;
