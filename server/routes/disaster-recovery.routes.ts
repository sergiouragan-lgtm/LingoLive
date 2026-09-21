import { Router, Request, Response } from 'express';
import { disasterRecoveryService } from '../services/disaster-recovery.service';

const router = Router();

router.post('/plans/create', async (req: Request, res: Response) => {
  try {
    const { name, rtoMinutes, rpoMinutes } = req.body;
    const plan = await disasterRecoveryService.createRecoveryPlan(name, rtoMinutes, rpoMinutes);
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/recovery-points/create', async (req: Request, res: Response) => {
  try {
    const { snapshotId } = req.body;
    const point = await disasterRecoveryService.createRecoveryPoint(snapshotId);
    res.status(201).json(point);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/failover/configure', async (req: Request, res: Response) => {
  try {
    const { primaryRegion, secondaryRegion, autoFailover } = req.body;
    const config = await disasterRecoveryService.configureFailover(primaryRegion, secondaryRegion, autoFailover);
    res.status(201).json(config);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await disasterRecoveryService.getDisasterRecoveryMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
